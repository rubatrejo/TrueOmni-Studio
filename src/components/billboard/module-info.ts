/**
 * Mapa estático de keys de módulos (KIOSK_MODULES) → metadata visible en
 * los slots del Billboard idle.
 *
 * Lo usan B1/B2/B3 para reemplazar label, imagen y href cuando el usuario
 * asigna un módulo distinto al hardcoded del SVG en `billboard.modules[i]`.
 *
 * `image` referencia paths del cliente activo (`/assets/billboard-N/...`),
 * que `src/app/assets/[...path]/route.ts` resuelve contra
 * `clients/<slug>/assets/`. Si el cliente no tiene la imagen, el `<img>`
 * dispara el `onError` y el fallback del slot (color/imagen original) sigue
 * activo.
 *
 * `href` usa el patrón estándar de tiles del Home (`/home/{key}`).
 */

export type BillboardModuleInfo = {
  /** Texto principal del slot (uppercase, viene del SVG). */
  label: string;
  /** Segunda línea opcional para evitar truncar en cards estrechas. */
  labelLine2?: string;
  /** Imagen sugerida para el slot. Path tipo `/assets/billboard-N/foo.jpg`. */
  image?: string;
  /** Ruta a la que navegar cuando el usuario toca el slot. */
  href: string;
};

/**
 * Pool de imágenes existentes en `clients/default/assets/billboard-{1,2,3}/`.
 * El route handler `/assets/[...path]` cae a default cuando el cliente activo
 * no tiene la imagen, así que estos paths son seguros para todos los kiosks.
 */
const IMG = {
  eat: '/assets/billboard-3/eat.jpg',
  events: '/assets/billboard-2/events.jpg',
  hero: '/assets/billboard-1/hero.jpg',
  hotels: '/assets/billboard-2/hotels.jpg',
  itinerary: '/assets/billboard-2/itinerary.jpg',
  play: '/assets/billboard-3/play.jpg',
  thingsToDo: '/assets/billboard-2/things-to-do.jpg',
} as const;

export const MODULE_BILLBOARD_INFO: Record<string, BillboardModuleInfo> = {
  restaurants: { label: 'Food &', labelLine2: 'Drink', image: IMG.eat, href: '/home/restaurants' },
  'things-to-do': { label: 'Things to do', image: IMG.thingsToDo, href: '/home/things-to-do' },
  'itinerary-builder': {
    label: 'Itinerary',
    labelLine2: 'Builder',
    image: IMG.itinerary,
    href: '/home/itinerary-builder',
  },
  events: { label: 'Events', image: IMG.events, href: '/home/events' },
  // Tickets / Passes: events tienen vibra ticketed, hero como secondary
  tickets: { label: 'Tickets', image: IMG.events, href: '/home/tickets' },
  passes: { label: 'Passes', image: IMG.hero, href: '/home/passes' },
  // Guestbook / Social wall: hero/landscape genéricos
  guestbook: { label: 'Guestbook', image: IMG.hero, href: '/home/guestbook' },
  'social-wall': { label: 'Social', labelLine2: 'Wall', image: IMG.hero, href: '/home/social-wall' },
  'digital-brochure': { label: 'Brochure', image: IMG.thingsToDo, href: '/home/digital-brochure' },
  map: { label: 'Map', image: IMG.hotels, href: '/home/map' },
  stay: { label: 'Stay', image: IMG.hotels, href: '/home/stay' },
  survey: { label: 'Survey', image: IMG.hero, href: '/home/survey' },
  deals: { label: 'Deals', image: IMG.eat, href: '/home/deals' },
  'photo-booth': {
    label: 'Photo',
    labelLine2: 'Booth',
    image: IMG.hero,
    href: '/home/photo-booth',
  },
  trails: { label: 'Trails', image: IMG.play, href: '/home/trails' },
};

/** Devuelve el label resuelto del slot con fallback al original del SVG. */
export function resolveSlotLabel(
  slotKey: string | undefined,
  fallback: { label: string; labelLine2?: string },
): { label: string; labelLine2?: string } {
  if (!slotKey) return fallback;
  const info = MODULE_BILLBOARD_INFO[slotKey];
  if (!info) return fallback;
  return { label: info.label, labelLine2: info.labelLine2 };
}

/** Devuelve la imagen resuelta del slot. Si no hay módulo o el módulo no
 *  tiene imagen específica, devuelve el fallback (la imagen original del
 *  SVG). Esto preserva el pixel-perfect cuando el slot está sin asignar. */
export function resolveSlotImage(slotKey: string | undefined, fallback: string): string {
  if (!slotKey) return fallback;
  return MODULE_BILLBOARD_INFO[slotKey]?.image ?? fallback;
}

/** Devuelve la ruta de navegación del slot. Si no hay módulo, devuelve la
 *  ruta default del Billboard (`/home`, el dashboard). */
export function resolveSlotHref(slotKey: string | undefined): string {
  if (!slotKey) return '/home';
  return MODULE_BILLBOARD_INFO[slotKey]?.href ?? '/home';
}
