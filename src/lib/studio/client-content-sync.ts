import 'server-only';

import {
  CategoryMappingSchema,
  ClientContentSchema,
  EventContentItemSchema,
  FeedConnectionSchema,
  ListingContentItemSchema,
  emptyClientContent,
  isItemVisible,
  resolveEvent,
  resolveListing,
} from './client-content';
import type { ClientContent } from './client-content';
import { clientKeys } from './client-manifest';
import { kv, kvKeys } from './kv';
import { defaultEvents } from './schema';
import type {
  EventItem,
  KioskConfig,
  ListingItem,
  ListingsCatalogEntry,
  ListingsModule,
} from './schema';

/**
 * Persistencia del **contenido a nivel cliente** (`client:{slug}:content`).
 *
 * Source of truth de los listings/events ingeridos de feeds. La propagación a
 * los productos (cfg/pwa/signage) vive en este mismo módulo (Fase 6); aquí, de
 * momento, el CRUD del documento con control de versión optimista.
 *
 * El schema y los helpers puros están en `client-content.ts` (no server-only)
 * para que los reusen la UI del Studio y los tests.
 */

// ---------------------------------------------------------------------------
//  KV CRUD
// ---------------------------------------------------------------------------

/** Carga el contenido del cliente. Null si nunca se ha inicializado. */
export async function loadClientContent(slug: string): Promise<ClientContent | null> {
  const raw = await kv.get<unknown>(clientKeys.content(slug));
  if (!raw) return null;
  const parsed = ClientContentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  // Resiliencia: un único item con data inválida (p. ej. coords fuera de rango
  // que un feed trajo sucias) NO debe nukear todo el documento y leerse como
  // vacío. Validamos por partes y descartamos solo los items inválidos.
  return salvageClientContent(raw);
}

/**
 * Reconstruye un `ClientContent` válido a partir de uno crudo que no pasó el
 * schema completo, descartando los items/entradas inválidos en lugar de perder
 * todo el documento. Null si ni siquiera el esqueleto es recuperable.
 */
function salvageClientContent(raw: unknown): ClientContent | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
  const keepValid = <T>(
    items: unknown[],
    schema: { safeParse: (x: unknown) => { success: boolean; data?: T } },
  ): T[] => {
    const out: T[] = [];
    for (const it of items) {
      const p = schema.safeParse(it);
      if (p.success && p.data !== undefined) out.push(p.data);
    }
    return out;
  };
  const candidate = {
    feeds: keepValid(asArray(r.feeds), FeedConnectionSchema),
    categoryMap: keepValid(asArray(r.categoryMap), CategoryMappingSchema),
    listings: keepValid(asArray(r.listings), ListingContentItemSchema),
    events: keepValid(asArray(r.events), EventContentItemSchema),
    currentVersion: typeof r.currentVersion === 'number' ? r.currentVersion : 0,
    lastSyncAt: typeof r.lastSyncAt === 'string' ? r.lastSyncAt : undefined,
  };
  const parsed = ClientContentSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/** Carga el contenido del cliente, o un documento vacío si no existe. */
export async function loadClientContentOrEmpty(slug: string): Promise<ClientContent> {
  return (await loadClientContent(slug)) ?? emptyClientContent();
}

/** Escribe el contenido tal cual (sin tocar la versión). Uso interno. */
export async function saveClientContentRaw(slug: string, content: ClientContent): Promise<void> {
  await kv.set(clientKeys.content(slug), content);
}

export interface SaveContentResult {
  ok: boolean;
  /** Conflicto de versión: el cliente envió un `ifVersion` desfasado. */
  conflict?: boolean;
  /** Versión persistida tras el save (currentVersion + 1). */
  version?: number;
  /** Versión actual en KV cuando hubo conflicto. */
  currentVersion?: number;
}

/**
 * Guarda el contenido con **optimistic concurrency**. Si `ifVersion` se pasa y
 * no coincide con el `currentVersion` en KV, devuelve `conflict: true` sin
 * escribir (mismo patrón que el PATCH de configs del kiosk). En caso de éxito
 * incrementa `currentVersion` y devuelve la nueva versión.
 *
 * Nota: el KV no expone CAS/Lua, así que queda una ventana get→set de
 * microsegundos, despreciable para la concurrencia real del Studio.
 */
export async function saveClientContent(
  slug: string,
  content: ClientContent,
  ifVersion?: number,
): Promise<SaveContentResult> {
  const existing = await loadClientContent(slug);
  const currentVersion = existing?.currentVersion ?? 0;

  if (ifVersion != null && ifVersion !== currentVersion) {
    return { ok: false, conflict: true, currentVersion };
  }

  const nextVersion = currentVersion + 1;
  const next: ClientContent = { ...content, currentVersion: nextVersion };
  await saveClientContentRaw(slug, next);
  return { ok: true, version: nextVersion };
}

// ---------------------------------------------------------------------------
//  Propagación a los productos
// ---------------------------------------------------------------------------

/** Icono Lucide por módulo canónico; fallback para módulos custom. */
const CANONICAL_MODULE_ICON: Record<string, string> = {
  restaurants: 'UtensilsCrossed',
  'things-to-do': 'Sparkles',
  stay: 'BedDouble',
  events: 'CalendarDays',
};

function iconForModule(key: string): string {
  return CANONICAL_MODULE_ICON[key] ?? 'MapPin';
}

function titleCaseSlug(key: string): string {
  return key
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function uniqStrings(arr: string[]): string[] {
  return [...new Set(arr.filter((s) => s && s.trim() !== ''))];
}

/**
 * Garantiza slugs únicos dentro de un catálogo (el schema lo exige). Dos ids de
 * feed distintos pueden colapsar al mismo slug → se les añade un sufijo -2, -3…
 */
function ensureUniqueSlugs<T extends { slug: string }>(items: T[]): T[] {
  const seen = new Map<string, number>();
  return items.map((it) => {
    const n = seen.get(it.slug) ?? 0;
    seen.set(it.slug, n + 1);
    if (n === 0) return it;
    return { ...it, slug: `${it.slug}-${n + 1}`.slice(0, 96) };
  });
}

/**
 * Aplica el contenido del cliente sobre un `KioskConfig` (función PURA, sin KV).
 *
 * - **Listings:** agrupa los items visibles por el `moduleKey` que resuelve su
 *   `categoryMap` (N→1). Cada grupo se vuelve un `ListingsCatalogEntry` marcado
 *   `feedConnected`. Los módulos manuales preexistentes (sin `feedConnected` y
 *   cuyo key no recibe feed) se conservan intactos. Items sin mapeo no se
 *   propagan (el operador debe mapearlos primero).
 * - **Events:** todos los items visibles van al único módulo Events del kiosk,
 *   marcado `feedConnected`. Si no hay events de feed, se deja el módulo tal cual.
 *
 * Kiosk y PWA comparten este config, así que con esto ambos quedan alimentados.
 * Signage no persiste listings/events (resuelve events en runtime) → fuera de
 * alcance de esta propagación.
 */
export function applyContentToKiosk(cfg: KioskConfig, content: ClientContent): KioskConfig {
  // Master switch: si el operador apagó el uso de la data del feed, no se
  // propaga nada y los productos quedan con su contenido seed/default.
  if (content.contentEnabled === false) return cfg;

  // Foto de fallback global para items sin imagen (vacío = sin fallback).
  const placeholder = content.placeholderImage?.trim() ?? '';
  const withPlaceholder = <T extends { image?: string }>(item: T): T =>
    placeholder && !item.image ? { ...item, image: placeholder } : item;

  // --- Listings agrupados por módulo destino ---
  const byModule = new Map<string, { label: string; items: ListingItem[] }>();
  for (const item of content.listings) {
    if (!isItemVisible(item)) continue;
    const mapping = content.categoryMap.find(
      (cm) =>
        cm.contentType === 'listing' &&
        cm.feedId === item.source &&
        cm.feedCategory === item.feedCategory,
    );
    if (!mapping) continue;
    const resolved = resolveListing(item);
    if (!resolved) continue;
    const group = byModule.get(mapping.moduleKey) ?? { label: mapping.label, items: [] };
    if (mapping.label) group.label = mapping.label;
    group.items.push(withPlaceholder(resolved));
    byModule.set(mapping.moduleKey, group);
  }

  // Fotos de sub-categoría existentes por módulo (subidas por el operador) para
  // NO perderlas en cada re-sync. Se podan a las sub-categorías que siguen vivas.
  const prevSubImagesByKey = new Map<string, Record<string, string>>();
  for (const m of cfg.listings ?? []) {
    const imgs = m.catalog?.subcategoryImages;
    if (imgs && Object.keys(imgs).length > 0) prevSubImagesByKey.set(m.key, imgs);
  }

  const feedEntries: ListingsCatalogEntry[] = [...byModule.entries()].map(([key, g]) => {
    const items = ensureUniqueSlugs(g.items);
    const subcategories = uniqStrings(items.map((i) => i.subcategory));
    const prevImgs = prevSubImagesByKey.get(key);
    const subcategoryImages: Record<string, string> = {};
    if (prevImgs) {
      for (const name of subcategories) {
        if (prevImgs[name]) subcategoryImages[name] = prevImgs[name];
      }
    }
    return {
      key,
      label: g.label || titleCaseSlug(key),
      iconKey: iconForModule(key),
      enabled: true,
      feedConnected: true,
      catalog: {
        heroImage: '',
        subcategories,
        subcategoryImages,
        features: uniqStrings(items.flatMap((i) => i.features)),
        listings: items,
      },
    };
  });

  const feedKeys = new Set(byModule.keys());
  const manualModules = (cfg.listings ?? []).filter(
    (m) => !feedKeys.has(m.key) && !m.feedConnected,
  );
  const nextListings: ListingsModule = [...manualModules, ...feedEntries];

  // --- Events: todos los visibles a un solo módulo ---
  const eventItems = ensureUniqueSlugs(
    content.events
      .filter(isItemVisible)
      .map(resolveEvent)
      .filter((e): e is EventItem => e !== null)
      .map(withPlaceholder),
  );
  let nextEvents = cfg.events;
  if (eventItems.length > 0) {
    const base = cfg.events ?? defaultEvents();
    nextEvents = {
      ...base,
      feedConnected: true,
      categories: uniqStrings(eventItems.map((e) => e.category)),
      venues: uniqStrings(eventItems.map((e) => e.venue)),
      events: eventItems,
    };
  }

  return { ...cfg, listings: nextListings, events: nextEvents };
}

export interface ContentSyncResult {
  kiosk: 'ok' | 'absent' | 'failed';
}

/**
 * Propaga el contenido del cliente al config del kiosk (`cfg:{slug}`), que el
 * kiosk y la PWA comparten. No-op si el cliente no tiene contenido o no existe
 * el kiosk. Best-effort: los errores no se lanzan, se reportan en el resultado.
 */
export async function syncContentToProducts(slug: string): Promise<ContentSyncResult> {
  const content = await loadClientContent(slug);
  if (!content) return { kiosk: 'absent' };
  try {
    const cfg = await kv.get<KioskConfig>(kvKeys.cfg(slug));
    if (!cfg) return { kiosk: 'absent' };
    await kv.set(kvKeys.cfg(slug), applyContentToKiosk(cfg, content));
    return { kiosk: 'ok' };
  } catch {
    return { kiosk: 'failed' };
  }
}
