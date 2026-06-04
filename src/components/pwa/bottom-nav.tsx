'use client';

import { useRouter } from 'next/navigation';

import {
  CalendarNavIcon,
  DiningNavIcon,
  HomeNavIcon,
  MapNavIcon,
  MoreNavIcon,
} from './dashboard-icons';
import { Layer } from './mobile-layer';

const BRAND = 'hsl(var(--brand-primary))';
const PWA = 'hsl(var(--pwa-primary))';

export type PwaNavKey = 'home' | 'events' | 'dining' | 'map' | 'more';

/**
 * 5 celdas del nav (75px c/u) — FUENTE ÚNICA de los destinos del bottom nav.
 * Consumido por `PwaBottomNav` y por `InLayerNav` (pantallas en layer escalado)
 * para evitar el drift de hrefs entre ambos. `href` undefined → sin destino aún.
 */
export const PWA_NAV: { key: PwaNavKey; Icon: typeof HomeNavIcon; href?: string }[] = [
  { key: 'home', Icon: HomeNavIcon, href: '/pwa/dashboard' },
  { key: 'events', Icon: CalendarNavIcon, href: '/pwa/events' },
  { key: 'dining', Icon: DiningNavIcon, href: '/pwa/restaurants' },
  { key: 'map', Icon: MapNavIcon, href: '/pwa/map' },
  { key: 'more', Icon: MoreNavIcon, href: '/pwa/more' },
];

/**
 * Etiquetas de accesibilidad por celda (screen readers). En inglés como el resto de
 * `aria-label` del proyecto (Back/Search/Filter…); no son UI visible.
 */
export const NAV_ARIA: Record<PwaNavKey, string> = {
  home: 'Home',
  events: 'Events',
  dining: 'Dining',
  map: 'Map',
  more: 'More',
};

/**
 * Bottom nav compartido de la PWA (Dashboard, More, …). Iconos Font Awesome 6;
 * la celda `active` se resalta con `--pwa-primary`. Fijo (no scrollea).
 * `active` opcional: las sub-pantallas (p.ej. Connect With Us) lo omiten → sin resaltado.
 */
export function PwaBottomNav({ active }: { active?: PwaNavKey }) {
  const router = useRouter();
  return (
    <Layer h={56} className="shrink-0" style={{ backgroundColor: BRAND }}>
      <div className="flex h-full w-full">
        {PWA_NAV.map(({ key, Icon, href }) => (
          <button
            key={key}
            type="button"
            aria-label={NAV_ARIA[key]}
            aria-current={key === active ? 'page' : undefined}
            onClick={() => href && router.push(href)}
            className="flex flex-1 items-center justify-center text-white"
            style={key === active ? { backgroundColor: PWA } : undefined}
          >
            <Icon size={22.5} />
          </button>
        ))}
      </div>
    </Layer>
  );
}
