'use client';

import { useRouter } from 'next/navigation';

import {
  CalendarNavIcon,
  DiningNavIcon,
  HomeNavIcon,
  MapNavIcon,
  MoreNavIcon,
} from './dashboard-icons';
import { useDevice } from './device-context';
import { Layer } from './mobile-layer';
import { usePwaModuleVisibility } from './pwa-bridge-context';

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

/** Celda del nav → key del módulo que la gobierna. `home`/`more` son chrome (siempre). */
const NAV_KEY_TO_MODULE: Partial<Record<PwaNavKey, string>> = {
  events: 'events',
  dining: 'restaurants',
  map: 'map',
};

/**
 * `PWA_NAV` filtrado por la visibilidad efectiva de módulos: las celdas de
 * módulos desactivados (override PWA o herencia del Kiosk) se omiten; `home` y
 * `more` siempre quedan. Fuente única usada por el bottom nav y `InLayerNav`.
 */
export function usePwaVisibleNav(): typeof PWA_NAV {
  const isVisible = usePwaModuleVisibility();
  return PWA_NAV.filter((cell) => {
    const moduleKey = NAV_KEY_TO_MODULE[cell.key];
    return !moduleKey || isVisible(moduleKey);
  });
}

/**
 * Bottom nav compartido de la PWA (Dashboard, More, …). Iconos Font Awesome 6;
 * la celda `active` se resalta con `--pwa-primary`. Fijo (no scrollea).
 * `active` opcional: las sub-pantallas (p.ej. Connect With Us) lo omiten → sin resaltado.
 */
export function PwaBottomNav({ active }: { active?: PwaNavKey }) {
  const { isTablet } = useDevice();
  const router = useRouter();
  const nav = usePwaVisibleNav();
  // En tablet usamos el nav full-width tamaño dashboard (consistencia del chrome).
  if (isTablet) return <PwaBottomNavTablet active={active} />;
  return (
    <Layer h={56} className="shrink-0" style={{ backgroundColor: BRAND }}>
      <div className="flex h-full w-full">
        {nav.map(({ key, Icon, href }) => (
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

/**
 * Bottom nav del producto **Tablet**: mismo contenido y destinos que `PwaBottomNav`
 * (reusa `usePwaVisibleNav` + `NAV_ARIA` + iconos) pero a todo el ancho de la
 * tablet con celdas más altas (reflow). Alto fijo en px (no 375-space) para que
 * llene el canvas tablet. `iconSize` escala el glifo al nuevo alto.
 */
export function PwaBottomNavTablet({ active }: { active?: PwaNavKey }) {
  const router = useRouter();
  const nav = usePwaVisibleNav();
  return (
    <nav className="flex h-[62px] w-full shrink-0 items-stretch" style={{ backgroundColor: BRAND }}>
      {nav.map(({ key, Icon, href }) => (
        <button
          key={key}
          type="button"
          aria-label={NAV_ARIA[key]}
          aria-current={key === active ? 'page' : undefined}
          onClick={() => href && router.push(href)}
          className="flex flex-1 items-center justify-center text-white transition"
          style={key === active ? { backgroundColor: PWA } : undefined}
        >
          <Icon size={26} />
        </button>
      ))}
    </nav>
  );
}
