/**
 * Herencia de imágenes de contenido Kiosk → PWA — fuente ÚNICA de la lógica.
 *
 * El Kiosk Portrait es el producto principal. La PWA companion tiene sus propios
 * campos de imagen (`features.pwa.dashboard.tiles[].image`, `dashboard.heroImage`,
 * `welcome.background`, `login.background`) independientes del kiosk. Cuando un
 * campo de la PWA está VACÍO, hereda la imagen equivalente del kiosk; cuando el
 * operador sube una propia, esa gana (override); si la borra, vuelve a heredar.
 * Es un override SILENCIOSO (sin badge/reset): basta el campo vacío o lleno.
 *
 * La herencia es por LECTURA — `resolvePwaImages` no muta el slice de origen;
 * devuelve una copia con los campos vacíos rellenados desde `PwaImageSources`.
 * Se usa en dos sitios (misma lógica): el editor PWA antes de empujar el slice
 * al preview, y el publish al hornear el slice publicado para producción.
 *
 * Mapping kiosk → PWA:
 *   - dashboard.tiles[].image (por `key`)  ← tile del kiosk con la misma key
 *   - dashboard.quickAccess[].image (por `key`) ← idem (si la key matchea)
 *   - dashboard.heroImage                   ← branding.homeHero.src (kind image)
 *   - welcome.background                    ← branding.idleBackground.src (kind image)
 *   - login.background                      ← welcome.background resuelto ↦ idleBackground
 */
import type { PwaConfig } from '@/lib/config';

/** Imágenes del kiosk que la PWA puede heredar (todas opcionales). */
export interface PwaImageSources {
  /** `branding.homeHero.src` del kiosk (solo si `kind === 'image'`). */
  homeHero?: string;
  /** `branding.idleBackground.src` del kiosk (solo si `kind === 'image'`). */
  idleBackground?: string;
  /** Mapa `key → image` de las tiles del kiosk (`modules.tiles`). */
  tileImages?: Record<string, string>;
}

/** Un campo de imagen está "vacío" (debe heredar) si es nullish o solo espacios. */
function isEmpty(value: string | undefined | null): boolean {
  return !value || value.trim() === '';
}

/** Devuelve `current` si tiene contenido; si no, la fuente heredada (o ''). */
function inherit(current: string | undefined, source: string | undefined): string {
  if (!isEmpty(current)) return current as string;
  return source && !isEmpty(source) ? source : (current ?? '');
}

/**
 * Devuelve una COPIA del slice PWA con los campos de imagen vacíos rellenados
 * desde el kiosk. No muta `pwa`. Idempotente: si los campos ya están llenos o no
 * hay fuentes, devuelve el slice equivalente (los campos llenos nunca se pisan).
 */
export function resolvePwaImages(pwa: PwaConfig, sources: PwaImageSources): PwaConfig {
  const next: PwaConfig = { ...pwa };
  const tileImages = sources.tileImages ?? {};

  // 1. Dashboard: hero + tiles + quickAccess (match por key con el kiosk).
  if (pwa.dashboard) {
    next.dashboard = {
      ...pwa.dashboard,
      heroImage: inherit(pwa.dashboard.heroImage, sources.homeHero),
      tiles: pwa.dashboard.tiles.map((t) => ({
        ...t,
        image: inherit(t.image, tileImages[t.key]),
      })),
      quickAccess: pwa.dashboard.quickAccess.map((q) => ({
        ...q,
        image: inherit(q.image, tileImages[q.key]),
      })),
    };
  }

  // 2. Welcome background ← idle background del kiosk.
  const welcomeBg = pwa.welcome
    ? inherit(pwa.welcome.background, sources.idleBackground)
    : undefined;
  if (pwa.welcome) {
    next.welcome = { ...pwa.welcome, background: welcomeBg as string };
  }

  // 3. Login background ← su propio valor → welcome resuelto → idle del kiosk.
  if (pwa.login) {
    const loginBg = inherit(pwa.login.background, welcomeBg ?? sources.idleBackground);
    next.login = { ...pwa.login, background: loginBg };
  }

  return next;
}
