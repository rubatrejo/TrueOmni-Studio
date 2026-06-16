import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';

import type { AssetSource, MaterializeAssetsDeps } from './materialize-assets';

/**
 * Adaptador REAL de `MaterializeAssetsDeps` (Fase 4 del milestone) — implementa
 * la descarga (fetch), la copia de assets del template (fs con fallback
 * cliente→default) y la decodificación de data: URIs, escribiendo al árbol del
 * standalone. Es código Node puro (sin `server-only`): corre en la GitHub Action
 * de export (Fase 5) y en vitest. La LÓGICA de orquestación/dedup vive en
 * `materializeAssets` (Fase 2); aquí solo van los efectos de red/disco.
 */

const CONTENT_TYPE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'application/pdf': 'pdf',
};

/** Cap por asset. Generoso (videos/hero), el runner no tiene el límite de la lambda. */
const MAX_BYTES = 64 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;

function extFromContentType(contentType: string | null, url: string): string {
  const key = (contentType ?? '').split(';')[0].trim().toLowerCase();
  if (CONTENT_TYPE_EXT[key]) return CONTENT_TYPE_EXT[key];
  const m = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(url);
  return m ? m[1].toLowerCase() : 'bin';
}

function extFromPath(p: string): string {
  return extname(p).replace('.', '').toLowerCase() || 'bin';
}

export interface FsDepsOptions {
  /** Dir de assets del cliente en el monorepo (clients/<slug>/assets). */
  clientAssetsDir: string;
  /** Dir de assets default para el fallback (clients/default/assets). */
  defaultAssetsDir: string;
  /** Dir destino del cliente en el árbol standalone (se escribe destClientDir/<relPath>). */
  destClientDir: string;
}

/** Construye las deps reales (fetch/fs) para `materializeAssets`. */
export function createFsDeps(opts: FsDepsOptions): MaterializeAssetsDeps {
  return {
    async fetchUrl(url): Promise<AssetSource | null> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
        if (!res.ok) return null;
        const ct = res.headers.get('content-type');
        if (ct && !/^(image|video)\//i.test(ct) && !ct.includes('pdf')) return null;
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) return null;
        return { buffer, ext: extFromContentType(ct, url) };
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
      }
    },

    async readTemplateAsset(relPath): Promise<AssetSource | null> {
      const rel = relPath.replace(/^\/?assets\//, '');
      for (const base of [opts.clientAssetsDir, opts.defaultAssetsDir]) {
        try {
          const buffer = await readFile(join(base, rel));
          return { buffer, ext: extFromPath(rel) };
        } catch {
          // siguiente base (fallback) o null
        }
      }
      return null;
    },

    decodeDataUri(uri): AssetSource | null {
      const m = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(uri);
      if (!m) return null;
      const mime = (m[1] || '').trim();
      const isBase64 = Boolean(m[2]);
      const payload = m[3] ?? '';
      try {
        const buffer = isBase64
          ? Buffer.from(payload, 'base64')
          : Buffer.from(decodeURIComponent(payload), 'utf8');
        if (buffer.byteLength === 0) return null;
        return { buffer, ext: extFromContentType(mime, '') };
      } catch {
        return null;
      }
    },

    async writeAsset(relPath, buffer): Promise<void> {
      const dest = join(opts.destClientDir, relPath);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, buffer);
    },
  };
}
