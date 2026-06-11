import type { FeedAdapter, FeedTestResult, ProviderConfig, RawEvent, RawListing } from '../types';

/**
 * Adaptador "Custom" — para clientes que nos mandan su data en sus propios
 * endpoints JSON (no una API de DMS conocida). El operador pega dos URLs:
 * una de listings y otra de events.
 *
 * Soporta el shape más común que hemos visto en estos exports (p. ej. Discover
 * DeKalb: `https://discoverdekalb.com/feeds/partners/` y `/feeds/events/`):
 *
 *   { "entries": [ { entry_id, title, category_name, address1, latitude,
 *                    longitude, contact_phone, images: [...], website_url,
 *                    start_date, ... } ], "meta": { ... } }
 *
 * El parser es defensivo: acepta un array suelto o cualquiera de las envolturas
 * habituales (`entries`/`data`/`results`/`items`/`listings`/`events`), y cada
 * campo tiene varios alias. La limpieza/normalización (HTML, coords, fechas)
 * ocurre después en `normalize.ts`, no aquí.
 *
 * Config esperada:
 * - `listingsUrl` (opcional) — URL del feed JSON de listings.
 * - `eventsUrl`   (opcional) — URL del feed JSON de events.
 * - `apiKey`      (opcional) — si el feed lo pide; se envía como
 *                              `Authorization: Bearer` y como `?apikey=`.
 *
 * Al menos una de las dos URLs debe estar presente.
 */

// ---------------------------------------------------------------------------
//  Helpers puros de narrowing
// ---------------------------------------------------------------------------

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const t = value.trim();
    return t === '' ? undefined : t;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

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
 * Une address1/2/3 (los exports custom suelen partir la dirección en líneas).
 * Devuelve la primera línea no vacía concatenada con coma, o undefined.
 */
function joinAddress(item: Record<string, unknown>): string | undefined {
  const parts = [
    asString(pick(item, ['address1', 'address_1', 'address', 'streetAddress'])),
    asString(pick(item, ['address2', 'address_2'])),
    asString(pick(item, ['address3', 'address_3', 'city'])),
  ].filter((p): p is string => Boolean(p));
  return parts.length ? parts.join(', ') : undefined;
}

/**
 * Primera imagen de un campo `images` (array de strings o de objetos
 * `{url|src|image_url|path}`), con fallback a `logo_url`/`image`.
 */
function firstImage(item: Record<string, unknown>): string | undefined {
  const images = item.images;
  if (Array.isArray(images)) {
    for (const img of images) {
      const direct = asString(img);
      if (direct) return direct;
      if (img && typeof img === 'object') {
        const url = asString(
          pick(img as Record<string, unknown>, ['url', 'src', 'image_url', 'path', 'href']),
        );
        if (url) return url;
      }
    }
  }
  return asString(pick(item, ['image', 'imageUrl', 'image_url', 'logo_url', 'thumbnail', 'photo']));
}

/**
 * Primera categoría de un campo escalar (`category_name`/`category`) o de un
 * array `categories` (strings u objetos `{name|title|label}`).
 */
function firstCategory(item: Record<string, unknown>): string | undefined {
  const scalar = asString(pick(item, ['category_name', 'category', 'catName', 'primaryCategory']));
  if (scalar) return scalar;
  const cats = item.categories;
  if (Array.isArray(cats)) {
    for (const c of cats) {
      const direct = asString(c);
      if (direct) return direct;
      if (c && typeof c === 'object') {
        const name = asString(pick(c as Record<string, unknown>, ['name', 'title', 'label']));
        if (name) return name;
      }
    }
  }
  return undefined;
}

/**
 * Saca el array de items de cualquiera de las envolturas comunes, o el propio
 * valor si ya es un array. `[]` si no encuentra nada.
 */
function extractArray(json: unknown): Record<string, unknown>[] {
  let candidate: unknown = json;
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>;
    candidate =
      pick(obj, ['entries', 'data', 'results', 'listings', 'events', 'items', 'docs']) ?? json;
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

export function parseCustomListings(json: unknown): RawListing[] {
  const out: RawListing[] = [];
  for (const item of extractArray(json)) {
    const providerId = asString(
      pick(item, ['entry_id', 'id', 'listingId', 'listing_id', 'recordId']),
    );
    if (!providerId) continue;

    const listing: RawListing = { providerId };
    const title = asString(pick(item, ['title', 'name', 'companyName']));
    if (title) listing.title = title;
    const category = firstCategory(item);
    if (category) listing.category = category;
    const description = asString(pick(item, ['description', 'desc', 'summary']));
    if (description) listing.description = description;
    const address = joinAddress(item);
    if (address) listing.address = address;
    const phone = asString(
      pick(item, ['contact_phone', 'phone', 'contact_phone_alt', 'phone_number']),
    );
    if (phone) listing.phone = phone;
    const lat = asCoord(pick(item, ['latitude', 'lat']));
    if (lat !== undefined) listing.lat = lat;
    const lng = asCoord(pick(item, ['longitude', 'lng', 'lon', 'long']));
    if (lng !== undefined) listing.lng = lng;
    const website = asString(pick(item, ['website_url', 'url', 'website', 'link', 'web_url']));
    if (website) listing.website = website;
    const image = firstImage(item);
    if (image) listing.image = image;

    out.push(listing);
  }
  return out;
}

export function parseCustomEvents(json: unknown): RawEvent[] {
  const out: RawEvent[] = [];
  for (const item of extractArray(json)) {
    const providerId = asString(pick(item, ['entry_id', 'id', 'eventId', 'event_id', 'recordId']));
    if (!providerId) continue;

    const event: RawEvent = { providerId };
    const title = asString(pick(item, ['title', 'name', 'eventName']));
    if (title) event.title = title;
    const category = firstCategory(item);
    if (category) event.category = category;
    const description = asString(pick(item, ['description', 'desc', 'summary']));
    if (description) event.description = description;
    const date = asString(pick(item, ['start_date', 'startDate', 'date', 'eventStartDate']));
    if (date) event.date = date;
    const startTime = asString(pick(item, ['start_time', 'startTime', 'timeStart']));
    if (startTime) event.startTime = startTime;
    const endTime = asString(pick(item, ['end_time', 'endTime', 'timeEnd']));
    if (endTime) event.endTime = endTime;
    const venue = asString(pick(item, ['location_name', 'venue', 'venueName', 'location']));
    if (venue) event.venue = venue;
    const address = joinAddress(item);
    if (address) event.address = address;
    const phone = asString(pick(item, ['contact_phone', 'phone', 'phone_number']));
    if (phone) event.phone = phone;
    const lat = asCoord(pick(item, ['latitude', 'lat']));
    if (lat !== undefined) event.lat = lat;
    const lng = asCoord(pick(item, ['longitude', 'lng', 'lon', 'long']));
    if (lng !== undefined) event.lng = lng;
    const website = asString(pick(item, ['website_url', 'ticket_url', 'url', 'website', 'link']));
    if (website) event.website = website;
    const image = firstImage(item);
    if (image) event.image = image;

    out.push(event);
  }
  return out;
}

// ---------------------------------------------------------------------------
//  Request
// ---------------------------------------------------------------------------

function withApiKey(endpoint: string, apiKey: string | undefined): string {
  if (!apiKey) return endpoint;
  const sep = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${sep}apikey=${encodeURIComponent(apiKey)}`;
}

export async function fetchCustomJson(url: string, apiKey: string | undefined): Promise<unknown> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetch(withApiKey(url, apiKey), { headers });
  if (!res.ok) {
    throw new Error(`El feed respondió ${res.status} ${res.statusText} en ${url}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
//  Adaptador
// ---------------------------------------------------------------------------

export const customAdapter: FeedAdapter = {
  provider: 'custom',

  async test(config: ProviderConfig): Promise<FeedTestResult> {
    const listingsUrl = config.listingsUrl?.trim();
    const eventsUrl = config.eventsUrl?.trim();
    if (!listingsUrl && !eventsUrl) {
      return { ok: false, message: 'Add a Listings URL and/or an Events URL for the custom feed.' };
    }
    const apiKey = config.apiKey?.trim();
    try {
      let listingsCount = 0;
      let eventsCount = 0;
      if (listingsUrl) {
        listingsCount = parseCustomListings(await fetchCustomJson(listingsUrl, apiKey)).length;
      }
      if (eventsUrl) {
        eventsCount = parseCustomEvents(await fetchCustomJson(eventsUrl, apiKey)).length;
      }
      return {
        ok: true,
        message: `Custom feed OK — ${listingsCount} listings, ${eventsCount} events detected.`,
        sampleCount: listingsCount + eventsCount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return { ok: false, message: `Could not read the custom feed: ${message}` };
    }
  },

  async fetch(config: ProviderConfig) {
    const listingsUrl = config.listingsUrl?.trim();
    const eventsUrl = config.eventsUrl?.trim();
    if (!listingsUrl && !eventsUrl) {
      throw new Error('Add a Listings URL and/or an Events URL for the custom feed.');
    }
    const apiKey = config.apiKey?.trim();

    let listings: RawListing[] = [];
    let events: RawEvent[] = [];
    if (listingsUrl) {
      listings = parseCustomListings(await fetchCustomJson(listingsUrl, apiKey));
    }
    if (eventsUrl) {
      events = parseCustomEvents(await fetchCustomJson(eventsUrl, apiKey));
    }
    return { listings, events };
  },
};
