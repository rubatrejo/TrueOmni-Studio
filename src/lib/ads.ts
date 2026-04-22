import type { Ad, AdKind, KioskConfig } from './config';

/** Key de `sessionStorage` donde se almacenan los IDs de ads dismissed. */
export const AD_DISMISSED_STORAGE_KEY = 'kiosk_ads_dismissed';

/**
 * ¿El path matchea el patrón? Soporta:
 *   - `/exact` — equivalencia estricta.
 *   - `/prefix/*` — equivalencia prefix + segmento siguiente.
 *
 * Ej: `matchesRoute('/home/restaurants/*', '/home/restaurants')      → true`
 *     `matchesRoute('/home/restaurants/*', '/home/restaurants/lolas') → true`
 *     `matchesRoute('/home/restaurants',   '/home/restaurants/lolas') → false`
 */
export function matchesRoute(pattern: string, path: string): boolean {
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    return path === prefix || path.startsWith(`${prefix}/`);
  }
  return pattern === path;
}

/**
 * Devuelve el primer `Ad` de cada `kind` que matchea la ruta dada.
 * Un mismo array puede tener varios ads del mismo kind con rutas distintas:
 * gana el primero del array que cumpla (determinístico, sin rotación en v1).
 */
export function getAdsForRoute(ads: readonly Ad[], path: string): Record<AdKind, Ad | null> {
  const out: Record<AdKind, Ad | null> = {
    popup: null,
    hero: null,
    bottom: null,
  };
  for (const ad of ads) {
    if (ad.enabled === false) continue;
    if (out[ad.kind] !== null) continue;
    if (!ad.routes.some((r) => matchesRoute(r, path))) continue;
    out[ad.kind] = ad;
  }
  return out;
}

/** Lee el catálogo del config del cliente; `[]` si no hay advertisements. */
export function getAdsFromConfig(config: KioskConfig): readonly Ad[] {
  return config.features?.advertisements?.ads ?? [];
}
