import 'server-only';

import { createHash } from 'node:crypto';

import { head, put } from '@vercel/blob';

/**
 * Materialización de imágenes externas del feed a Vercel Blob (F-PWA-3 /
 * deuda de infra del audit STUDIO-AUDIT-2026-06-09).
 *
 * El proveedor (SimpleView, Tempest, CrowdRiff, …) entrega URLs de su propio
 * CDN en `feedData.image`. Si ese CDN cambia, expira o bloquea el hotlink, la
 * foto desaparece en producción (kiosk + PWA renderizan la URL externa tal
 * cual). Aquí, en cada sync, copiamos esas imágenes a nuestro Blob y dejamos
 * la URL estable bajo nuestro control.
 *
 * Idempotente y barato en re-syncs: el pathname del blob es determinista por
 * hash de la URL origen, así que un `head()` resuelve si ya existe sin volver
 * a descargar. Best-effort: cualquier fallo (404/403/timeout/sin token)
 * conserva la URL original — nunca aborta el sync.
 */

/** Hosts de Vercel Blob — si la URL ya apunta aquí, ya está materializada. */
const VERCEL_BLOB_HOST = '.blob.vercel-storage.com';

/** Cap por imagen. Imágenes de feed razonables caben de sobra; evita abusos. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Timeout por descarga — un CDN lento no debe tumbar el sync entero. */
const FETCH_TIMEOUT_MS = 8000;

/** Descargas en paralelo. Acotado para no saturar la lambda (maxDuration 60s). */
const CONCURRENCY = 6;

const CONTENT_TYPE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

/** Extensión a partir del content-type, con fallback a la de la URL o `jpg`. */
export function extFor(contentType: string | null, url: string): string {
  const ct = (contentType ?? '').split(';')[0].trim().toLowerCase();
  if (CONTENT_TYPE_EXT[ct]) return CONTENT_TYPE_EXT[ct];
  const m = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(url);
  if (m) {
    const ext = m[1].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }
  return 'jpg';
}

/** Pathname determinista del blob para una URL origen (hash → re-sync barato). */
export function blobPathnameFor(slug: string, url: string, contentType: string | null): string {
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 32);
  return `kiosks/${slug}/feed/${hash}.${extFor(contentType, url)}`;
}

/** ¿Es una URL externa que toca materializar? (http(s), no data:, no ya-Blob). */
export function shouldMaterialize(url: string | undefined | null): url is string {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url)) return false; // relativas, data:, blob: → no
  if (url.includes(VERCEL_BLOB_HOST)) return false; // ya está en nuestro Blob
  return true;
}

/** Dependencias inyectables — los tests las mockean sin tocar red/Blob. */
export interface MaterializeDeps {
  /** Devuelve la URL del blob si ya existe ese pathname, o null. */
  headBlob(pathname: string): Promise<string | null>;
  /** Descarga la imagen; null si no es imagen válida / falla / excede el cap. */
  fetchImage(url: string): Promise<{ buffer: Buffer; contentType: string | null } | null>;
  /** Sube el buffer y devuelve la URL pública del blob. */
  putBlob(pathname: string, buffer: Buffer, contentType: string | null): Promise<string>;
}

const defaultDeps: MaterializeDeps = {
  async headBlob(pathname) {
    try {
      const res = await head(pathname);
      return res.url;
    } catch {
      return null; // BlobNotFoundError u otro → tratar como inexistente
    }
  },
  async fetchImage(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
      if (!res.ok) return null;
      const ct = res.headers.get('content-type');
      if (ct && !ct.toLowerCase().startsWith('image/')) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) return null;
      return { buffer: buf, contentType: ct };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  },
  async putBlob(pathname, buffer, contentType) {
    const res = await put(pathname, buffer, {
      access: 'public',
      contentType: contentType ?? undefined,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return res.url;
  },
};

/**
 * Materializa UNA URL: devuelve la URL del blob, o la original si no aplica /
 * falla. Reusa el blob existente (head) sin re-descargar.
 */
export async function materializeOne(
  slug: string,
  url: string,
  deps: MaterializeDeps = defaultDeps,
): Promise<string> {
  if (!shouldMaterialize(url)) return url;
  // 1. ¿Ya existe? Pathname determinista por hash; probamos con jpg (la mayoría)
  //    y, si la descarga revela otro tipo, el put usa el ext real. Para el head
  //    necesitamos el content-type real, así que descargamos primero y luego
  //    comprobamos existencia por el pathname definitivo.
  const fetched = await deps.fetchImage(url).catch(() => null);
  if (!fetched) return url; // best-effort: conserva la URL externa
  const pathname = blobPathnameFor(slug, url, fetched.contentType);
  const existing = await deps.headBlob(pathname).catch(() => null);
  if (existing) return existing;
  try {
    return await deps.putBlob(pathname, fetched.buffer, fetched.contentType);
  } catch {
    return url;
  }
}

/** Aplica un mapper async sobre un array con concurrencia acotada. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Materializa el `feedData.image` de una lista de items de contenido. Deduplica
 * por URL (la misma foto en varios items se descarga una vez). Devuelve una
 * lista nueva con las URLs reemplazadas; no muta la entrada.
 *
 * Gated por `BLOB_READ_WRITE_TOKEN`: sin token, devuelve los items sin tocar
 * (conserva el comportamiento previo, URLs externas).
 */
export async function materializeFeedImages<T extends { feedData?: { image?: string } }>(
  slug: string,
  items: T[],
  deps: MaterializeDeps = defaultDeps,
): Promise<T[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return items;

  const uniqueUrls = Array.from(
    new Set(items.map((it) => it.feedData?.image).filter(shouldMaterialize)),
  );
  if (uniqueUrls.length === 0) return items;

  const resolved = new Map<string, string>();
  const results = await mapWithConcurrency(uniqueUrls, CONCURRENCY, (url) =>
    materializeOne(slug, url, deps),
  );
  uniqueUrls.forEach((url, i) => resolved.set(url, results[i]));

  return items.map((it) => {
    const url = it.feedData?.image;
    if (!url || !resolved.has(url)) return it;
    const next = resolved.get(url)!;
    if (next === url) return it;
    return { ...it, feedData: { ...it.feedData, image: next } };
  });
}
