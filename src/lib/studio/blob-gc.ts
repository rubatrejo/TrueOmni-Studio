import 'server-only';

import { del, list } from '@vercel/blob';

/**
 * Recolección de basura de Vercel Blob por cliente (deuda de infra del audit
 * STUDIO-AUDIT-2026-06-09).
 *
 * Los blobs de un cliente viven bajo prefijos deterministas:
 *  - `kiosks/<slug>/...`   (uploads del editor, placeholder, feed materializado)
 *  - `signage/<slug>/...`  (uploads del editor de signage)
 *
 * Cuando un cliente se borra (o se recupera un slug huérfano al crear uno
 * nuevo), sus blobs quedaban colgando para siempre. `purgeClientBlobs` los
 * elimina. Es el caso INEQUÍVOCO del GC: el cliente ya no existe, así que todo
 * su prefijo es basura — sin riesgo de falsos positivos. (El GC de huérfanos
 * dentro de un cliente VIVO —blobs ya no referenciados— es más delicado y se
 * deja para una herramienta dedicada con dry-run.)
 *
 * Best-effort y token-gated: sin `BLOB_READ_WRITE_TOKEN` no hace nada; los
 * errores se loguean pero no abortan el cleanup del cliente.
 */

/** Prefijos de Blob bajo los que viven todos los assets de un cliente. */
export function clientBlobPrefixes(slug: string): string[] {
  return [`kiosks/${slug}/`, `signage/${slug}/`];
}

/** Borra en lotes para no exceder límites de la API de del(). */
const DEL_BATCH = 100;

/** Dependencias inyectables — los tests las mockean sin tocar Blob. */
export interface BlobGcDeps {
  /** Lista todas las URLs de blobs bajo un prefijo (paginando). */
  listPrefix(prefix: string): Promise<string[]>;
  /** Borra un lote de URLs de blobs. */
  delUrls(urls: string[]): Promise<void>;
}

const defaultDeps: BlobGcDeps = {
  async listPrefix(prefix) {
    const urls: string[] = [];
    let cursor: string | undefined;
    do {
      const res = await list({ prefix, cursor, limit: 1000 });
      for (const b of res.blobs) urls.push(b.url);
      cursor = res.hasMore ? res.cursor : undefined;
    } while (cursor);
    return urls;
  },
  async delUrls(urls) {
    await del(urls);
  },
};

export interface PurgeBlobsResult {
  /** Nº de blobs borrados. */
  deleted: number;
  /** true si se saltó por falta de token (Blob no configurado). */
  skipped: boolean;
}

/**
 * Borra TODOS los blobs de un cliente (kiosk + signage). No-throws: devuelve lo
 * que alcanzó a borrar aunque un lote falle.
 */
export async function purgeClientBlobs(
  slug: string,
  deps: BlobGcDeps = defaultDeps,
): Promise<PurgeBlobsResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { deleted: 0, skipped: true };

  let deleted = 0;
  for (const prefix of clientBlobPrefixes(slug)) {
    let urls: string[] = [];
    try {
      urls = await deps.listPrefix(prefix);
    } catch (err) {
      console.warn(`[purgeClientBlobs] list(${prefix}) failed`, err);
      continue;
    }
    for (let i = 0; i < urls.length; i += DEL_BATCH) {
      const batch = urls.slice(i, i + DEL_BATCH);
      try {
        await deps.delUrls(batch);
        deleted += batch.length;
      } catch (err) {
        console.warn(`[purgeClientBlobs] del batch under ${prefix} failed`, err);
      }
    }
  }
  return { deleted, skipped: false };
}
