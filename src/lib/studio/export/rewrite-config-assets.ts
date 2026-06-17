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
  'shareBackground',
  'shareCardLogo',
  'qrLogo',
  'poster',
  'galleryUrls',
  'subcategoryImages',
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

/** Key de módulo → carpeta bucket (para imágenes NO-listing). */
const BUCKET_BY_KEY: Readonly<Record<string, string>> = {
  billboard: 'billboard',
  billboards: 'billboard',
  ads: 'ads',
  guestbook: 'guestbook',
  ai: 'ai',
  brochures: 'brochures',
  social: 'social-wall',
};

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
  bucket?: string;
  itemName?: string;
  category?: string;
  subcategory?: string;
  listingName?: string;
  galleryIndex?: number;
}

function isListingItem(o: Record<string, unknown>): boolean {
  return (
    typeof o.category === 'string' &&
    o.category.length > 0 &&
    (typeof o.title === 'string' || typeof o.name === 'string')
  );
}

function targetFor(ctx: CollectCtx, ref: string): AssetTarget | undefined {
  // Relativos: conservan su path → sin target (materialize copia al mismo sitio).
  if (isRelativeRef(ref)) return undefined;

  // Dentro de un listing → feed por categoría con naming semántico.
  if (ctx.category && ctx.listingName) {
    let base = [ctx.client, ctx.category, ctx.subcategory, ctx.listingName]
      .filter(Boolean)
      .join('-');
    if (ctx.field === 'galleryUrls' && ctx.galleryIndex != null) {
      base += `-${ctx.galleryIndex + 1}`;
    } else if (ctx.field && SECONDARY_IMAGE_FIELDS.has(ctx.field)) {
      base += `-${ctx.field}`;
    }
    return { dir: `assets/feed/${ctx.category}`, base };
  }

  // Dentro de un módulo conocido → carpeta bucket.
  if (ctx.bucket) {
    const name = ctx.itemName ?? ctx.field ?? 'asset';
    let base = `${ctx.client}-${name}`;
    if (ctx.itemName && ctx.field && SECONDARY_IMAGE_FIELDS.has(ctx.field)) {
      base += `-${ctx.field}`;
    }
    return { dir: `assets/${ctx.bucket}`, base };
  }

  // Sin contexto → fallback hash en materialize.
  return undefined;
}

function walkImages(value: unknown, ctx: CollectCtx, out: CollectedImage[]): void {
  if (typeof value === 'string') {
    if (ctx.inImage && isAssetRef(value)) out.push({ ref: value, target: targetFor(ctx, value) });
    return;
  }
  if (Array.isArray(value)) {
    const isGallery = ctx.field === 'galleryUrls';
    value.forEach((v, i) => walkImages(v, isGallery ? { ...ctx, galleryIndex: i } : ctx, out));
    return;
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const base: CollectCtx = { ...ctx };
    if (isListingItem(o)) {
      base.category = tokenize(o.category as string);
      const sub = (o.subcategory ?? o.subCategory) as unknown;
      base.subcategory = typeof sub === 'string' && sub ? tokenize(sub) : undefined;
      base.listingName = tokenize((o.title ?? o.name) as string);
      base.bucket = undefined;
      base.itemName = undefined;
    } else if (base.bucket) {
      const idLike = o.id ?? o.slug ?? o.key ?? o.label ?? o.name ?? o.title;
      if (typeof idLike === 'string' && idLike) base.itemName = idToken(idLike);
    }
    for (const [k, v] of Object.entries(o)) {
      const child: CollectCtx = {
        ...base,
        inImage: base.inImage || IMAGE_FIELDS.has(k),
        field: IMAGE_FIELDS.has(k) ? k : base.field,
      };
      if (k === 'photoBooth') {
        child.bucket = 'photo-booth';
        child.itemName = undefined;
      } else if (
        base.bucket === 'photo-booth' &&
        (k === 'frames' || k === 'backgrounds' || k === 'stickers')
      ) {
        child.bucket = `photo-booth/${k}`;
      } else if (BUCKET_BY_KEY[k]) {
        child.bucket = BUCKET_BY_KEY[k];
        child.itemName = undefined;
      }
      walkImages(v, child, out);
    }
  }
}

/**
 * Recolecta las imágenes del config CON su destino semántico (context-aware).
 * `clientName` se usa como prefijo del naming (e.g. "Hello_Harford"). Deduplica
 * por ref conservando el primer contexto visto.
 */
export function collectImages(config: unknown, opts: { clientName: string }): CollectedImage[] {
  const out: CollectedImage[] = [];
  walkImages(config, { inImage: false, client: tokenize(opts.clientName) || 'Client' }, out);
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
