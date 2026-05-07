import 'server-only';

import { kv } from '@/lib/studio/kv';

import { kSignageDisplay, kSignageSnap, kSignageSnapList } from './kv-keys';

/**
 * Helpers para reportar uso del KV por display signage (DSS7).
 *
 * El cap de Upstash KV es ~950KB por value. Reportar al operador el % usado
 * ayuda a detectar antes de tiempo si la config crece demasiado (typical
 * cause: snapshots con assets embebidos como base64, cosa que NO debería
 * pasar — assets se sirven via `/signage-assets`).
 */

export interface SignageKvSize {
  display: number;
  snapshots: number;
  total: number;
  cap: number;
}

const CAP_BYTES = 950_000;

function jsonByteLength(value: unknown): number {
  if (value === null || value === undefined) return 0;
  try {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
  } catch {
    return 0;
  }
}

export async function computeSignageKvSize(
  clientSlug: string,
  displaySlug: string,
): Promise<SignageKvSize> {
  const display = await kv.get<unknown>(kSignageDisplay(clientSlug, displaySlug));
  const displayBytes = jsonByteLength(display);

  let snapshotsBytes = 0;
  const snapIds = (await kv.get<string[]>(kSignageSnapList(clientSlug, displaySlug))) ?? [];
  for (const id of Array.isArray(snapIds) ? snapIds : []) {
    const snap = await kv.get<unknown>(kSignageSnap(clientSlug, displaySlug, id));
    snapshotsBytes += jsonByteLength(snap);
  }

  return {
    display: displayBytes,
    snapshots: snapshotsBytes,
    total: displayBytes + snapshotsBytes,
    cap: CAP_BYTES,
  };
}
