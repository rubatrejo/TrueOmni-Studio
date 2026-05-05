/**
 * Tipos y helpers de `MapSource` — separados de `config.ts` para que puedan
 * importarse desde Client Components (`config.ts` es `server-only` por
 * usar fs y getClientSlug).
 */

/** Categorías canónicas del Map — tienen colores brand y iconos hardcoded. */
export const CANONICAL_MAP_SOURCES = ['restaurants', 'things-to-do', 'stay', 'events'] as const;
export type CanonicalMapSource = (typeof CANONICAL_MAP_SOURCES)[number];

/**
 * Keys lógicas del chip de categoría del Map. Acepta los 4 canónicos
 * Y CUALQUIER moduleKey de listing dinámico (e.g. `shopping`, `wellness`).
 * Para los no canónicos, color e icono se derivan del listing entry +
 * hash determinístico del key.
 */
export type MapSource = string;

export function isCanonicalMapSource(s: string): s is CanonicalMapSource {
  return (CANONICAL_MAP_SOURCES as readonly string[]).includes(s);
}
