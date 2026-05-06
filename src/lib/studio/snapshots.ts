import 'server-only';

import { kv, kvKeys } from './kv';
import type { KioskConfig } from './schema';

/**
 * Snapshots del config para rollback (#9 del audit).
 *
 * Antes de cada PATCH/import que sobreescribe el `cfg:<slug>` se guarda el
 * estado anterior bajo `cfg:<slug>:snap:<ts>` con TTL 30 días. Una lista
 * separada `cfg:<slug>:snap-list` mantiene los timestamps más recientes
 * primero, con cap 10 (cuando se añade el 11º se elimina el más viejo).
 *
 * Trade-offs:
 *   - Storage: hasta 10 × 950KB = 9.5MB por kiosk en KV. Aceptable para
 *     Upstash hobby tier (256MB total → ~25 kiosks máx).
 *   - Atomicidad: snapshot.set + list.set + del-overflow no son una
 *     transacción. Si una falla a la mitad podemos quedar con un snapshot
 *     huérfano (ocupa espacio hasta TTL) o un entry en la lista que apunta
 *     a una key inexistente (la API GET filtra los huérfanos). Aceptable.
 *   - Concurrencia: dos PATCHes simultáneos snapshotean cada uno su propio
 *     "estado anterior leído". Ambos snapshots persisten — el operador ve
 *     ambos en la lista de revert.
 */

const MAX_SNAPSHOTS_PER_KIOSK = 10;
const SNAPSHOT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 días

export type SnapshotEntry = {
  /** Timestamp ISO, también el sufijo de la KV key. */
  ts: string;
  /** Origen del snapshot — útil para que el operador entienda qué pasó.
   *  - 'patch'   → PATCH desde el editor (Save).
   *  - 'import'  → POST /import desde JSON.
   *  - 'revert'  → tomado JUSTO antes de aplicar otro snapshot (permite
   *                 deshacer el revert). */
  reason: 'patch' | 'import' | 'revert';
  /** Tamaño del snapshot en bytes (sirve para mostrar en UI). */
  sizeBytes: number;
};

/**
 * Toma un snapshot del estado actual del KV ANTES de sobreescribirlo.
 * Idempotente respecto a `cfg:<slug>:snap-list` — añade el ts al inicio y
 * rota si supera el cap.
 *
 * Si `prev` es `null` (kiosk nuevo, sin estado anterior) no hace nada —
 * no tiene sentido snapshot un kiosk vacío.
 */
export async function takeSnapshot(
  slug: string,
  prev: KioskConfig | null,
  reason: SnapshotEntry['reason'],
): Promise<SnapshotEntry | null> {
  if (!prev) return null;
  const ts = new Date().toISOString();
  const payload = JSON.stringify(prev);
  const sizeBytes = Buffer.byteLength(payload, 'utf8');

  await kv.set(kvKeys.cfgSnap(slug, ts), prev, { ex: SNAPSHOT_TTL_SECONDS });

  const entry: SnapshotEntry = { ts, reason, sizeBytes };
  const existing = (await kv.get<SnapshotEntry[]>(kvKeys.cfgSnapList(slug))) ?? [];
  // Añade al inicio y rota: si pasamos del cap, las excedentes se eliminan
  // explícitamente (la TTL las purgaría sola pero con delete liberamos
  // espacio antes).
  const next = [entry, ...existing];
  const overflow = next.slice(MAX_SNAPSHOTS_PER_KIOSK);
  const trimmed = next.slice(0, MAX_SNAPSHOTS_PER_KIOSK);
  await kv.set(kvKeys.cfgSnapList(slug), trimmed);
  await Promise.all(overflow.map((e) => kv.del(kvKeys.cfgSnap(slug, e.ts))));
  return entry;
}

/** Lista los snapshots disponibles para un kiosk (más recientes primero). */
export async function listSnapshots(slug: string): Promise<SnapshotEntry[]> {
  return (await kv.get<SnapshotEntry[]>(kvKeys.cfgSnapList(slug))) ?? [];
}

/** Lee un snapshot específico. Devuelve `null` si no existe (TTL expirado o
 *  ts inválido). */
export async function readSnapshot(slug: string, ts: string): Promise<KioskConfig | null> {
  return await kv.get<KioskConfig>(kvKeys.cfgSnap(slug, ts));
}
