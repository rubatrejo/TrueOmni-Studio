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
  /**
   * Mapa `key → label` de las tiles del kiosk (home tiles). El nombre del módulo
   * tiene una sola fuente de verdad: el Kiosk. Si una tile del Dashboard PWA
   * comparte `key` con una del Kiosk, su label SIEMPRE refleja el del Kiosk
   * (renombrar en el Kiosk se ve en la PWA, sin editar dos veces). Las tiles
   * PWA-only (sin match) conservan su propio label.
   */
  tileLabels?: Record<string, string>;
}

/** Un campo de imagen está "vacío" (debe heredar) si es nullish o solo espacios. */
function isEmpty(value: string | undefined | null): boolean {
  return !value || value.trim() === '';
}

/**
 * Placeholders del SEED de la PWA: el slice se crea con imágenes de scaffolding
 * ya puestas (no son una elección del operador). Mientras sigan ahí, la PWA debe
 * HEREDAR del kiosk. Un upload real del operador es siempre una URL http(s)/
 * blob/data (ver `ImageField` → `uploadToBlob`), nunca una de estas rutas, así
 * que distinguir por valor exacto es seguro y no pisa overrides reales.
 * Mantener en sync con el seed PWA (welcome/login/dashboard).
 */
const PWA_SEED_IMAGE_PLACEHOLDERS: ReadonlySet<string> = new Set([
  'assets/pwa/welcome-bg.jpg',
  'assets/pwa/dashboard/hero.jpg',
  'assets/pwa/dashboard/quick-regions.jpg',
  'assets/pwa/dashboard/quick-trip-planner.jpg',
  'assets/pwa/dashboard/quick-places-to-stay.jpg',
  'assets/pwa/dashboard/quick-events.jpg',
  'assets/pwa/dashboard/tile-scavenger-hunt.jpg',
]);

/**
 * Un campo de imagen es HEREDABLE (debe tomar la del kiosk) si:
 *  - está vacío, o
 *  - sigue siendo un placeholder del seed (lista de arriba), o
 *  - es una ruta default de tile del kiosk (`assets/home/tiles/…`) — el seed de
 *    los tiles de la PWA apunta a esas rutas, así que se considera "sin tocar".
 * Cualquier otra cosa (URL http/blob/data subida, u otra ruta) es una elección
 * explícita del operador y se respeta (override gana).
 */
export function isInheritable(value: string | undefined | null): boolean {
  if (isEmpty(value)) return true;
  const v = (value as string).trim().replace(/^\//, '');
  if (PWA_SEED_IMAGE_PLACEHOLDERS.has(v)) return true;
  if (v.startsWith('assets/home/tiles/')) return true;
  return false;
}

/** Devuelve `current` si es una elección real; si no, la fuente heredada (o ''). */
function inherit(current: string | undefined, source: string | undefined): string {
  if (!isInheritable(current)) return current as string;
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
  const tileLabels = sources.tileLabels ?? {};

  // 1. Dashboard: hero + tiles + quickAccess (match por key con el kiosk).
  //    - imagen: hereda si el campo PWA está "sin tocar" (vacío/placeholder).
  //    - label: el nombre del módulo SIEMPRE viene del Kiosk si hay match por
  //      key (fuente única; renombrar en el Kiosk se refleja en la PWA). Las
  //      tiles PWA-only (sin match) conservan su label.
  if (pwa.dashboard) {
    next.dashboard = {
      ...pwa.dashboard,
      heroImage: inherit(pwa.dashboard.heroImage, sources.homeHero),
      tiles: pwa.dashboard.tiles.map((t) => ({
        ...t,
        image: inherit(t.image, tileImages[t.key]),
        label: tileLabels[t.key] ?? t.label,
      })),
      quickAccess: pwa.dashboard.quickAccess.map((q) => ({
        ...q,
        image: inherit(q.image, tileImages[q.key]),
        label: tileLabels[q.key] ?? q.label,
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
  const tileLabels: Record<string, string> = {};
  for (const t of config.features?.home?.tiles ?? []) {
    if (t.image) tileImages[t.key] = t.image;
    if (t.label) tileLabels[t.key] = t.label;
  }
  const homeHero = config.branding?.homeHero;
  const idle = config.features?.billboard_background;
  return {
    homeHero: homeHero?.kind === 'image' && homeHero.src ? homeHero.src : undefined,
    idleBackground: idle?.type === 'image' && idle.src ? idle.src : undefined,
    tileImages,
    tileLabels,
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
