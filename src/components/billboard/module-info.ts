/**
 * Mapa estático de keys de módulos (KIOSK_MODULES) → metadata visible en
 * los slots del Billboard idle.
 *
 * Lo usan B1 (4 cards grid) y B3 (2×2) para sustituir labels cuando el
 * usuario asigna un módulo distinto al hardcoded del SVG en
 * `billboard.modules[index]`. B2 (carousel) además mapea `image` para
 * regenerar el array `CARDS`.
 *
 * Si el cliente customiza `tile.label` en el Modules tab, ese cambio
 * NO se refleja aquí en v2 — los labels del Billboard son los canónicos
 * del catálogo. Hookear al Modules tab queda como v2.2.
 *
 * `labelLine2` se usa solo cuando el espacio dicta dos líneas (B2 card
 * "Itinerary / Builder" del SVG original).
 */

export type BillboardModuleInfo = {
  /** Texto principal del slot. */
  label: string;
  /** Segunda línea opcional para evitar truncar. */
  labelLine2?: string;
  /** Imagen sugerida cuando el slot soporta cambio de imagen (B2). */
  image?: string;
};

export const MODULE_BILLBOARD_INFO: Record<string, BillboardModuleInfo> = {
  restaurants: { label: 'Food &', labelLine2: 'Drink', image: '/assets/billboard-3/eat.jpg' },
  'things-to-do': {
    label: 'Things to do',
    image: '/assets/billboard-2/things-to-do.jpg',
  },
  'itinerary-builder': {
    label: 'Itinerary',
    labelLine2: 'Builder',
    image: '/assets/billboard-2/itinerary.jpg',
  },
  events: { label: 'Events', image: '/assets/billboard-2/events.jpg' },
  passes: { label: 'Passes' },
  tickets: { label: 'Tickets' },
  guestbook: { label: 'Guestbook' },
  'social-wall': { label: 'Social', labelLine2: 'Wall' },
  'digital-brochure': { label: 'Brochure' },
  map: { label: 'Map' },
  stay: { label: 'Stay', image: '/assets/billboard-2/hotels.jpg' },
  survey: { label: 'Survey' },
  deals: { label: 'Deals' },
  'photo-booth': { label: 'Photo', labelLine2: 'Booth' },
  trails: { label: 'Trails' },
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

/** Devuelve la imagen resuelta del slot con fallback al original. */
export function resolveSlotImage(slotKey: string | undefined, fallback: string): string {
  if (!slotKey) return fallback;
  return MODULE_BILLBOARD_INFO[slotKey]?.image ?? fallback;
}
