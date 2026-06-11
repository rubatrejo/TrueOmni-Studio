/**
 * Lógica pura de la selección múltiple del dashboard de clientes (F-HUB-9).
 *
 * Vive separada del componente para poder testearla sin DOM. Decide qué
 * slugs son targets de cada acción bulk a partir del estado de selección y
 * del estado actual de cada cliente.
 */

export interface SelectableClientLike {
  slug: string;
  pinned: boolean;
}

/**
 * El cliente `default` es el template base: no se puede borrar ni clonar
 * (ya está excluido de las acciones por-card hoy), así que tampoco entra en
 * la selección múltiple.
 */
export const PROTECTED_SLUG = 'default';

/** Slugs seleccionables en bulk (todos menos `default`). Base de "Select all". */
export function selectableSlugs(clients: SelectableClientLike[]): string[] {
  return clients.filter((c) => c.slug !== PROTECTED_SLUG).map((c) => c.slug);
}

/** De los seleccionados, los que aún NO están pinned → targets de "Pin". */
export function pinTargets(
  clients: SelectableClientLike[],
  selected: ReadonlySet<string>,
): string[] {
  return clients.filter((c) => selected.has(c.slug) && !c.pinned).map((c) => c.slug);
}

/** De los seleccionados, los que SÍ están pinned → targets de "Unpin". */
export function unpinTargets(
  clients: SelectableClientLike[],
  selected: ReadonlySet<string>,
): string[] {
  return clients.filter((c) => selected.has(c.slug) && c.pinned).map((c) => c.slug);
}

/**
 * Resultado de un intento de resync por slug.
 *  - `resynced`: el cliente tenía template de filesystem y se re-aplicó.
 *  - `skipped`: no hay `clients/{slug}/` en fs (creado en el Studio) → 404.
 *  - `failed`: error real (5xx / red).
 */
export type ResyncOutcome = 'resynced' | 'skipped' | 'failed';

export interface ResyncSummary {
  resynced: number;
  skipped: number;
  failed: number;
}

export function summarizeResync(outcomes: ResyncOutcome[]): ResyncSummary {
  return {
    resynced: outcomes.filter((o) => o === 'resynced').length,
    skipped: outcomes.filter((o) => o === 'skipped').length,
    failed: outcomes.filter((o) => o === 'failed').length,
  };
}

/**
 * Texto honesto para el toast tras un bulk resync. Nunca oculta los
 * `skipped` (regla white-label: sin truncado silencioso) ni los fallos.
 */
export function buildResyncToast(s: ResyncSummary): string {
  const parts: string[] = [`Resynced ${s.resynced}`];
  if (s.skipped > 0) parts.push(`skipped ${s.skipped} (no filesystem template)`);
  if (s.failed > 0) parts.push(`${s.failed} failed`);
  return parts.join(' · ');
}

export function resyncToastVariant(s: ResyncSummary): 'success' | 'warning' | 'error' {
  if (s.failed > 0) return 'error';
  if (s.skipped > 0) return 'warning';
  return 'success';
}
