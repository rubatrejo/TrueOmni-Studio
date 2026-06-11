import type {
  ContentItemStatus,
  EventContentItem,
  ListingContentItem,
} from '@/lib/studio/client-content';

/**
 * Merge por ID estable de los items de un feed.
 *
 * Regla (decisión 6 del plan): el re-sync refresca `feedData` del item existente
 * pero **conserva el `override`** (ediciones manuales) y respeta el `status`
 * `hidden` puesto por el operador. Los items que ya no llegan del feed se marcan
 * `removed-upstream` (no se borran). Los items 100% manuales (`source: 'manual'`)
 * nunca se tocan. Devuelve también el diff para el resumen del sync.
 */

export interface MergeDiff {
  added: number;
  updated: number;
  removed: number;
  total: number;
}

type AnyContentItem = ListingContentItem | EventContentItem;

function mergeOne<T extends AnyContentItem>(existing: T, incoming: T): T {
  // El operador ocultó el item → respetar 'hidden'. Si no, usar el status
  // fresco del feed (active/flagged), reactivando los que vuelven de
  // 'removed-upstream'.
  const status: ContentItemStatus = existing.status === 'hidden' ? 'hidden' : incoming.status;
  return {
    ...incoming,
    // Conserva el trabajo manual y la fecha de primera aparición.
    override: existing.override,
    firstSeenAt: existing.firstSeenAt ?? incoming.firstSeenAt,
    status,
  };
}

/**
 * Funde `incoming` (items recién normalizados del feed `feedId`) sobre
 * `existing` (todos los items guardados del cliente, de cualquier feed/manual).
 * Solo considera los items de `existing` cuyo `source === feedId` para detectar
 * desapariciones; el resto (otros feeds, manuales) pasan intactos.
 */
export function mergeItems<T extends AnyContentItem>(
  existing: T[],
  incoming: T[],
  feedId: string,
): { merged: T[]; diff: MergeDiff } {
  const existingById = new Map(existing.map((it) => [it.id, it]));
  const incomingIds = new Set(incoming.map((it) => it.id));

  let added = 0;
  let updated = 0;
  let removed = 0;

  const result: T[] = [];

  // 1. Items que NO son de este feed (otros feeds o manuales): intactos.
  for (const it of existing) {
    if (it.source !== feedId) {
      result.push(it);
    }
  }

  // 2. Items entrantes: nuevos o actualizados (merge conservando override).
  for (const inc of incoming) {
    const prev = existingById.get(inc.id);
    if (prev && prev.source === feedId) {
      result.push(mergeOne(prev, inc));
      updated += 1;
    } else {
      result.push(inc);
      added += 1;
    }
  }

  // 3. Items de este feed que ya no llegan: marcar removed-upstream (no borrar).
  for (const it of existing) {
    if (it.source === feedId && !incomingIds.has(it.id)) {
      result.push({ ...it, status: 'removed-upstream' });
      removed += 1;
    }
  }

  return {
    merged: result,
    diff: { added, updated, removed, total: incoming.length },
  };
}
