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

export const MODULE_BILLBOARD_INFO: Record<string, BillboardModuleInfo> = {
  restaurants: {
    label: 'Food &',
    labelLine2: 'Drink',
    image: '/assets/billboard-3/eat.jpg',
    href: '/home/restaurants',
  },
  'things-to-do': {
    label: 'Things to do',
    image: '/assets/billboard-2/things-to-do.jpg',
    href: '/home/things-to-do',
  },
  'itinerary-builder': {
    label: 'Itinerary',
    labelLine2: 'Builder',
    image: '/assets/billboard-2/itinerary.jpg',
    href: '/home/itinerary-builder',
  },
  events: {
    label: 'Events',
    image: '/assets/billboard-2/events.jpg',
    href: '/home/events',
  },
  passes: { label: 'Passes', href: '/home/passes' },
  tickets: { label: 'Tickets', href: '/home/tickets' },
  guestbook: { label: 'Guestbook', href: '/home/guestbook' },
  'social-wall': { label: 'Social', labelLine2: 'Wall', href: '/home/social-wall' },
  'digital-brochure': { label: 'Brochure', href: '/home/digital-brochure' },
  map: { label: 'Map', href: '/home/map' },
  stay: {
    label: 'Stay',
    image: '/assets/billboard-2/hotels.jpg',
    href: '/home/stay',
  },
  survey: { label: 'Survey', href: '/home/survey' },
  deals: { label: 'Deals', href: '/home/deals' },
  'photo-booth': { label: 'Photo', labelLine2: 'Booth', href: '/home/photo-booth' },
  trails: {
    label: 'Trails',
    image: '/assets/billboard-3/play.jpg',
    href: '/home/trails',
  },
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
