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
