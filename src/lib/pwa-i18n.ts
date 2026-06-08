import type { PwaConfig } from './config';

/**
 * i18n del slice PWA. Los textos de `features.pwa.*` son monolingües (idioma base
 * del config); las traducciones viven en `features.pwa.i18n[locale][dot-path]`.
 *
 * - El editor PWA (Studio) lista los paths traducibles con `extractTranslatablePaths`
 *   y escribe en `pwa.i18n`.
 * - El runtime PWA resuelve el slice para el locale activo con `resolvePwaForLocale`
 *   (en el layout, vía cookie) y lo pasa como `initial` del `PwaBridgeProvider`; las
 *   pantallas, que leen `usePwaSection`, muestran los textos traducidos sin más cambios.
 */

/**
 * Keys cuyo valor NO es texto traducible (paths de assets, slugs, rutas, ids,
 * coords, URLs…) y subárboles que no se traducen (`i18n`, `ads`). Se saltan tanto
 * en la extracción como en la resolución.
 */
const BLOCKLIST = new Set<string>([
  'i18n',
  'ads',
  'image',
  'images',
  'routes',
  'slug',
  'key',
  'source',
  'href',
  'url',
  'coords',
  'pdfUrl',
  'geojson',
  'defaultCenter',
  'background',
  'id',
  'icon',
  'avatar',
]);

export interface TranslatablePath {
  /** Dot-path dentro del slice, ej. `login.loginCta` o `restaurants.detail.eyebrow`. */
  path: string;
  /** Valor base (idioma del config). */
  value: string;
}

/**
 * Recorre el slice PWA y devuelve los string-leaves traducibles como dot-paths.
 * Salta el `BLOCKLIST` (assets/ids/rutas) y los subárboles `i18n`/`ads`. Las
 * entradas de arrays usan índice numérico en el path (ej. `more.items.0.label`).
 */
export function extractTranslatablePaths(pwa: PwaConfig | null | undefined): TranslatablePath[] {
  const out: TranslatablePath[] = [];
  if (!pwa) return out;

  const walk = (node: unknown, prefix: string, lastKey: string): void => {
    if (typeof node === 'string') {
      if (node.trim().length > 0 && !BLOCKLIST.has(lastKey))
        out.push({ path: prefix, value: node });
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${prefix}.${i}`, lastKey));
      return;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (BLOCKLIST.has(k)) continue;
        walk(v, prefix ? `${prefix}.${k}` : k, k);
      }
    }
  };

  walk(pwa as unknown, '', '');
  return out;
}

/** Escribe `value` en `obj` siguiendo un dot-path; crea objetos intermedios. */
function setByPath(obj: Record<string, unknown>, path: string, value: string): void {
  const parts = path.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const next = cur[part];
    if (next == null || typeof next !== 'object') return; // path inválido → no-op
    cur = next as Record<string, unknown>;
  }
  const leaf = parts[parts.length - 1];
  // Solo sobreescribe leaves de texto ya existentes (no inventa estructura).
  if (typeof cur[leaf] === 'string') cur[leaf] = value;
}

/**
 * Devuelve el slice PWA con los textos del `locale` aplicados sobre el base. No-op
 * si `locale` es el base, no hay overlay, o el overlay está vacío. No muta el input.
 */
export function resolvePwaForLocale(
  pwa: PwaConfig | null,
  locale: string | undefined,
): PwaConfig | null {
  if (!pwa) return pwa;
  const overlay = locale ? pwa.i18n?.[locale] : undefined;
  // El overlay nunca viaja al runtime/cliente: el slice resuelto se entrega sin
  // `i18n` (ya aplicado, y evita serializar el diccionario en el HTML del bridge).
  const { i18n: _drop, ...base } = pwa;
  if (!overlay || Object.keys(overlay).length === 0) return base;

  const clone = structuredClone(base) as PwaConfig;
  for (const [path, value] of Object.entries(overlay)) {
    if (typeof value === 'string' && value.length > 0) {
      setByPath(clone as unknown as Record<string, unknown>, path, value);
    }
  }
  return clone;
}
