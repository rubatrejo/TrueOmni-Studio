import type { FeedAdapter, FeedTestResult, ProviderConfig, RawEvent, RawListing } from '../types';

/**
 * Adaptador de WordPress (REST API estándar `wp-json/wp/v2`).
 *
 * Es el adaptador más concreto del set porque el shape de la WP REST API es
 * público y estable. Los listings salen del postType `posts` (o uno configurable
 * vía `config.postType`); los events de un CPT opcional (`config.eventsPostType`,
 * p. ej. `tribe_events` de The Events Calendar).
 *
 * Config esperada:
 * - `baseUrl`         (requerido) — raíz del sitio, p. ej. `https://blog.cliente.com`.
 * - `postType`        (opcional)  — slug del postType de listings. Default `posts`.
 * - `eventsPostType`  (opcional)  — slug del CPT de eventos. Si falta, no se piden eventos.
 *
 * Las funciones de parseo (`parseWordPressPosts`) son PURAS para poder testearlas
 * sin red; `test`/`fetch` solo orquestan los `fetch` HTTP y delegan el mapeo.
 */

// Tope de items por página de la WP REST API (límite duro del core).
const WP_PER_PAGE = 100;

// ---------------------------------------------------------------------------
//  Tipos laxos del shape de WordPress (defensivos: todo opcional)
// ---------------------------------------------------------------------------

interface WpRendered {
  rendered?: unknown;
}

interface WpMedia {
  source_url?: unknown;
}

interface WpEmbedded {
  'wp:featuredmedia'?: unknown;
}

interface WpPost {
  id?: unknown;
  link?: unknown;
  title?: unknown;
  content?: unknown;
  excerpt?: unknown;
  _embedded?: unknown;
}

// ---------------------------------------------------------------------------
//  Helpers puros de narrowing
// ---------------------------------------------------------------------------

/** Devuelve el string si lo es (no vacío tras trim), si no undefined. */
function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const t = value.trim();
    return t === '' ? undefined : t;
  }
  if (typeof value === 'number') return String(value);
  return undefined;
}

/** Extrae el `.rendered` de un campo WP (`{ rendered: string }`). */
function rendered(value: unknown): string | undefined {
  if (value && typeof value === 'object' && 'rendered' in value) {
    return asString((value as WpRendered).rendered);
  }
  return asString(value);
}

/**
 * Decodifica las entidades HTML básicas que WP devuelve en `title.rendered`
 * (p. ej. `&amp;`, `&#8217;`). No intenta ser un parser HTML completo — el
 * normalizador hace el `stripHtml` pesado; aquí solo dejamos el título legible.
 */
export function decodeBasicEntities(input: string): string {
  return input
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&#x27;|&apos;|&#8217;|&#x2019;/gi, "'")
    .replace(/&#8220;|&#8221;|&#x201[cd];/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#0?32;/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

/** Saca la `source_url` del primer featured media embebido. */
function featuredImage(post: WpPost): string | undefined {
  const embedded = post._embedded;
  if (!embedded || typeof embedded !== 'object') return undefined;
  const media = (embedded as WpEmbedded)['wp:featuredmedia'];
  if (!Array.isArray(media) || media.length === 0) return undefined;
  const first = media[0];
  if (!first || typeof first !== 'object') return undefined;
  return asString((first as WpMedia).source_url);
}

// ---------------------------------------------------------------------------
//  Parseo puro
// ---------------------------------------------------------------------------

/**
 * Mapea el array crudo de posts de la WP REST API a `RawListing[]`. Defensiva:
 * descarta entradas sin `id` (no se pueden mergear por ID) y deja el resto de
 * campos como opcionales. La descripción prefiere `content`; si falta, usa el
 * `excerpt`.
 */
export function parseWordPressPosts(posts: unknown[]): RawListing[] {
  if (!Array.isArray(posts)) return [];
  const out: RawListing[] = [];
  for (const entry of posts) {
    if (!entry || typeof entry !== 'object') continue;
    const post = entry as WpPost;
    const providerId = asString(post.id);
    if (!providerId) continue;

    const rawTitle = rendered(post.title);
    const description = rendered(post.content) ?? rendered(post.excerpt);

    const listing: RawListing = { providerId };
    if (rawTitle) listing.title = decodeBasicEntities(rawTitle);
    if (description) listing.description = description;
    const website = asString(post.link);
    if (website) listing.website = website;
    const image = featuredImage(post);
    if (image) listing.image = image;

    out.push(listing);
  }
  return out;
}

/**
 * Mapea posts de un CPT de eventos a `RawEvent[]`. El core de WP no tiene un
 * shape de fecha de evento estándar, así que solo arrastramos los campos comunes
 * (título/descripción/imagen/website); la fecha real del evento la resuelve el
 * normalizador a partir de `date` si el plugin la expone — aquí no la inventamos.
 */
export function parseWordPressEvents(posts: unknown[]): RawEvent[] {
  return parseWordPressPosts(posts).map((listing) => {
    const event: RawEvent = { providerId: listing.providerId };
    if (listing.title) event.title = listing.title;
    if (listing.description) event.description = listing.description;
    if (listing.image) event.image = listing.image;
    if (listing.website) event.website = listing.website;
    return event;
  });
}

// ---------------------------------------------------------------------------
//  Adaptador
// ---------------------------------------------------------------------------

/** Normaliza el `baseUrl` quitando la barra final para componer rutas. */
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

/** Construye la URL del endpoint REST de un postType. */
function postsUrl(baseUrl: string, postType: string, perPage: number): string {
  const root = normalizeBaseUrl(baseUrl);
  return `${root}/wp-json/wp/v2/${postType}?per_page=${perPage}&_embed`;
}

/** Lee el JSON de una respuesta como array de objetos desconocidos. */
async function fetchJsonArray(url: string): Promise<unknown[]> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`WordPress respondió ${res.status} ${res.statusText} en ${url}`);
  }
  const json: unknown = await res.json();
  return Array.isArray(json) ? json : [];
}

export const wordpressAdapter: FeedAdapter = {
  provider: 'wordpress',

  async test(config: ProviderConfig): Promise<FeedTestResult> {
    const baseUrl = config.baseUrl?.trim();
    if (!baseUrl) {
      return { ok: false, message: 'Falta "baseUrl" en la configuración del feed de WordPress.' };
    }
    const postType = config.postType?.trim() || 'posts';
    try {
      // Fetch mínimo (una página de 1 item) para validar conectividad + shape.
      const url = postsUrl(baseUrl, postType, 1);
      const items = await fetchJsonArray(url);
      return {
        ok: true,
        message: `Conexión correcta con ${normalizeBaseUrl(baseUrl)} (postType "${postType}").`,
        sampleCount: items.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return { ok: false, message: `No se pudo conectar con WordPress: ${message}` };
    }
  },

  async fetch(config: ProviderConfig) {
    const baseUrl = config.baseUrl?.trim();
    if (!baseUrl) {
      throw new Error('Falta "baseUrl" en la configuración del feed de WordPress.');
    }
    const postType = config.postType?.trim() || 'posts';
    const eventsPostType = config.eventsPostType?.trim();

    const postsJson = await fetchJsonArray(postsUrl(baseUrl, postType, WP_PER_PAGE));
    const listings = parseWordPressPosts(postsJson);

    let events: RawEvent[] = [];
    if (eventsPostType) {
      const eventsJson = await fetchJsonArray(postsUrl(baseUrl, eventsPostType, WP_PER_PAGE));
      events = parseWordPressEvents(eventsJson);
    }

    return { listings, events };
  },
};
