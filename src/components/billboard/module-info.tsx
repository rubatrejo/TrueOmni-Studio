/**
 * Mapa estático de keys de módulos (KIOSK_MODULES) → metadata visible en
 * los slots del Billboard idle.
 *
 * Lo usan B1/B2/B3 para reemplazar label, imagen, icono, color de acento y
 * href cuando el usuario asigna un módulo distinto al hardcoded del SVG en
 * `billboard.modules[i]`.
 *
 * `image` referencia paths del cliente activo (`/assets/billboard-N/...`),
 * que `src/app/assets/[...path]/route.ts` resuelve contra
 * `clients/<slug>/assets/`. Si el cliente no tiene la imagen, el `<img>`
 * dispara el `onError` y el fallback del slot (color/imagen original) sigue
 * activo.
 *
 * `icon` y `accentColor` (v2.1) permiten que slots con color sólido + icono
 * (B1 slots 2-3) reaccionen al módulo asignado. Los 2 iconos verbatim del
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
  MapPin,
  Mountain,
  Share2,
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
 */
function lucide(
  LucideIcon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>,
): BillboardIcon {
  const Wrapped: BillboardIcon = ({ size, color }) => (
    <LucideIcon size={size} color={color} strokeWidth={1.6} />
  );
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
  /** Color sólido del slot cuando el slot original tiene fondo plano. v2.1. */
  accentColor: string;
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
    accentColor: '#d63b3b',
  },
  'things-to-do': {
    label: 'Things to do',
    image: IMG.thingsToDo,
    href: '/home/things-to-do',
    icon: lucide(Sparkles),
    accentColor: '#7c4dff',
  },
  'itinerary-builder': {
    label: 'Itinerary',
    labelLine2: 'Builder',
    image: IMG.itinerary,
    href: '/home/itinerary-builder',
    icon: RouteIcon,
    accentColor: '#b9bd39',
  },
  events: {
    label: 'Events',
    image: IMG.events,
    href: '/home/events',
    icon: lucide(CalendarDays),
    accentColor: '#ff6f3c',
  },
  tickets: {
    label: 'Tickets',
    image: IMG.events,
    href: '/home/tickets',
    icon: lucide(Ticket),
    accentColor: '#e91e63',
  },
  passes: {
    label: 'Passes',
    image: IMG.hero,
    href: '/home/passes',
    icon: lucide(BadgeCheck),
    accentColor: '#d4a017',
  },
  guestbook: {
    label: 'Guestbook',
    image: IMG.hero,
    href: '/home/guestbook',
    icon: lucide(BookHeart),
    accentColor: '#26a69a',
  },
  'social-wall': {
    label: 'Social',
    labelLine2: 'Wall',
    image: IMG.hero,
    href: '/home/social-wall',
    icon: lucide(Share2),
    accentColor: '#ec407a',
  },
  'digital-brochure': {
    label: 'Brochure',
    image: IMG.thingsToDo,
    href: '/home/digital-brochure',
    icon: lucide(BookOpen),
    accentColor: '#455a64',
  },
  map: {
    label: 'Map',
    image: IMG.hotels,
    href: '/home/map',
    icon: lucide(MapPin),
    accentColor: '#43a047',
  },
  stay: {
    label: 'Stay',
    image: IMG.hotels,
    href: '/home/stay',
    icon: lucide(BedDouble),
    accentColor: '#a1887f',
  },
  survey: {
    label: 'Survey',
    image: IMG.hero,
    href: '/home/survey',
    icon: lucide(ClipboardList),
    accentColor: '#5c6bc0',
  },
  deals: {
    label: 'Deals',
    image: IMG.eat,
    href: '/home/deals',
    icon: lucide(Tag),
    accentColor: '#ff8f00',
  },
  'photo-booth': {
    label: 'Photo',
    labelLine2: 'Booth',
    image: IMG.hero,
    href: '/home/photo-booth',
    icon: CameraIcon,
    accentColor: '#1796d6',
  },
  trails: {
    label: 'Trails',
    image: IMG.play,
    href: '/home/trails',
    icon: lucide(Mountain),
    accentColor: '#558b2f',
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

/** Devuelve el color sólido del slot. v2.1. Fallback al color original del
 *  SVG (#b9bd39 olive para slot 2, #1796d6 azul para slot 3 de B1). */
export function resolveSlotAccent(slotKey: string | undefined, fallback: string): string {
  if (!slotKey) return fallback;
  return MODULE_BILLBOARD_INFO[slotKey]?.accentColor ?? fallback;
}
