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

/** 5 celdas del nav (75px c/u). `href` undefined → aún sin pantalla destino. */
const NAV: { key: PwaNavKey; Icon: typeof HomeNavIcon; href?: string }[] = [
  { key: 'home', Icon: HomeNavIcon, href: '/pwa/dashboard' },
  { key: 'events', Icon: CalendarNavIcon },
  { key: 'dining', Icon: DiningNavIcon, href: '/pwa/restaurants' },
  { key: 'map', Icon: MapNavIcon, href: '/pwa/map' },
  { key: 'more', Icon: MoreNavIcon, href: '/pwa/more' },
];

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
        {NAV.map(({ key, Icon, href }) => (
          <button
            key={key}
            type="button"
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
