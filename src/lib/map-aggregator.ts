import type {
  EventItem,
  HomeMapModule,
  HomeModuleVariant,
  KioskConfig,
  Listing,
  MapSource,
} from './config';
import { addDays, todayISO } from './events-date';
import type { MapItem } from './map-item';
import { eventDateLabel, openTodayLabel } from './map-open-today';

/** Orden lógico de chips del Map (determina el orden en UI y en el pool). */
export const MAP_SOURCES: readonly MapSource[] = [
  'things-to-do',
  'restaurants',
  'stay',
  'events',
] as const;

/** Mapeo del chip lógico al valor `source` del MapItem. */
const CHIP_TO_SOURCE: Record<'play' | 'eat' | 'stay' | 'events', MapSource> = {
  play: 'things-to-do',
  eat: 'restaurants',
  stay: 'stay',
  events: 'events',
};

/** Keys de módulo por defecto si el cliente usa el naming estándar. */
const DEFAULT_MODULE_KEYS: Record<'play' | 'eat' | 'stay' | 'events', string> = {
  play: 'things-to-do',
  eat: 'restaurants',
  stay: 'stay',
  events: 'events',
};

/**
 * Jitter determinístico basado en slug + source.
 *
 * El seed data actual del config comparte coords entre los 3 módulos de
 * listings (cada punto geográfico tiene 1 restaurant + 1 thing-to-do + 1 stay
 * en el mismo lat/lng). Sin jitter los pins se apilan y sólo vemos uno.
 *
 * Estrategia:
 *   - Offset BASE por categoría (desplaza 3 pins coincidentes en un triángulo).
 *   - Offset FINO por slug (evita que 2 slugs de la misma categoría coincidan
 *     cuando la data original los asigna al mismo punto).
 *   - Eventos van sin bias direccional (tienen coords únicas nativas).
 *
 * Amp base ~0.0025° (~275 m) — notable en el mapa pero sin "saltar" a otra
 * colonia en zoom urbano.
 */
const SOURCE_BIAS: Record<MapSource, { dLat: number; dLng: number }> = {
  restaurants: { dLat: 0.0022, dLng: -0.0018 }, // NW
  'things-to-do': { dLat: 0.0022, dLng: 0.0018 }, // NE
  stay: { dLat: -0.002, dLng: 0 }, // S
  events: { dLat: 0, dLng: 0 }, // sin bias (coords ya únicas)
};

function jitterCoords(
  slug: string,
  source: MapSource,
  coords: { lat: number; lng: number },
): { lat: number; lng: number } {
  const seed = `${source}:${slug}`;
  let h1 = 5381;
  let h2 = 52711;
  for (let i = 0; i < seed.length; i += 1) {
    const c = seed.charCodeAt(i);
    h1 = (h1 * 33) ^ c;
    h2 = (h2 * 37) ^ c;
  }
  const nx = ((h1 >>> 0) % 1000) / 500 - 1; // [-1,1]
  const ny = ((h2 >>> 0) % 1000) / 500 - 1;
  const fineAmp = 0.001; // ~110m random por slug
  const bias = SOURCE_BIAS[source];
  return {
    lat: coords.lat + bias.dLat + nx * fineAmp,
    lng: coords.lng + bias.dLng + ny * fineAmp,
  };
}

function toMapItemFromListing(
  l: Listing,
  source: MapSource,
  moduleSlug: string,
  prefix: string,
): MapItem {
  return {
    source,
    moduleSlug,
    slug: l.slug,
    title: l.title,
    subcategory: l.subcategory,
    image: l.image,
    coords: jitterCoords(l.slug, source, l.coords),
    address: l.address,
    phone: l.phone,
    features: l.features,
    popularity: l.popularity,
    hours: l.hours,
    openTodayLabel: openTodayLabel(l, prefix),
    priceRange: l.priceRange,
  };
}

function toMapItemFromEvent(e: EventItem, moduleSlug: string): MapItem {
  return {
    source: 'events',
    moduleSlug,
    slug: e.slug,
    title: e.title,
    subcategory: e.category,
    image: e.image,
    coords: jitterCoords(e.slug, 'events', e.coords),
    address: e.address,
    phone: e.phone,
    features: e.features,
    popularity: e.popularity,
    dateLabel: eventDateLabel(e),
    priceMode: e.priceMode,
    priceRange: e.priceBand,
  };
}

function isListingsModule(
  m: HomeModuleVariant | undefined,
): m is Extract<HomeModuleVariant, { listings: Listing[] }> {
  return !!m && (m.kind === undefined || m.kind === 'listings');
}

function isEventsModule(
  m: HomeModuleVariant | undefined,
): m is Extract<HomeModuleVariant, { kind: 'events' }> {
  return !!m && m.kind === 'events';
}

/**
 * Agrega listings + events en `MapItem[]` a partir de los módulos del cliente.
 * Filtra Events a la ventana [hoy, hoy + eventsWindowDays].
 */
export function getMapItems(
  config: KioskConfig,
  mod: HomeMapModule,
  options?: { openUntilPrefix?: string; today?: string },
): MapItem[] {
  const modules = config.features?.home?.modules ?? {};
  const prefix = options?.openUntilPrefix ?? 'Open until';
  const today = options?.today ?? todayISO(config.client.timezone);
  const windowDays = mod.eventsWindowDays ?? 7;
  const windowEnd = addDays(today, windowDays);

  const moduleKeys = {
    play: mod.sources?.play ?? DEFAULT_MODULE_KEYS.play,
    eat: mod.sources?.eat ?? DEFAULT_MODULE_KEYS.eat,
    stay: mod.sources?.stay ?? DEFAULT_MODULE_KEYS.stay,
    events: mod.sources?.events ?? DEFAULT_MODULE_KEYS.events,
  } as const;

  const items: MapItem[] = [];

  for (const chip of ['play', 'eat', 'stay'] as const) {
    const key = moduleKeys[chip];
    const m = modules[key];
    if (!isListingsModule(m)) continue;
    const source = CHIP_TO_SOURCE[chip];
    for (const l of m.listings) {
      items.push(toMapItemFromListing(l, source, key, prefix));
    }
  }

  const evModuleKey = moduleKeys.events;
  const evModule = modules[evModuleKey];
  if (isEventsModule(evModule)) {
    for (const e of evModule.events) {
      if (e.date >= today && e.date <= windowEnd) {
        items.push(toMapItemFromEvent(e, evModuleKey));
      }
    }
  }

  return items;
}

/** Union ordenado de `features` presentes en los items (para el Filter overlay). */
export function buildFeaturePool(items: readonly MapItem[]): string[] {
  const set = new Set<string>();
  for (const it of items) for (const f of it.features) set.add(f);
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Union ordenado de `subcategory` presentes. */
export function buildSubcategoryPool(items: readonly MapItem[]): string[] {
  const set = new Set<string>();
  for (const it of items) set.add(it.subcategory);
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Devuelve qué chips tienen al menos 1 item (para ocultar chips vacíos). */
export function availableChips(items: readonly MapItem[]): Set<MapSource> {
  const out = new Set<MapSource>();
  for (const it of items) out.add(it.source);
  return out;
}
