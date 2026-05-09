import type { AiQuestion, ItineraryStopKind } from './config';
import type { ItineraryCatalogItem } from './itinerary-catalog';

/**
 * Generador del AI Trip Builder (Fase 3.17).
 *
 * v1: mockeado en cliente. Para Fase 5+ reemplazar la implementación de
 * `generateItinerary` por una llamada real a un endpoint LLM (`/api/itinerary`)
 * que devuelva el mismo `GeneratedItinerary`. La interfaz queda estable.
 */

export type AiPreferences = Record<string, string | string[] | undefined>;

export type GeneratedEntryKind = 'breakfast' | 'lunch' | 'dinner' | 'activity' | 'event';

export interface GeneratedEntry {
  kind: GeneratedEntryKind;
  /** Slug del item seleccionado del catálogo. */
  slug: string;
  /** Discriminador del bucket. */
  itemKind: ItineraryStopKind;
  moduleSlug: string;
  /** Título del item (snapshot, para que el resultado no requiera el catálogo). */
  title: string;
  /** Descripción/prosa del entry generada por la IA mock. */
  description: string;
}

export interface GeneratedDay {
  /** Label de la pestaña del Final Result (ej. "Day 1"). */
  label: string;
  entries: GeneratedEntry[];
}

export interface GeneratedItinerary {
  /** Cero = "few hours" (lista corta sin tabs DAY) · 1 / 3 según `duration`. */
  days: GeneratedDay[];
  /** Eventos sugeridos (tab EVENTS del Final Result). */
  events: GeneratedEntry[];
  /** Resumen del título del Final Result, ej. "Itinerary for Weekend Trip". */
  title: string;
}

export interface GenerateItineraryOptions {
  preferences: AiPreferences;
  questions: AiQuestion[];
  catalog: ItineraryCatalogItem[];
  /** Plantilla del título. Soporta `{client_name}` y `{duration_label}`. */
  titleTemplate?: string;
  clientName?: string;
  /** Delay artificial en ms para simular la latencia del LLM. Default 2400. */
  delayMs?: number;
  /** Plantilla del label del día, ej. "Day {n}" tokenizado. */
  dayLabelTemplate?: string;
  /** Label cuando duration=0 ("A Few Hours"). */
  planLabel?: string;
  /** Fallback de la duración si no hay match con la pregunta. */
  durationFallback?: string;
  /** Frases narrativas por kind (mockeadas v1). Si se omite, usa defaults. */
  mealPhrases?: Record<GeneratedEntryKind, string[]>;
}

const DEFAULT_DELAY_MS = 2400;

/**
 * Devuelve el número de días asociado a la opción `duration` seleccionada
 * (depende del schema config-driven). Si no hay match, default 1.
 */
function resolveDays(preferences: AiPreferences, questions: AiQuestion[]): number {
  const durationQ = questions.find((q) => q.key === 'duration');
  if (!durationQ) return 1;
  const value = preferences['duration'];
  if (typeof value !== 'string') return 1;
  const opt = durationQ.options.find((o) => o.value === value);
  return opt?.days ?? 1;
}

function durationLabel(
  preferences: AiPreferences,
  questions: AiQuestion[],
  fallback: string,
): string {
  const durationQ = questions.find((q) => q.key === 'duration');
  if (!durationQ) return fallback;
  const value = preferences['duration'];
  if (typeof value !== 'string') return fallback;
  return durationQ.options.find((o) => o.value === value)?.label ?? fallback;
}

const interp = (tpl: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), tpl);

/** Calcula un score de matching entre item y preferencias multi-tag. */
function scoreItem(item: ItineraryCatalogItem, preferences: AiPreferences): number {
  let score = item.popularity ?? 0;
  Object.values(preferences).forEach((val) => {
    if (Array.isArray(val)) {
      val.forEach((v) => {
        if (
          item.features.some((f) => f.toLowerCase().includes(v.toLowerCase())) ||
          item.subcategory.toLowerCase().includes(v.toLowerCase())
        ) {
          score += 25;
        }
      });
    } else if (typeof val === 'string') {
      if (
        item.features.some((f) => f.toLowerCase().includes(val.toLowerCase())) ||
        item.subcategory.toLowerCase().includes(val.toLowerCase())
      ) {
        score += 15;
      }
    }
  });
  return score;
}

const DEFAULT_MEAL_PHRASES: Record<GeneratedEntryKind, string[]> = {
  breakfast: ['Start your day at', 'Kick things off with breakfast at', 'Morning fuel: head to'],
  lunch: ['Lunch break at', 'Take a midday pause at', 'Refuel with lunch at'],
  dinner: ['Wrap up the day with dinner at', 'End on a high note at', 'Dinner at'],
  activity: ['Then head to', 'Spend a couple of hours at', 'Make your way to'],
  event: ['Catch the action at', 'Don’t miss', 'Make time for'],
};

const pick = <T>(arr: readonly T[], i: number): T => arr[i % arr.length] as T;

function entryFor(
  kind: GeneratedEntryKind,
  item: ItineraryCatalogItem,
  i: number,
  phrases: Record<GeneratedEntryKind, string[]>,
): GeneratedEntry {
  const lead = pick(phrases[kind], i);
  return {
    kind,
    slug: item.slug,
    itemKind: item.kind,
    moduleSlug: item.moduleSlug,
    title: item.title,
    description: `${lead} ${item.title} — ${item.subcategory.toLowerCase()}, ${item.address.split(',')[0] ?? ''}.`,
  };
}

/**
 * Implementación mock v1 de `generateItinerary`.
 *
 * Algoritmo simple:
 * - Days = `duration.options[chosen].days` (0/1/3).
 * - Para cada día, slot meals (breakfast/lunch/dinner) tomando los listings
 *   con mayor score (popularity + tag matches), evitando duplicados.
 * - Slot 1 actividad por día desde things-to-do/trails.
 * - Tab Events con los 3 eventos top por score.
 */
export async function generateItinerary(
  opts: GenerateItineraryOptions,
): Promise<GeneratedItinerary> {
  const {
    preferences,
    questions,
    catalog,
    titleTemplate = 'Itinerary for {duration_label}',
    clientName = '',
    delayMs = DEFAULT_DELAY_MS,
    dayLabelTemplate = 'Day {n}',
    planLabel = 'Plan',
    durationFallback = 'Trip',
    mealPhrases = DEFAULT_MEAL_PHRASES,
  } = opts;

  const days = resolveDays(preferences, questions);

  // Particiones por kind/moduleSlug.
  const restaurants = catalog
    .filter((it) => it.kind === 'listing' && it.moduleSlug === 'restaurants')
    .sort((a, b) => scoreItem(b, preferences) - scoreItem(a, preferences));
  const activities = catalog
    .filter(
      (it) => (it.kind === 'listing' && it.moduleSlug !== 'restaurants') || it.kind === 'trail',
    )
    .sort((a, b) => scoreItem(b, preferences) - scoreItem(a, preferences));
  const events = catalog
    .filter((it) => it.kind === 'event')
    .sort((a, b) => scoreItem(b, preferences) - scoreItem(a, preferences));

  // Track de items ya usados para evitar repetidos.
  const used = new Set<string>();
  const takeNext = (pool: ItineraryCatalogItem[]) =>
    pool.find((it) => !used.has(`${it.kind}:${it.slug}`));

  const generatedDays: GeneratedDay[] = [];

  if (days === 0) {
    // "A Few Hours" → lista corta: 1 actividad + 1 lunch.
    const a = takeNext(activities);
    if (a) {
      used.add(`${a.kind}:${a.slug}`);
      generatedDays.push({
        label: planLabel,
        entries: [entryFor('activity', a, 0, mealPhrases)],
      });
    }
    const r = takeNext(restaurants);
    if (r) {
      used.add(`${r.kind}:${r.slug}`);
      generatedDays[0]?.entries.push(entryFor('lunch', r, 0, mealPhrases));
    }
  } else {
    for (let d = 0; d < days; d++) {
      const entries: GeneratedEntry[] = [];
      const breakfast = takeNext(restaurants);
      if (breakfast) {
        used.add(`${breakfast.kind}:${breakfast.slug}`);
        entries.push(entryFor('breakfast', breakfast, d, mealPhrases));
      }
      const activity = takeNext(activities);
      if (activity) {
        used.add(`${activity.kind}:${activity.slug}`);
        entries.push(entryFor('activity', activity, d, mealPhrases));
      }
      const lunch = takeNext(restaurants);
      if (lunch) {
        used.add(`${lunch.kind}:${lunch.slug}`);
        entries.push(entryFor('lunch', lunch, d, mealPhrases));
      }
      const eventsPick = takeNext(events);
      if (eventsPick) {
        used.add(`${eventsPick.kind}:${eventsPick.slug}`);
        entries.push(entryFor('event', eventsPick, d, mealPhrases));
      }
      const dinner = takeNext(restaurants);
      if (dinner) {
        used.add(`${dinner.kind}:${dinner.slug}`);
        entries.push(entryFor('dinner', dinner, d, mealPhrases));
      }
      generatedDays.push({
        label: dayLabelTemplate.replace('{n}', String(d + 1)),
        entries,
      });
    }
  }

  const eventsTab: GeneratedEntry[] = events
    .filter((it) => !used.has(`${it.kind}:${it.slug}`))
    .slice(0, 3)
    .map((e, i) => entryFor('event', e, i, mealPhrases));

  const title = interp(titleTemplate, {
    client_name: clientName,
    duration_label: durationLabel(preferences, questions, durationFallback),
  });

  if (delayMs > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  }

  return { days: generatedDays, events: eventsTab, title };
}
