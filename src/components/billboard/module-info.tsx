/**
 * Mapa estático de keys de módulos (KIOSK_MODULES) → metadata visible en
 * los slots del Billboard idle.
 *
 * Lo usan B1/B2/B3 para reemplazar label, imagen, icono y href cuando el
 * usuario asigna un módulo distinto al hardcoded del SVG en
 * `billboard.modules[i]`.
 *
 * `image` referencia paths del cliente activo (`/assets/billboard-N/...`),
 * que `src/app/assets/[...path]/route.ts` resuelve contra
 * `clients/<slug>/assets/`. Si el cliente no tiene la imagen, el `<img>`
 * dispara el `onError` y el fallback del slot (color/imagen original) sigue
 * activo.
 *
 * `icon` (v2.1) permite que slots con color sólido + icono (B1 slots 2-3)
 * sustituyan el icono cuando el operador asigna otro módulo. **El color
 * sólido del slot se mantiene fijo** — la identidad cromática (olive #b9bd39
 * para slot 2, azul #1796d6 para slot 3) pertenece al SVG original, no al
 * módulo asignado (decisión Rubén 2026-05-01). Los 2 iconos verbatim del
 * SVG original (route, camera) viven en `./icons/`. Los 13 restantes usan
 * lucide-react.
 *
 * `href` usa el patrón estándar de tiles del Home (`/home/{key}`).
 */

import {
  BadgeCheck,
  BedDouble,
  BookHeart,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Hash,
  MapPin,
  Mountain,
  Sparkles,
  Tag,
  Ticket,
  Utensils,
} from 'lucide-react';
import type { ComponentType } from 'react';

import { CameraIcon } from './icons/camera-icon';
import { RouteIcon } from './icons/route-icon';

/** Componente icono usado en slots con color sólido (B1 slots 2-3). */
export type BillboardIcon = ComponentType<{ size: number; color: string }>;

/**
 * Wrapper que adapta cualquier lucide-react al contrato `{ size, color }`
 * que usan los slots del Billboard. Centraliza el bridging para que el
 * catálogo trate verbatim y lucide igual.
 *
 * Renderiza el glyph lucide al 80% dentro de una bounding box del tamaño
 * nominal. Esto compensa que los verbatim (route, camera) traen padding
 * natural en su viewBox (paths centrados con margen), mientras que los
 * lucide-react ocupan toda su caja sin holgura. Sin este wrapper, un
 * lucide a size=120 se ve visualmente más pesado que un verbatim a
 * size=120 y "pega" con el label adyacente (caso BROCHURE en slot 2 con
 * BookOpen). Con padding interno se igualan ópticamente.
 */
function lucide(
  LucideIcon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>,
): BillboardIcon {
  const Wrapped: BillboardIcon = ({ size, color }) => {
    const inner = Math.round(size * 0.8);
    return (
      <span
        className="inline-flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <LucideIcon size={inner} color={color} strokeWidth={1.6} />
      </span>
    );
  };
  Wrapped.displayName = `Lucide(${LucideIcon.displayName ?? 'Icon'})`;
  return Wrapped;
}

export type BillboardModuleInfo = {
  /** Texto principal del slot (uppercase, viene del SVG). */
  label: string;
  /** Segunda línea opcional para evitar truncar en cards estrechas. */
  labelLine2?: string;
  /** Imagen sugerida para el slot. Path tipo `/assets/billboard-N/foo.jpg`. */
  image?: string;
  /** Ruta a la que navegar cuando el usuario toca el slot. */
  href: string;
  /** Icono del módulo (verbatim SVG o lucide). v2.1. */
  icon: BillboardIcon;
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
  restaurants: {
    label: 'Food &',
    labelLine2: 'Drink',
    image: IMG.eat,
    href: '/home/restaurants',
    icon: lucide(Utensils),
  },
  'things-to-do': {
    label: 'Things',
    labelLine2: 'to Do',
    image: IMG.thingsToDo,
    href: '/home/things-to-do',
    icon: lucide(Sparkles),
  },
  'itinerary-builder': {
    label: 'Trip',
    labelLine2: 'Planner',
    image: IMG.itinerary,
    href: '/home/itinerary-builder',
    icon: RouteIcon,
  },
  events: {
    label: 'Events',
    image: IMG.events,
    href: '/home/events',
    icon: lucide(CalendarDays),
  },
  tickets: {
    label: 'Tickets',
    image: IMG.events,
    href: '/home/tickets',
    icon: lucide(Ticket),
  },
  passes: {
    label: 'Passes',
    image: IMG.hero,
    href: '/home/passes',
    icon: lucide(BadgeCheck),
  },
  guestbook: {
    label: 'Guest',
    labelLine2: 'Book',
    image: IMG.hero,
    href: '/home/guestbook',
    icon: lucide(BookHeart),
  },
  'social-wall': {
    label: 'Social',
    labelLine2: 'Wall',
    image: IMG.hero,
    href: '/home/social-wall',
    icon: lucide(Hash),
  },
  'digital-brochure': {
    label: 'Brochure',
    image: IMG.thingsToDo,
    href: '/home/digital-brochure',
    icon: lucide(BookOpen),
  },
  map: {
    label: 'Map',
    image: IMG.hotels,
    href: '/home/map',
    icon: lucide(MapPin),
  },
  stay: {
    label: 'Stay',
    image: IMG.hotels,
    href: '/home/stay',
    icon: lucide(BedDouble),
  },
  survey: {
    label: 'Survey',
    image: IMG.hero,
    href: '/home/survey',
    icon: lucide(ClipboardList),
  },
  deals: {
    label: 'Deals',
    image: IMG.eat,
    href: '/home/deals',
    icon: lucide(Tag),
  },
  'photo-booth': {
    label: 'Photo',
    labelLine2: 'Booth',
    image: IMG.hero,
    href: '/home/photo-booth',
    icon: CameraIcon,
  },
  trails: {
    label: 'Trails',
    image: IMG.play,
    href: '/home/trails',
    icon: lucide(Mountain),
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

/** Devuelve el componente icono del slot. v2.1. Fallback al icono original
 *  del SVG (route para Itinerary, camera para Photo Booth). */
export function resolveSlotIcon(
  slotKey: string | undefined,
  fallback: BillboardIcon,
): BillboardIcon {
  if (!slotKey) return fallback;
  return MODULE_BILLBOARD_INFO[slotKey]?.icon ?? fallback;
}
