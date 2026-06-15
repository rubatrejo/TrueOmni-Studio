import 'server-only';

import { createHash } from 'node:crypto';

import { head, put } from '@vercel/blob';

/**
 * Materialización de data-URIs inlinados del config a Vercel Blob (deuda de
 * infra del audit STUDIO-AUDIT-2026-06-09; raíz del error "413 Config too
 * large for KV").
 *
 * El `ImageField` del Studio ya sube los uploads a Blob cuando hay token, pero
 * un config puede acumular `data:` base64 pesados por otras vías (pega de URL
 * data:, imports, configs viejos previos a F-PWA-3, branding logos...). Cuando
 * la suma supera el cap del valor de KV (~928 KB), el save falla con 413.
 *
 * Aquí, en CADA save, recorremos el config en profundidad y subimos a Blob
 * cualquier `data:` por encima de un umbral, dejando una URL corta en su lugar.
 * Así el config nunca crece por imágenes inline y el 413 no vuelve a pasar.
 *
 * Idempotente (pathname determinista por hash → `head()` reusa sin re-subir) y
 * best-effort (ante fallo conserva el data-URI; el guard de tamaño sigue como
 * última red de seguridad). Gated por `BLOB_READ_WRITE_TOKEN`.
 */

/** data: por debajo de esto se deja inline (iconos chicos no valen un blob). */
const MIN_INLINE_BYTES = 20_000;

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
};

function extForMime(mime: string): string {
  return MIME_EXT[mime.toLowerCase()] ?? 'bin';
}

export interface ParsedDataUri {
  mime: string;
  buffer: Buffer;
}

/** Parsea un data: URI (base64 o url-encoded). null si no es válido. */
export function parseDataUri(uri: string): ParsedDataUri | null {
  const m = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(uri);
  if (!m) return null;
  const mime = (m[1] || 'application/octet-stream').trim();
  const isBase64 = Boolean(m[2]);
  const payload = m[3] ?? '';
  try {
    const buffer = isBase64
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload), 'utf8');
    if (buffer.byteLength === 0) return null;
    return { mime, buffer };
  } catch {
    return null;
  }
}

/** ¿Es un data: lo bastante grande para materializar? */
export function shouldMaterializeDataUri(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:') && value.length >= MIN_INLINE_BYTES;
}

/** Dependencias inyectables — los tests las mockean sin tocar Blob. */
export interface DataUriDeps {
  headBlob(pathname: string): Promise<string | null>;
  putBlob(pathname: string, buffer: Buffer, contentType: string): Promise<string>;
}

const defaultDeps: DataUriDeps = {
  async headBlob(pathname) {
    try {
      const res = await head(pathname);
      return res.url;
    } catch {
      return null;
    }
  },
  async putBlob(pathname, buffer, contentType) {
    const res = await put(pathname, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return res.url;
  },
};

/** Sube un data: URI a Blob; devuelve la URL, o el data: original si falla. */
async function materializeUri(slug: string, uri: string, deps: DataUriDeps): Promise<string> {
  const parsed = parseDataUri(uri);
  if (!parsed) return uri;
  const hash = createHash('sha1').update(uri).digest('hex').slice(0, 32);
  const pathname = `kiosks/${slug}/inline/${hash}.${extForMime(parsed.mime)}`;
  const existing = await deps.headBlob(pathname).catch(() => null);
  if (existing) return existing;
  try {
    return await deps.putBlob(pathname, parsed.buffer, parsed.mime);
  } catch {
    return uri;
  }
}

/** Recoge recursivamente todos los string que tocan materializar. */
function collectDataUris(value: unknown, out: Set<string>): void {
  if (shouldMaterializeDataUri(value)) {
    out.add(value);
  } else if (Array.isArray(value)) {
    for (const v of value) collectDataUris(v, out);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectDataUris(v, out);
  }
}

/** Reconstruye el valor reemplazando los data: por su URL resuelta. */
function replaceDataUris<T>(value: T, resolved: Map<string, string>): T {
  if (typeof value === 'string') {
    const next = resolved.get(value);
    return (next ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => replaceDataUris(v, resolved)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = replaceDataUris(v, resolved);
    return out as T;
  }
  return value;
}

export interface MaterializeConfigResult<T> {
  config: T;
  /** true si se reemplazó al menos un data: por una URL de Blob. */
  changed: boolean;
  /** Nº de data-URIs materializados. */
  count: number;
}

/**
 * Materializa los data-URIs pesados de un config a Blob. Devuelve un config
 * nuevo (no muta) con las URLs reemplazadas. Sin token o sin data-URIs grandes,
 * devuelve el config tal cual (`changed: false`).
 */
export async function materializeConfigDataUris<T>(
  slug: string,
  config: T,
  deps: DataUriDeps = defaultDeps,
): Promise<MaterializeConfigResult<T>> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { config, changed: false, count: 0 };

  const uris = new Set<string>();
  collectDataUris(config, uris);
  if (uris.size === 0) return { config, changed: false, count: 0 };

  const resolved = new Map<string, string>();
  await Promise.all(
    Array.from(uris).map(async (uri) => {
      const url = await materializeUri(slug, uri, deps);
      if (url !== uri) resolved.set(uri, url);
    }),
  );
  if (resolved.size === 0) return { config, changed: false, count: 0 };

  return { config: replaceDataUris(config, resolved), changed: true, count: resolved.size };
}
