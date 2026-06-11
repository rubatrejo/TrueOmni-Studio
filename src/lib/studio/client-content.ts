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
