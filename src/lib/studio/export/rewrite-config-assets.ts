/**
 * Reescritura de referencias de imagen del config de un kiosk, para el export
 * STANDALONE (Fase 1 del milestone "Publish → Kiosk Standalone"). Funciones
 * PURAS, sin red — la descarga/copia que produce el mapa source→local es la
 * Fase 2.
 *
 * `collectImageRefs` recoge las URLs/paths que viven en CAMPOS DE IMAGEN
 * (allowlist por nombre de campo), NUNCA en campos de link (`website`,
 * `ticketsUrl`, `threshold360Url`, `directionsUrl`, `qrUrl`, …). Descargar un
 * link sería un bug (217 `website` en el config default). `rewriteImageRefs`
 * sustituye cada ref por su path local respetando el MISMO contexto de campo
 * (un link que casualmente comparta URL con una imagen NO se reescribe), sin
 * mutar la entrada.
 *
 * El "contexto de imagen" se HEREDA hacia abajo: dentro de `galleryUrls` (array
 * de strings) o `subcategoryImages` (objeto {clave: url}) los descendientes son
 * imágenes aunque su clave no esté en la allowlist.
 */

/** Campos cuyo valor (o cuyos descendientes string) son imágenes/media a materializar. */
export const IMAGE_FIELDS: ReadonlySet<string> = new Set([
  'image',
  'heroImage',
  'hero_image',
  'cover',
  'avatar',
  'thumbnail',
  'mediaUrl',
  'videoPoster',
  'heroVideo',
  'loading_image',
  'background',
  'photo',
  'pinImage',
  'circleImage',
  'menuImage',
  'logo',
  'idleLogo',
  'footerLogo',
  'favicon',
  // Hero del Home (branding.homeHero.{src}) y fondo idle compartido del Billboard
  // (features.billboard_background.{src}) — el contexto de imagen baja al `src`.
  // La PWA standalone los hereda, así que deben materializarse en el export.
  'homeHero',
  'billboard_background',
  'shareBackground',
  'shareCardLogo',
  'qrLogo',
  'poster',
  'galleryUrls',
  'subcategoryImages',
  // headers / heros de módulo (estructura real del config)
  'wizardHeroImage',
  'fallbackHero',
  'loadingImage',
  'headerImage',
  'hero_image',
]);

/** ¿El string es una referencia a un asset materializable (http/data/relativo assets)? */
function isAssetRef(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false;
  return (
    /^https?:\/\//i.test(value) ||
    value.startsWith('data:') ||
    value.startsWith('assets/') ||
    value.startsWith('/assets/')
  );
}

function collect(value: unknown, inImage: boolean, out: Set<string>): void {
  if (typeof value === 'string') {
    if (inImage && isAssetRef(value)) out.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collect(v, inImage, out);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) collect(v, inImage || IMAGE_FIELDS.has(k), out);
  }
}

/** Refs únicas de imagen del config (campos de imagen, valores http/data/assets). */
export function collectImageRefs(config: unknown): string[] {
  const out = new Set<string>();
  collect(config, false, out);
  return Array.from(out);
}

/* ─────────────────────────────────────────────────────────────────────────
 *  Colector CONTEXT-AWARE (#1/#2/#3 del feedback de Rubén)
 *
 *  En vez de tirar TODA imagen descargada a un `assets/feed/<hash>` plano, cada
 *  imagen se enruta a una carpeta semántica según DÓNDE vive en el config:
 *    - dentro de un listing (tiene `category` + `title`/`name`) →
 *      `assets/feed/<Category>/<Client>-<Category>-<Subcategory>-<ListingName>`
 *      (galería → sufijo `-1/-2…`; campos secundarios como thumbnail → `-thumbnail`).
 *    - dentro de un módulo conocido (photoBooth.frames/backgrounds, billboard,
 *      ads, ai, guestbook…) → `assets/<bucket>/<Client>-<itemId>` (resuelve que
 *      frames/backgrounds aparezcan COMPLETOS en su carpeta, no en feed/).
 *    - assets relativos (`assets/...` del template) → se copian a su MISMO path
 *      (sin target) — preserva la estructura del template (stickers/share/None…).
 *    - sin contexto reconocible → fallback al hash (`assets/feed/_misc/<hash>`),
 *      vía `target` undefined en materialize.
 *  Las colisiones de nombre las resuelve `materializeAssets` con sufijo `-2/-3`.
 * ──────────────────────────────────────────────────────────────────────── */

/** Destino sugerido para una imagen http/data (sin extensión; la pone materialize). */
export interface AssetTarget {
  dir: string;
  base: string;
}

/** Imagen recolectada con su target opcional (undefined → naming legacy hash). */
export interface CollectedImage {
  ref: string;
  target?: AssetTarget;
  /** `font` → no es una URL de imagen sino un nombre/URL de fuente a descargar. */
  kind?: 'font';
}

/** Campos de imagen "secundarios" — se sufijan con el nombre del campo para no
 *  colisionar con el `image` principal del mismo item (e.g. frame image vs thumbnail). */
const SECONDARY_IMAGE_FIELDS: ReadonlySet<string> = new Set([
  'thumbnail',
  'poster',
  'videoPoster',
  'logo',
  'idleLogo',
  'footerLogo',
  'shareCardLogo',
  'qrLogo',
  'favicon',
  'circleImage',
  'pinImage',
  'menuImage',
]);

/** Arrays de contenido que marcan a un objeto como "módulo de feed" (categoría propia). */
const FEED_CONTENT_KEYS = ['listings', 'events', 'trails'] as const;

/** Cualquier array de contenido → marca el objeto como un módulo (tiene `label`). */
const MODULE_CONTENT_KEYS: ReadonlySet<string> = new Set([
  ...FEED_CONTENT_KEYS,
  'deals',
  'passes',
  'highlights',
  'brochures',
  'pinCatalog',
  'posts',
  'activities',
]);

/** Contenedores SIN `label` → carpeta bucket amigable. */
const CONTAINER_BUCKET: Readonly<Record<string, string>> = {
  advertisements: 'Ads',
  ads: 'Ads',
  itinerary: 'Trip Planner',
};

/** Keys de sección (no bajo `modules`) → su tile.key para el gating de activo. */
const GATE_KEY: Readonly<Record<string, string>> = {
  photoBooth: 'photo-booth',
  itinerary: 'itinerary-builder',
  survey: 'survey',
};

/** Campos que son el HEADER/hero de una sección. */
const HEADER_FIELDS: ReadonlySet<string> = new Set([
  'heroImage',
  'wizardHeroImage',
  'fallbackHero',
  'loadingImage',
  'headerImage',
]);

/** Objetos `{kind, src}` del branding cuya `src` es un asset (media). */
const MEDIA_SRC_PARENTS: ReadonlySet<string> = new Set([
  'homeHero',
  'brandVideo',
  'idleBackground',
]);

/** Normaliza texto humano para nombre de archivo: espacios/símbolos → `_`, conserva caja. */
function tokenize(s: string): string {
  return s
    .trim()
    .replace(/['’]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Normaliza un id/slug (ya casi safe): preserva guiones, solo limpia lo inválido. */
function idToken(s: string): string {
  return s
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isRelativeRef(ref: string): boolean {
  return ref.startsWith('assets/') || ref.startsWith('/assets/');
}

interface CollectCtx {
  inImage: boolean;
  field?: string;
  client: string;
  /** Solo se usa para `branding` (logos + media {kind,src}). */
  module?: string;
  /** Carpeta bucket amigable para módulos NO-feed (assets/<bucketLabel>/…). */
  bucketLabel?: string;
  /** Categoría del feed (módulo de listings → su label; events → "Events"; trails → "Trails"). */
  feedCategory?: string;
  subcategory?: string;
  /** Nombre del item de feed (listing/event/trail). */
  itemTitle?: string;
  /** Id/label del item dentro de un bucket (para nombrar el archivo). */
  itemName?: string;
  /** Padre `{kind, src}` del branding (homeHero/brandVideo/idleBackground). */
  mediaParent?: string;
  galleryIndex?: number;
  /** Estamos dentro del contenedor `features.home.modules` (sus hijos son módulos). */
  inModules?: boolean;
  /** Estamos dentro del array `features.home.tiles`. */
  inTiles?: boolean;
  /** Set de módulos activos (tile.key con enabled !== false); undefined = no gating. */
  enabledModules?: ReadonlySet<string>;
}

/** ¿El objeto es un item de contenido de feed (tiene título + algo de imagen)? */
function isFeedItem(o: Record<string, unknown>): boolean {
  return (
    typeof o.title === 'string' &&
    o.title.length > 0 &&
    ('image' in o || 'galleryUrls' in o || 'subcategory' in o || 'category' in o) &&
    !('catalog' in o)
  );
}

function targetFor(ctx: CollectCtx, ref: string): AssetTarget | undefined {
  // Relativos: el rename de carpeta (home → Home Dashboard) lo hace materialize;
  // aquí no llevan target.
  if (isRelativeRef(ref)) return undefined;

  const isHeader = Boolean(ctx.field && HEADER_FIELDS.has(ctx.field));

  // Header / hero de sección.
  if (isHeader) {
    const fieldName = ctx.field ?? 'header';
    if (ctx.feedCategory) {
      return { dir: `assets/feed/${ctx.feedCategory}`, base: `${ctx.client}-${fieldName}` };
    }
    if (ctx.bucketLabel) {
      return { dir: `assets/${ctx.bucketLabel}`, base: `${ctx.client}-${fieldName}` };
    }
  }

  // Branding (logos, media {kind,src}). Las fonts se recolectan aparte (kind:'font').
  if (ctx.module === 'branding') {
    const name = ctx.field === 'src' ? (ctx.mediaParent ?? 'media') : (ctx.field ?? 'asset');
    return { dir: 'assets/branding', base: `${ctx.client}-${name}` };
  }

  // Item de feed (listing/event/trail) → feed/<Categoría>/<Subcategoría>/<naming>.
  if (ctx.feedCategory && ctx.itemTitle) {
    let base = [ctx.client, ctx.feedCategory, ctx.subcategory, ctx.itemTitle]
      .filter(Boolean)
      .join('-');
    if (ctx.field === 'galleryUrls' && ctx.galleryIndex != null) base += `-${ctx.galleryIndex + 1}`;
    else if (ctx.field && SECONDARY_IMAGE_FIELDS.has(ctx.field)) base += `-${ctx.field}`;
    const dir = ctx.subcategory
      ? `assets/feed/${ctx.feedCategory}/${ctx.subcategory}`
      : `assets/feed/${ctx.feedCategory}`;
    return { dir, base };
  }

  // Item de un módulo bucket (socialWall, deals, passes, ads, trip planner…).
  if (ctx.bucketLabel) {
    const name = ctx.itemName ?? ctx.field ?? 'asset';
    let base = `${ctx.client}-${name}`;
    if (ctx.itemName && ctx.field && SECONDARY_IMAGE_FIELDS.has(ctx.field)) base += `-${ctx.field}`;
    return { dir: `assets/${ctx.bucketLabel}`, base };
  }

  // Sin contexto → fallback hash (assets/feed/_misc) en materialize.
  return undefined;
}

function walkImages(value: unknown, ctx: CollectCtx, out: CollectedImage[]): void {
  if (typeof value === 'string') {
    if (ctx.inImage && isAssetRef(value)) out.push({ ref: value, target: targetFor(ctx, value) });
    return;
  }
  if (Array.isArray(value)) {
    const isGallery = ctx.field === 'galleryUrls';
    value.forEach((v, i) => {
      // Tiles inactivos (#4): no se exportan.
      if (v && typeof v === 'object' && (v as Record<string, unknown>).enabled === false) return;
      walkImages(v, isGallery ? { ...ctx, galleryIndex: i } : ctx, out);
    });
    return;
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const base: CollectCtx = { ...ctx };

    // ── Detección de MÓDULO por `label` + contenido (estructura real
    //    features.home.modules.<key> = { label, heroImage, listings|events|… }).
    //    Funciona a cualquier profundidad (no depende del nivel top-level).
    const label = typeof o.label === 'string' && o.label ? o.label : null;
    const hasContent = Object.keys(o).some((k) => MODULE_CONTENT_KEYS.has(k));
    if (label && (hasContent || 'heroImage' in o)) {
      const isFeed = FEED_CONTENT_KEYS.some((k) => k in o);
      if (isFeed) {
        base.feedCategory = tokenize(label);
        base.bucketLabel = undefined;
      } else {
        base.bucketLabel = label; // carpeta amigable = el label del módulo
        base.feedCategory = undefined;
      }
      base.itemName = undefined;
    }

    // ── Item de feed (listing/event/trail) → fija subcategoría + título.
    if (base.feedCategory && isFeedItem(o)) {
      base.itemTitle = tokenize(o.title as string);
      if (typeof o.subcategory === 'string' && o.subcategory) {
        base.subcategory = tokenize(o.subcategory);
      } else if (typeof o.category === 'string' && o.category) {
        base.subcategory = tokenize(o.category); // events: category por item
      }
    }
    // ── Tile del Home (#2): su `image` → assets/Home Dashboard/tiles/<key>.
    if (base.inTiles && typeof o.key === 'string' && o.key) {
      base.bucketLabel = 'Home Dashboard/tiles';
      base.feedCategory = undefined;
      base.itemName = idToken(o.key);
    }
    // ── Nombre del item dentro de un bucket (para nombrar el archivo).
    else if (base.bucketLabel && !base.feedCategory) {
      // Ads (#5): el archivo se nombra por el TIPO de ad (hero/bottom/popup),
      // no por su id. Varios del mismo tipo → materialize sufija -2/-3.
      const idLike =
        base.bucketLabel === 'Ads' && typeof o.kind === 'string' && o.kind
          ? o.kind
          : (o.id ?? o.slug ?? o.key ?? o.title ?? o.name);
      if (typeof idLike === 'string' && idLike) base.itemName = idToken(idLike);
    }

    for (const [k, v] of Object.entries(o)) {
      // ── Gating de módulo INACTIVO (#1): se omite por completo su subárbol.
      if (base.enabledModules) {
        const gate = GATE_KEY[k] ?? (base.inModules ? k : undefined);
        if (gate && !base.enabledModules.has(gate)) continue;
      }
      const child: CollectCtx = {
        ...base,
        inImage: base.inImage || IMAGE_FIELDS.has(k) || (k === 'src' && base.mediaParent != null),
        field: IMAGE_FIELDS.has(k) || (k === 'src' && base.mediaParent != null) ? k : base.field,
        inModules: k === 'modules',
        inTiles: k === 'tiles',
      };
      // Branding (logos + media {kind,src}).
      if (k === 'branding') child.module = 'branding';
      if (base.module === 'branding' && MEDIA_SRC_PARENTS.has(k)) child.mediaParent = k;
      // Fonts del branding → recolectar el nombre/URL como kind:'font'.
      if (base.module === 'branding' && k === 'fonts' && v && typeof v === 'object') {
        for (const font of Object.values(v as Record<string, unknown>)) {
          if (typeof font === 'string' && font.trim()) {
            out.push({
              ref: font,
              kind: 'font',
              target: { dir: 'assets/branding/fonts', base: tokenize(font) },
            });
          }
        }
        continue;
      }
      // Photo Booth: subcarpetas frames/backgrounds/stickers.
      if (k === 'photoBooth') {
        child.bucketLabel = 'photo-booth';
        child.feedCategory = undefined;
        child.itemName = undefined;
      } else if (
        base.bucketLabel === 'photo-booth' &&
        (k === 'frames' || k === 'backgrounds' || k === 'stickers')
      ) {
        child.bucketLabel = `photo-booth/${k}`;
      } else if (CONTAINER_BUCKET[k]) {
        // Contenedores sin label (advertisements, itinerary).
        child.bucketLabel = CONTAINER_BUCKET[k];
        child.feedCategory = undefined;
        child.itemName = undefined;
      }
      walkImages(v, child, out);
    }
  }
}

/**
 * Conjunto de módulos ACTIVOS (#1): `tile.key` de los tiles del Home con
 * `enabled !== false`. Si no hay tiles, devuelve undefined (sin gating).
 */
export function activeModules(config: unknown): ReadonlySet<string> | undefined {
  const tiles = (config as { features?: { home?: { tiles?: unknown } } })?.features?.home?.tiles;
  if (!Array.isArray(tiles)) return undefined;
  const set = new Set<string>();
  for (const t of tiles) {
    if (t && typeof t === 'object') {
      const tile = t as { key?: unknown; enabled?: unknown };
      if (typeof tile.key === 'string' && tile.enabled !== false) set.add(tile.key);
    }
  }
  return set;
}

/**
 * Recolecta las imágenes del config CON su destino semántico (context-aware).
 * `clientName` se usa como prefijo del naming (e.g. "Hello_Harford"). Solo
 * recolecta los módulos ACTIVOS (por `tile.enabled`). Deduplica por ref.
 */
export function collectImages(config: unknown, opts: { clientName: string }): CollectedImage[] {
  const out: CollectedImage[] = [];
  walkImages(
    config,
    {
      inImage: false,
      client: tokenize(opts.clientName) || 'Client',
      enabledModules: activeModules(config),
    },
    out,
  );
  const seen = new Set<string>();
  const deduped: CollectedImage[] = [];
  for (const img of out) {
    if (seen.has(img.ref)) continue;
    seen.add(img.ref);
    deduped.push(img);
  }
  return deduped;
}

function rewrite<T>(value: T, inImage: boolean, map: ReadonlyMap<string, string>): T {
  if (typeof value === 'string') {
    if (inImage) {
      const next = map.get(value);
      if (next !== undefined) return next as unknown as T;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => rewrite(v, inImage, map)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = rewrite(v, inImage || IMAGE_FIELDS.has(k), map);
    }
    return out as T;
  }
  return value;
}

/** Devuelve un config nuevo con las refs de imagen reemplazadas por `map` (no muta). */
export function rewriteImageRefs<T>(config: T, map: ReadonlyMap<string, string>): T {
  return rewrite(config, false, map);
}
