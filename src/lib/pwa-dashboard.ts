import type { PwaConfig, PwaDashboardConfig } from '@/lib/config';

/**
 * Quick Access (los squircles del hero) y los tiles del grid del Dashboard PWA
 * son un pool único y MUTUAMENTE EXCLUYENTE: un módulo vive en uno u otro lado,
 * nunca en ambos. La regla de dedupe es "QA gana": un módulo promovido al hero
 * deja el grid.
 *
 * Módulo puro (sin `'use client'` ni `server-only`) → importable desde el editor
 * (client), el runtime y la capa de persistencia (server).
 */

/** Quita de `tiles` todo módulo que ya esté en `quickAccess` (QA gana). Conserva
 *  el orden de los tiles restantes. Devuelve el mismo objeto si no hay cambios. */
export function normalizePwaDashboard(d: PwaDashboardConfig): PwaDashboardConfig {
  if (!d || !Array.isArray(d.tiles) || !Array.isArray(d.quickAccess)) return d;
  const qaKeys = new Set(d.quickAccess.map((q) => q.key));
  const tiles = d.tiles.filter((t) => !qaKeys.has(t.key));
  return tiles.length === d.tiles.length ? d : { ...d, tiles };
}

/** Normaliza el `dashboard` de un slice `features.pwa` completo (self-heal de
 *  datos guardados). Devuelve el mismo objeto si no hubo cambios. */
export function normalizePwaSliceDashboard(slice: PwaConfig): PwaConfig {
  if (!slice?.dashboard) return slice;
  const dashboard = normalizePwaDashboard(slice.dashboard);
  return dashboard === slice.dashboard ? slice : { ...slice, dashboard };
}
