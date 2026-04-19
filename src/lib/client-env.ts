/**
 * Resuelve el slug del cliente activo para el build actual.
 *
 * Fallback obligatorio: "default" (R5, CLAUDE.md §7.7).
 * Este módulo NO carga `config.json`; solo devuelve el slug.
 * La lectura del config se conectará en Fase 2 (src/lib/config.ts).
 */

export const DEFAULT_CLIENT_SLUG = 'default';

export function getClientSlug(): string {
  const slug = process.env.KIOSK_CLIENT?.trim();
  return slug && slug.length > 0 ? slug : DEFAULT_CLIENT_SLUG;
}
