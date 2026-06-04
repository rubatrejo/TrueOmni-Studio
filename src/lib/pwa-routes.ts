/**
 * Resolución config-driven de la ruta destino de un tile/quick-access del Dashboard PWA
 * (C1 de la auditoría). Sustituye los if/else hardcodeados del dashboard y alimenta también
 * el índice de búsqueda (`buildSearchIndex`).
 *
 * - Si el tile trae `route`, se usa tal cual (incluye `""` = no navegable).
 * - Si no, el default es `/pwa/{key}` — la convención de rutas de la PWA, igual que el kiosk
 *   resuelve `/home/{key}` dinámicamente. Un módulo nuevo del Studio navega sin tocar código.
 *
 * Módulo puro (sin `'use client'`) → importable desde Server y Client Components.
 */
export function resolvePwaTileRoute(tile: { key: string; route?: string }): string {
  return tile.route !== undefined ? tile.route : `/pwa/${tile.key}`;
}
