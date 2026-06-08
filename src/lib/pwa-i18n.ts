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
 * coords, URLs, teléfonos, horas, fechas, enums…) y subárboles que no se traducen
 * (`i18n`, `ads`). Se saltan tanto en la extracción como en la resolución.
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
  // No-texto suelto: contacto, horas, fechas, enums y assets que se colaban como leaves.
  'phone',
  'website',
  'address',
  'directionsUrl',
  'timestamp',
  'day',
  'accent',
  'type',
  'code',
  'open',
  'close',
  'todayClose',
  'route',
  'hashtag',
  'weather',
  'photo',
  'heroImage',
  'floorPlanImage',
  'question',
]);

/**
 * Subárboles de **contenido seed/demo del cliente** que se podan completos. Viven en
 * los editores de _contenido/setup_ del Studio (no en el editor i18n): hunts, floors,
 * países, usuario demo, notificaciones seed, horarios… La poda es por **dot-path**
 * (no por nombre de key suelto) para no colisionar con UI legítima que reutiliza la
 * misma key (p. ej. `more.items` sí es UI white-label, `profile.favorites.items` no).
 * Decisión: los editores PWA editan solo textos white-label; el contenido del setup
 * no se traduce vía i18n PWA.
 */
const SKIP_PATH_PREFIXES = [
  'scavengerHunt.hunts',
  'scavengerHunt.socialLinks',
  'wayfinding.floors',
  'createAccount.countries',
  'profile.user',
  'profile.favorites.items',
  'profile.upcomingEvents.items',
  'profile.editProfile.prefill',
  'notifications.seed',
  'connectWithUs.social',
  'connectWithUs.hours.schedule',
];

/** True si el dot-path cae dentro de un subárbol seed/demo de `SKIP_PATH_PREFIXES`. */
function isSkippedPrefix(path: string): boolean {
  return SKIP_PATH_PREFIXES.some((pre) => path === pre || path.startsWith(`${pre}.`));
}

export interface TranslatablePath {
  /** Dot-path dentro del slice, ej. `login.loginCta` o `restaurants.detail.eyebrow`. */
  path: string;
  /** Valor base (idioma del config). */
  value: string;
}

/**
 * Recorre el slice PWA y devuelve los string-leaves **de UI white-label** como
 * dot-paths. Salta el `BLOCKLIST` (no-texto: assets/ids/rutas/contacto/horas/enums)
 * y poda los subárboles de contenido seed/demo de `SKIP_PATH_PREFIXES`. Las entradas
 * de arrays usan índice numérico en el path (ej. `more.items.0.label`).
 */
export function extractTranslatablePaths(pwa: PwaConfig | null | undefined): TranslatablePath[] {
  const out: TranslatablePath[] = [];
  if (!pwa) return out;

  const walk = (node: unknown, prefix: string, lastKey: string): void => {
    if (isSkippedPrefix(prefix)) return;
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
