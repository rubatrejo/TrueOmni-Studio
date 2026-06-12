import { z } from 'zod';

import { EventItemSchema, ListingItemSchema } from './schema';
import type { EventItem, ListingItem } from './schema';

/**
 * Modelo de **contenido a nivel cliente** — feeds de proveedores externos
 * (Simple View, Tempest, Crowdriff, WordPress) ingeridos, limpiados y mapeados,
 * que alimentan los listings/events de TODOS los productos del cliente
 * (kiosk, PWA, signage).
 *
 * Este archivo contiene SOLO el schema Zod + helpers puros (sin acceso a KV ni
 * red), para que lo puedan importar tanto los Client Components del Studio como
 * el pipeline de ingesta y los tests. La lógica de persistencia y propagación a
 * los productos vive en `client-content-sync.ts` (server-only).
 *
 * Source of truth: KV `client:{slug}:content`. Cada item guarda los campos
 * `feedData` (normalizados del proveedor) y `override` (ediciones manuales del
 * operador) por separado; el valor resuelto es `{ ...feedData, ...override }`.
 * Así el re-sync puede refrescar `feedData` sin pisar el trabajo manual.
 */

// ---------------------------------------------------------------------------
//  Proveedores y conexiones
// ---------------------------------------------------------------------------

export const FEED_PROVIDERS = [
  'simpleview',
  'tempest',
  'crowdriff',
  'wordpress',
  'custom',
] as const;
export const FeedProviderSchema = z.enum(FEED_PROVIDERS);
export type FeedProvider = z.infer<typeof FeedProviderSchema>;

export const FeedSyncSummarySchema = z.object({
  added: z.number().int().nonnegative().default(0),
  updated: z.number().int().nonnegative().default(0),
  removed: z.number().int().nonnegative().default(0),
  total: z.number().int().nonnegative().default(0),
});
export type FeedSyncSummary = z.infer<typeof FeedSyncSummarySchema>;

/**
 * Una conexión a un feed de proveedor. `config` es un mapa key→value flexible
 * porque cada proveedor pide credenciales distintas (apiKey, accountId,
 * endpoint, etc.). Son datos sensibles → viven solo en el KV privado del
 * cliente, nunca se exponen al preview/iframe.
 */
export const FeedConnectionSchema = z.object({
  id: z.string().min(1).max(64),
  provider: FeedProviderSchema,
  label: z.string().max(120).default(''),
  config: z.record(z.string(), z.string()).default({}),
  enabled: z.boolean().default(true),
  lastSyncedAt: z.string().optional(),
  lastSyncStatus: z.enum(['ok', 'error', 'never']).default('never'),
  lastSyncError: z.string().optional(),
  lastSyncSummary: FeedSyncSummarySchema.optional(),
});
export type FeedConnection = z.infer<typeof FeedConnectionSchema>;

// ---------------------------------------------------------------------------
//  Mapeo de categorías (N→1 + rename libre)
// ---------------------------------------------------------------------------

export const ContentTypeSchema = z.enum(['listing', 'event']);
export type ContentType = z.infer<typeof ContentTypeSchema>;

/**
 * Mapea una categoría cruda del feed (p. ej. "Outdoor Recreation") a un módulo
 * del kiosk (`moduleKey`, canónico o custom) con un nombre visible libre
 * (`label`, p. ej. "Experiences"). Varias categorías del feed pueden apuntar al
 * mismo `moduleKey` (N→1).
 */
export const CategoryMappingSchema = z.object({
  feedId: z.string().min(1).max(64),
  feedCategory: z.string().min(1).max(128),
  moduleKey: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-]*$/, {
      message: 'moduleKey must be lowercase, digits and hyphens.',
    }),
  /** Nombre visible del módulo destino (rename). Vacío = usar el default. */
  label: z.string().max(64).default(''),
  /**
   * Sub-categoría destino dentro del módulo. Vacío = la categoría va directo al
   * módulo (categoría principal); con valor = los items se agrupan bajo esta
   * sub-categoría dentro del módulo (override de la del item del feed solo si
   * está definida). Aplica solo a listings; los events no usan sub-categorías.
   */
  subcategory: z.string().max(64).default(''),
  contentType: ContentTypeSchema,
});
export type CategoryMapping = z.infer<typeof CategoryMappingSchema>;

// ---------------------------------------------------------------------------
//  Items de contenido
// ---------------------------------------------------------------------------

export const CleanFlagSchema = z.enum([
  'missing-image',
  'missing-coords',
  'missing-address',
  'missing-phone',
  'missing-date',
  'html-stripped',
  'truncated',
  'geocoded',
  'duplicate',
]);
export type CleanFlag = z.infer<typeof CleanFlagSchema>;

export const ContentItemStatusSchema = z.enum(['active', 'flagged', 'hidden', 'removed-upstream']);
export type ContentItemStatus = z.infer<typeof ContentItemStatusSchema>;

/** Campos editables de un listing/event como parciales (feedData / override). */
const ListingFieldsSchema = ListingItemSchema.partial();
const EventFieldsSchema = EventItemSchema.partial();

const ContentItemBase = {
  /** ID estable: `${provider}:${providerId}` (del feed) o `manual:${uuid}`. */
  id: z.string().min(1).max(256),
  /** `feedId` de origen, o `'manual'` para items creados a mano. */
  source: z.string().min(1).max(64),
  /** Categoría cruda del feed, usada para resolver el `moduleKey` destino. */
  feedCategory: z.string().max(128).default(''),
  flags: z.array(CleanFlagSchema).default([]),
  status: ContentItemStatusSchema.default('active'),
  firstSeenAt: z.string().optional(),
  lastSyncedAt: z.string().optional(),
};

export const ListingContentItemSchema = z.object({
  ...ContentItemBase,
  type: z.literal('listing'),
  feedData: ListingFieldsSchema.default({}),
  override: ListingFieldsSchema.default({}),
});
export type ListingContentItem = z.infer<typeof ListingContentItemSchema>;

export const EventContentItemSchema = z.object({
  ...ContentItemBase,
  type: z.literal('event'),
  feedData: EventFieldsSchema.default({}),
  override: EventFieldsSchema.default({}),
});
export type EventContentItem = z.infer<typeof EventContentItemSchema>;

// ---------------------------------------------------------------------------
//  Documento de contenido del cliente
// ---------------------------------------------------------------------------

export const ClientContentSchema = z.object({
  feeds: z.array(FeedConnectionSchema).default([]),
  categoryMap: z.array(CategoryMappingSchema).default([]),
  listings: z.array(ListingContentItemSchema).default([]),
  events: z.array(EventContentItemSchema).default([]),
  /**
   * Master switch del uso de la data ingerida. `true` (default) → la data del
   * feed se propaga a los productos; `false` → se ignora y kiosk/PWA quedan con
   * su contenido seed/default. Default `true` = comportamiento previo (retrocompat).
   */
  contentEnabled: z.boolean().default(true),
  /**
   * Foto de fallback global del cliente para listings/events ingeridos que no
   * traen imagen. Vacío = sin fallback (el item queda con `image: ''`).
   */
  placeholderImage: z.string().default(''),
  /** Token de optimistic concurrency; se incrementa en cada save. */
  currentVersion: z.number().int().nonnegative().default(0),
  lastSyncAt: z.string().optional(),
});
export type ClientContent = z.infer<typeof ClientContentSchema>;

/** Documento de contenido vacío y válido (cliente sin feeds aún). */
export function emptyClientContent(): ClientContent {
  return ClientContentSchema.parse({});
}

// ---------------------------------------------------------------------------
//  Helpers puros
// ---------------------------------------------------------------------------

/**
 * Convierte un `id` de item (`provider:providerId` | `manual:uuid`) a un slug
 * válido para `ListingItem`/`EventItem` (kebab-case). No garantiza unicidad
 * global — la propagación deduplica antes de escribir al catálogo del producto.
 */
export function idToSlug(id: string): string {
  const s = id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
    .replace(/-+$/g, '');
  return s || 'item';
}

/** Devuelve true si el item está visible para los productos (no oculto/removido). */
export function isItemVisible(item: { status: ContentItemStatus }): boolean {
  return item.status === 'active' || item.status === 'flagged';
}

/**
 * Resuelve un `ListingContentItem` a un `ListingItem` válido del kiosk
 * (`feedData` + `override` + slug derivado). Devuelve null si el merge no pasa
 * el schema (p. ej. falta título) — la propagación descarta esos.
 */
export function resolveListing(item: ListingContentItem): ListingItem | null {
  const merged = { ...item.feedData, ...item.override, slug: idToSlug(item.id) };
  const parsed = ListingItemSchema.safeParse(merged);
  return parsed.success ? parsed.data : null;
}

/** Resuelve un `EventContentItem` a un `EventItem` válido. Null si inválido. */
export function resolveEvent(item: EventContentItem): EventItem | null {
  const merged = { ...item.feedData, ...item.override, slug: idToSlug(item.id) };
  const parsed = EventItemSchema.safeParse(merged);
  return parsed.success ? parsed.data : null;
}

// ---------------------------------------------------------------------------
//  Sugerencia de módulo por categoría (autocompletar el mapeo)
// ---------------------------------------------------------------------------

export interface ModuleSuggestion {
  moduleKey: string;
  label: string;
}

/**
 * Sugiere un `moduleKey` + `label` para una categoría cruda de feed, para
 * acelerar el mapeo cuando un DMS trae decenas de categorías. Es solo una
 * heurística sobre palabras comunes (operator-facing, override libre): no es
 * contenido del cliente ni rompe el white-label.
 *
 * - Events → siempre el módulo `events`.
 * - Listings: restaurantes/comida → `restaurants` "Dine"; hospedaje → `stay`
 *   "Stay"; el resto (atracciones, shopping, servicios, venues…) → `things-to-do`
 *   "Experiences" como default razonable.
 */
export function suggestModuleForCategory(
  feedCategory: string,
  contentType: ContentType,
): ModuleSuggestion {
  if (contentType === 'event') return { moduleKey: 'events', label: 'Events' };
  const c = feedCategory.toLowerCase();
  if (/restaurant|dining|\bdine\b|food|drink|cuisine|\bbar\b|cafe|café|coffee|brew|winer/.test(c)) {
    return { moduleKey: 'restaurants', label: 'Dine' };
  }
  if (
    /hotel|motel|lodging|lodge|\bstay\b|accommodat|\binn\b|resort|breakfast|b&b|cabin|campground/.test(
      c,
    )
  ) {
    return { moduleKey: 'stay', label: 'Stay' };
  }
  return { moduleKey: 'things-to-do', label: 'Experiences' };
}

// ---------------------------------------------------------------------------
//  Merge editor → servidor (anti-clobber del autosave)
// ---------------------------------------------------------------------------

/**
 * Merge por id de los arrays de items que el editor manda contra los del
 * servidor. Protege los items **gestionados por el sync** (source != 'manual')
 * de ser borrados por un estado local stale del editor; del editor solo se
 * toman las ediciones que le pertenecen (`override` + `status`) y los items
 * **manuales** (alta/baja).
 */
function mergeContentItems<T extends ListingContentItem | EventContentItem>(
  serverItems: T[],
  incomingItems: T[],
): T[] {
  const incomingById = new Map(incomingItems.map((i) => [i.id, i]));
  const serverIds = new Set(serverItems.map((i) => i.id));
  const out: T[] = [];
  for (const s of serverItems) {
    const inc = incomingById.get(s.id);
    if (inc) {
      // Item en ambos: feedData/flags/source/feedCategory del SERVIDOR (los
      // posee el sync); override + status del EDITOR (ediciones de Review).
      out.push({ ...s, override: inc.override, status: inc.status });
    } else if (s.source !== 'manual') {
      // Item de feed que el editor no traía (estado stale) → se CONSERVA.
      out.push(s);
    }
    // Item manual ausente en incoming → el operador lo borró → se descarta.
  }
  for (const inc of incomingItems) {
    if (!serverIds.has(inc.id)) out.push(inc); // nuevo (manual) del editor
  }
  return out;
}

/**
 * Mergea un documento de contenido EDITADO (estado local del editor del Studio)
 * sobre el documento ACTUAL del servidor. Resuelve la race del autosave: el
 * editor mantiene todo el `ClientContent` en estado local y, tras un Sync (que
 * persiste listings/events server-side), su autosave mandaba el doc entero y
 * pisaba la data recién sincronizada. Con este merge eso ya no puede pasar.
 *
 * - `feeds`: del editor (config/label/enabled, alta/baja), pero conservando el
 *   estado de sync del servidor (`lastSync*`) para las conexiones que existen en
 *   ambos (el editor las tiene stale tras un Sync).
 * - `categoryMap`: del editor (lo posee).
 * - `listings`/`events`: ver `mergeContentItems` (feed items protegidos).
 * - `lastSyncAt`: del servidor (lo posee el sync).
 */
export function mergeEditorContent(server: ClientContent, incoming: ClientContent): ClientContent {
  const serverFeedById = new Map(server.feeds.map((f) => [f.id, f]));
  const feeds = incoming.feeds.map((f) => {
    const s = serverFeedById.get(f.id);
    if (!s) return f;
    return {
      ...f,
      lastSyncedAt: s.lastSyncedAt,
      lastSyncStatus: s.lastSyncStatus,
      lastSyncError: s.lastSyncError,
      lastSyncSummary: s.lastSyncSummary,
    };
  });

  return {
    feeds,
    categoryMap: incoming.categoryMap,
    listings: mergeContentItems(server.listings, incoming.listings),
    events: mergeContentItems(server.events, incoming.events),
    // Settings globales editables por el operador → vienen del documento entrante.
    contentEnabled: incoming.contentEnabled,
    placeholderImage: incoming.placeholderImage,
    lastSyncAt: server.lastSyncAt,
    currentVersion: incoming.currentVersion,
  };
}
