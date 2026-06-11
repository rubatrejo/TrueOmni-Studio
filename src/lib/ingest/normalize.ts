import type { CleanFlag, EventContentItem, ListingContentItem } from '@/lib/studio/client-content';
import type { EventItem, ListingItem } from '@/lib/studio/schema';

import type { RawEvent, RawListing } from './types';

/**
 * Reglas de limpieza/normalización del contenido crudo de los feeds.
 *
 * Todo es puro y testeable (sin red ni KV). El resultado son
 * `ListingContentItem`/`EventContentItem` con `feedData` ya saneado y `flags`
 * que marcan los problemas detectados para la revisión manual. `status` queda
 * `flagged` cuando hay un problema "serio" (sin imagen/coords/fecha), si no
 * `active`. Items sin título se descartan (devuelven null): son inservibles.
 */

// Límites del schema destino (ver ListingItem/EventItem en schema.ts).
const MAX_DESCRIPTION = 4000;
const MAX_TITLE = 160;
const MAX_ADDRESS = 280;

// ---------------------------------------------------------------------------
//  Helpers puros de limpieza
// ---------------------------------------------------------------------------

/** Quita tags HTML y colapsa entidades/espacios comunes. */
export function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>(?=\s*\S)/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True si el string parece contener markup HTML. */
export function looksLikeHtml(input: string): boolean {
  return /<[a-z!/][^>]*>|&[a-z#0-9]+;/i.test(input);
}

/** Normaliza un teléfono a dígitos + separadores comunes; recorta basura. */
export function normalizePhone(input: string): string {
  const cleaned = input.replace(/[^\d+().\-\s]/g, '').trim();
  return cleaned.replace(/\s+/g, ' ').slice(0, 64);
}

/** Parsea una coordenada number|string. Devuelve null si no es finita. */
export function parseCoord(value: number | string | undefined): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/** Mapea un priceLevel crudo (número o `$`..`$$$$`) a 1–4. Default 2. */
export function mapPriceRange(value: number | string | undefined): 1 | 2 | 3 | 4 {
  if (typeof value === 'number') {
    const n = Math.round(value);
    return (Math.min(4, Math.max(1, n)) as 1 | 2 | 3 | 4) || 2;
  }
  if (typeof value === 'string') {
    const dollars = (value.match(/\$/g) || []).length;
    if (dollars >= 1) return Math.min(4, dollars) as 1 | 2 | 3 | 4;
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return Math.min(4, Math.max(1, n)) as 1 | 2 | 3 | 4;
  }
  return 2;
}

/**
 * Lleva una fecha cruda a `YYYY-MM-DD`. Acepta ISO, `YYYY-MM-DD…` y formatos
 * que `Date` entienda. Devuelve null si no es parseable.
 */
export function parseDateIso(input: string | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const ymd = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (ymd) return ymd[1];
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Normaliza una hora a `HH:MM` (24h). Default si no parseable. */
export function parseTimeHm(input: string | undefined, fallback: string): string {
  if (!input) return fallback;
  const m = /^(\d{1,2}):(\d{2})/.exec(input.trim());
  if (m) {
    const h = Math.min(23, Math.max(0, Number.parseInt(m[1], 10)));
    return `${String(h).padStart(2, '0')}:${m[2]}`;
  }
  return fallback;
}

function clamp(s: string, max: number): { value: string; truncated: boolean } {
  if (s.length <= max) return { value: s, truncated: false };
  return { value: s.slice(0, max), truncated: true };
}

// ---------------------------------------------------------------------------
//  Normalización de items
// ---------------------------------------------------------------------------

function makeId(feedId: string, providerId: string): string {
  return `${feedId}:${providerId}`;
}

/** `flagged` si hay algún problema serio; si no `active`. */
function statusFromFlags(flags: CleanFlag[], serious: CleanFlag[]): ListingContentItem['status'] {
  return flags.some((f) => serious.includes(f)) ? 'flagged' : 'active';
}

/**
 * Normaliza un `RawListing` a `ListingContentItem`. `nowIso` se inyecta para que
 * la función sea pura/determinista en tests. Null si el item no tiene título.
 */
export function normalizeListing(
  raw: RawListing,
  feedId: string,
  nowIso: string,
): ListingContentItem | null {
  const rawTitle = (raw.title ?? '').trim();
  if (!rawTitle) return null;

  const flags: CleanFlag[] = [];
  const feedData: Partial<ListingItem> = {};

  const title = clamp(rawTitle, MAX_TITLE);
  if (title.truncated) flags.push('truncated');
  feedData.title = title.value;

  if (raw.subcategory) feedData.subcategory = raw.subcategory.trim().slice(0, 64);

  const image = raw.image || raw.images?.[0] || '';
  if (image) feedData.image = image;
  else flags.push('missing-image');

  if (raw.description) {
    const hadHtml = looksLikeHtml(raw.description);
    const cleaned = stripHtml(raw.description);
    if (hadHtml) flags.push('html-stripped');
    const clamped = clamp(cleaned, MAX_DESCRIPTION);
    if (clamped.truncated && !flags.includes('truncated')) flags.push('truncated');
    feedData.description = clamped.value;
  }

  if (raw.address) {
    feedData.address = clamp(raw.address.trim(), MAX_ADDRESS).value;
  } else {
    flags.push('missing-address');
  }

  if (raw.phone) feedData.phone = normalizePhone(raw.phone);
  else flags.push('missing-phone');

  const lat = parseCoord(raw.lat);
  const lng = parseCoord(raw.lng);
  // Exige rango geográfico válido: los feeds a veces traen basura (p. ej. un
  // número de calle colado en `latitude`). Coords inválidas → missing (item
  // flagged para revisión), NUNCA se guardan fuera de rango: un solo item malo
  // invalidaría todo el documento contra el schema y se leería como vacío.
  if (
    lat != null &&
    lng != null &&
    !(lat === 0 && lng === 0) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    feedData.coords = { lat, lng };
  } else {
    flags.push('missing-coords');
  }

  if (raw.website) feedData.website = raw.website.trim().slice(0, 2048);
  if (raw.hours) feedData.hours = raw.hours.trim().slice(0, 64);
  feedData.priceRange = mapPriceRange(raw.priceLevel);
  if (raw.features?.length) {
    feedData.features = raw.features.map((f) => f.trim().slice(0, 64)).filter(Boolean);
  }

  return {
    id: makeId(feedId, raw.providerId),
    source: feedId,
    type: 'listing',
    feedCategory: (raw.category ?? '').trim().slice(0, 128),
    feedData,
    override: {},
    flags,
    status: statusFromFlags(flags, ['missing-image', 'missing-coords']),
    firstSeenAt: nowIso,
    lastSyncedAt: nowIso,
  };
}

/**
 * Normaliza un `RawEvent` a `EventContentItem`. Null si no tiene título. Sin
 * fecha válida → flag `missing-date` + `flagged` (el operador la corrige). Las
 * horas caen a un rango all-day si faltan.
 */
export function normalizeEvent(
  raw: RawEvent,
  feedId: string,
  nowIso: string,
): EventContentItem | null {
  const rawTitle = (raw.title ?? '').trim();
  if (!rawTitle) return null;

  const flags: CleanFlag[] = [];
  const feedData: Partial<EventItem> = {};

  const title = clamp(rawTitle, MAX_TITLE);
  if (title.truncated) flags.push('truncated');
  feedData.title = title.value;

  if (raw.category) feedData.category = raw.category.trim().slice(0, 64);

  const image = raw.image || raw.images?.[0] || '';
  if (image) feedData.image = image;
  else flags.push('missing-image');

  const date = parseDateIso(raw.date);
  if (date) feedData.date = date;
  else flags.push('missing-date');

  feedData.startTime = parseTimeHm(raw.startTime, '00:00');
  feedData.endTime = parseTimeHm(raw.endTime, '23:59');

  if (raw.venue) feedData.venue = raw.venue.trim().slice(0, 120);

  if (raw.description) {
    const hadHtml = looksLikeHtml(raw.description);
    const cleaned = stripHtml(raw.description);
    if (hadHtml) flags.push('html-stripped');
    const clamped = clamp(cleaned, MAX_DESCRIPTION);
    if (clamped.truncated && !flags.includes('truncated')) flags.push('truncated');
    feedData.description = clamped.value;
  }

  if (raw.address) feedData.address = clamp(raw.address.trim(), MAX_ADDRESS).value;
  if (raw.phone) feedData.phone = normalizePhone(raw.phone);

  const lat = parseCoord(raw.lat);
  const lng = parseCoord(raw.lng);
  // Exige rango geográfico válido: los feeds a veces traen basura (p. ej. un
  // número de calle colado en `latitude`). Coords inválidas → missing (item
  // flagged para revisión), NUNCA se guardan fuera de rango: un solo item malo
  // invalidaría todo el documento contra el schema y se leería como vacío.
  if (
    lat != null &&
    lng != null &&
    !(lat === 0 && lng === 0) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    feedData.coords = { lat, lng };
  } else {
    flags.push('missing-coords');
  }

  if (raw.website) feedData.website = raw.website.trim().slice(0, 2048);
  feedData.priceMode = raw.priceMode === 'paid' ? 'paid' : 'free';
  if (raw.features?.length) {
    feedData.features = raw.features.map((f) => f.trim().slice(0, 64)).filter(Boolean);
  }

  return {
    id: makeId(feedId, raw.providerId),
    source: feedId,
    type: 'event',
    feedCategory: (raw.category ?? '').trim().slice(0, 128),
    feedData,
    override: {},
    flags,
    status: statusFromFlags(flags, ['missing-image', 'missing-coords', 'missing-date']),
    firstSeenAt: nowIso,
    lastSyncedAt: nowIso,
  };
}

/**
 * Deduplica items por `id`, conservando el primero. (El feed puede repetir un
 * providerId.) Marca los descartados no se conserva; cuenta para el resumen.
 */
export function dedupeById<T extends { id: string }>(
  items: T[],
): { items: T[]; duplicates: number } {
  const seen = new Set<string>();
  const out: T[] = [];
  let duplicates = 0;
  for (const item of items) {
    if (seen.has(item.id)) {
      duplicates += 1;
      continue;
    }
    seen.add(item.id);
    out.push(item);
  }
  return { items: out, duplicates };
}
