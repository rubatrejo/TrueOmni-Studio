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
 *   - welcome.background                    ← fondo idle del kiosk (image)
 *   - login.background                      ← welcome.background resuelto ↦ idle
 *
 * IMPORTANTE — el fondo idle del kiosk es `billboard.background` (lo que el
 * operador ve en el idle), NO el campo muerto `branding.idleBackground`
 * (desconectado del runtime desde 2026-05-25). En runtime ese valor llega como
 * `config.features.billboard_background` (lo persiste el publish del kiosk);
 * en el editor del Studio se lee del `billboard.background` del KioskConfig.
 */
import type { KioskConfig, PwaConfig } from '@/lib/config';

/** Imágenes del kiosk que la PWA puede heredar (todas opcionales). */
export interface PwaImageSources {
  /** `branding.homeHero.src` del kiosk (solo si `kind === 'image'`). */
  homeHero?: string;
  /** Fondo idle del kiosk = `billboard.background.src` (solo si es imagen). */
  idleBackground?: string;
  /** Mapa `key → image` de las tiles del kiosk (home tiles). */
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

/**
 * Construye las `PwaImageSources` desde el **config de runtime** (el `config.json`
 * que comparten kiosk y PWA). Es la fuente para la resolución LIVE: la PWA hereda
 * lo que el kiosk tiene en el mismo config, sin republicar.
 *
 *   - homeHero        ← `branding.homeHero` (kind image)
 *   - idleBackground  ← `features.billboard_background` (type image)
 *   - tileImages      ← `features.home.tiles[]` (key → image)
 */
export function pwaImageSourcesFromConfig(config: KioskConfig): PwaImageSources {
  const tileImages: Record<string, string> = {};
  for (const t of config.features?.home?.tiles ?? []) {
    if (t.image) tileImages[t.key] = t.image;
  }
  const homeHero = config.branding?.homeHero;
  const idle = config.features?.billboard_background;
  return {
    homeHero: homeHero?.kind === 'image' && homeHero.src ? homeHero.src : undefined,
    idleBackground: idle?.type === 'image' && idle.src ? idle.src : undefined,
    tileImages,
  };
}

/**
 * Resuelve el slice `features.pwa` con las imágenes heredadas del kiosk leídas
 * del **mismo** config de runtime. Devuelve `undefined` si no hay slice PWA.
 * Pensado para los server components de la PWA (`/pwa`, `/pwa/login`,
 * `/pwa/dashboard`) — herencia LIVE sin republish.
 */
export function resolvePwaConfigImages(config: KioskConfig): PwaConfig | undefined {
  const pwa = config.features?.pwa;
  if (!pwa) return undefined;
  return resolvePwaImages(pwa, pwaImageSourcesFromConfig(config));
}
