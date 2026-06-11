import type { FeedAdapter, FeedTestResult, ProviderConfig, RawEvent, RawListing } from '../types';

/**
 * Adaptador de Simpleview DMS (Destination Management System).
 *
 * IMPORTANTE: el mapeo exacto de campos depende de la cuenta/feed real del
 * cliente; estos alias cubren los shapes comunes de Simpleview/Tempest y deben
 * confirmarse contra credenciales reales (riesgo documentado en el plan).
 *
 * Por eso NO hardcodeamos un endpoint: la URL completa del feed/API viene en
 * `config.endpoint` y la credencial en `config.apiKey`. El parser es defensivo y
 * acepta tanto un array suelto como las envolturas habituales
 * (`{ docs|data|results|listings|events: [...] }`).
 *
 * Config esperada:
 * - `endpoint` (requerido) — URL completa del feed de listings.
 * - `apiKey`   (opcional)  — se envía como header `Authorization: Bearer` y como
 *                            query `?apikey=` (las cuentas Simpleview varían).
 * - `eventsEndpoint` (opcional) — URL del feed de eventos, si es distinta.
 */

// ---------------------------------------------------------------------------
//  Helpers puros de narrowing
// ---------------------------------------------------------------------------

/** Devuelve el string limpio o undefined. Acepta number (lo stringifica). */
function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const t = value.trim();
    return t === '' ? undefined : t;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

/** Devuelve un number|string apto para coords (RawListing acepta ambos). */
function asCoord(value: unknown): number | string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  return undefined;
}

/** Primer alias presente (no vacío) de una lista de claves sobre un objeto. */
function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in obj && obj[key] != null && obj[key] !== '') return obj[key];
  }
  return undefined;
}

/**
 * Saca el array de items de cualquiera de las envolturas comunes de Simpleview,
 * o devuelve el propio valor si ya es un array. `[]` si no encuentra nada.
 */
function extractArray(json: unknown): Record<string, unknown>[] {
  let candidate: unknown = json;
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>;
    candidate = pick(obj, ['docs', 'data', 'results', 'listings', 'events', 'items']) ?? json;
  }
  if (!Array.isArray(candidate)) return [];
  return candidate.filter(
    (entry): entry is Record<string, unknown> =>
      entry != null && typeof entry === 'object' && !Array.isArray(entry),
  );
}

// ---------------------------------------------------------------------------
//  Parseo puro
// ---------------------------------------------------------------------------

/**
 * Mapea un payload de Simpleview/Tempest a `RawListing[]`. Defensivo: descarta
 * entradas sin un ID resoluble (no se pueden mergear). Los alias cubren las
 * variantes más vistas — confírmense contra el feed real del cliente.
 */
export function parseSimpleviewListings(json: unknown): RawListing[] {
  const out: RawListing[] = [];
  for (const item of extractArray(json)) {
    const providerId = asString(pick(item, ['id', 'listingId', 'listing_id', 'recordId']));
    if (!providerId) continue;

    const listing: RawListing = { providerId };
    const title = asString(pick(item, ['title', 'name', 'companyName', 'company_name']));
    if (title) listing.title = title;
    const category = asString(pick(item, ['category', 'catName', 'primaryCategory', 'cat_name']));
    if (category) listing.category = category;
    const subcategory = asString(pick(item, ['subcategory', 'subCatName', 'sub_category']));
    if (subcategory) listing.subcategory = subcategory;
    const description = asString(
      pick(item, ['description', 'listingDesc', 'listing_desc', 'desc']),
    );
    if (description) listing.description = description;
    const address = asString(pick(item, ['address', 'address1', 'address_1', 'streetAddress']));
    if (address) listing.address = address;
    const phone = asString(pick(item, ['phone', 'phoneNumber', 'phone_number', 'telephone']));
    if (phone) listing.phone = phone;
    const lat = asCoord(pick(item, ['latitude', 'lat']));
    if (lat !== undefined) listing.lat = lat;
    const lng = asCoord(pick(item, ['longitude', 'lng', 'lon', 'long']));
    if (lng !== undefined) listing.lng = lng;
    const website = asString(pick(item, ['url', 'website', 'weburl', 'web_url']));
    if (website) listing.website = website;
    const image = asString(pick(item, ['image', 'imageUrl', 'image_url', 'photo', 'thumbnail']));
    if (image) listing.image = image;

    out.push(listing);
  }
  return out;
}

/**
 * Mapea un payload de eventos de Simpleview/Tempest a `RawEvent[]`. Reusa los
 * mismos alias de listings y añade fecha/horas/venue (también con varios alias).
 */
export function parseSimpleviewEvents(json: unknown): RawEvent[] {
  const out: RawEvent[] = [];
  for (const item of extractArray(json)) {
    const providerId = asString(pick(item, ['id', 'eventId', 'event_id', 'listingId', 'recordId']));
    if (!providerId) continue;

    const event: RawEvent = { providerId };
    const title = asString(pick(item, ['title', 'name', 'eventName', 'event_name']));
    if (title) event.title = title;
    const category = asString(pick(item, ['category', 'catName', 'primaryCategory', 'cat_name']));
    if (category) event.category = category;
    const description = asString(pick(item, ['description', 'eventDesc', 'event_desc', 'desc']));
    if (description) event.description = description;
    const date = asString(pick(item, ['date', 'startDate', 'start_date', 'eventStartDate']));
    if (date) event.date = date;
    const startTime = asString(pick(item, ['startTime', 'start_time', 'timeStart']));
    if (startTime) event.startTime = startTime;
    const endTime = asString(pick(item, ['endTime', 'end_time', 'timeEnd']));
    if (endTime) event.endTime = endTime;
    const venue = asString(pick(item, ['venue', 'venueName', 'venue_name', 'location']));
    if (venue) event.venue = venue;
    const address = asString(pick(item, ['address', 'address1', 'address_1', 'streetAddress']));
    if (address) event.address = address;
    const phone = asString(pick(item, ['phone', 'phoneNumber', 'phone_number', 'telephone']));
    if (phone) event.phone = phone;
    const lat = asCoord(pick(item, ['latitude', 'lat']));
    if (lat !== undefined) event.lat = lat;
    const lng = asCoord(pick(item, ['longitude', 'lng', 'lon', 'long']));
    if (lng !== undefined) event.lng = lng;
    const website = asString(pick(item, ['url', 'website', 'weburl', 'web_url']));
    if (website) event.website = website;
    const image = asString(pick(item, ['image', 'imageUrl', 'image_url', 'photo', 'thumbnail']));
    if (image) event.image = image;

    out.push(event);
  }
  return out;
}

// ---------------------------------------------------------------------------
//  Construcción del request (compartida con el adaptador Tempest)
// ---------------------------------------------------------------------------

/** Añade `?apikey=` a la URL si hay credencial (sin pisar query existentes). */
function withApiKey(endpoint: string, apiKey: string | undefined): string {
  if (!apiKey) return endpoint;
  const sep = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${sep}apikey=${encodeURIComponent(apiKey)}`;
}

/** Fetch + parseo de JSON de un endpoint Simpleview-like. */
export async function fetchSimpleviewJson(
  endpoint: string,
  apiKey: string | undefined,
): Promise<unknown> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetch(withApiKey(endpoint, apiKey), { headers });
  if (!res.ok) {
    throw new Error(`El feed respondió ${res.status} ${res.statusText} en ${endpoint}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
//  Adaptador
// ---------------------------------------------------------------------------

export const simpleviewAdapter: FeedAdapter = {
  provider: 'simpleview',

  async test(config: ProviderConfig): Promise<FeedTestResult> {
    const endpoint = config.endpoint?.trim();
    if (!endpoint) {
      return { ok: false, message: 'Falta "endpoint" en la configuración del feed de Simpleview.' };
    }
    try {
      const json = await fetchSimpleviewJson(endpoint, config.apiKey?.trim());
      const listings = parseSimpleviewListings(json);
      return {
        ok: true,
        message: `Conexión correcta con el feed de Simpleview (${listings.length} listings detectados).`,
        sampleCount: listings.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return { ok: false, message: `No se pudo conectar con Simpleview: ${message}` };
    }
  },

  async fetch(config: ProviderConfig) {
    const endpoint = config.endpoint?.trim();
    if (!endpoint) {
      throw new Error('Falta "endpoint" en la configuración del feed de Simpleview.');
    }
    const apiKey = config.apiKey?.trim();
    const eventsEndpoint = config.eventsEndpoint?.trim();

    const listingsJson = await fetchSimpleviewJson(endpoint, apiKey);
    const listings = parseSimpleviewListings(listingsJson);

    let events: RawEvent[] = [];
    if (eventsEndpoint) {
      const eventsJson = await fetchSimpleviewJson(eventsEndpoint, apiKey);
      events = parseSimpleviewEvents(eventsJson);
    }

    return { listings, events };
  },
};
