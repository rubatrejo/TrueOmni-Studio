'use client';

import { useRouter } from 'next/navigation';

import {
  CalendarNavIcon,
  DiningNavIcon,
  HomeNavIcon,
  MapNavIcon,
  MoreNavIcon,
} from './dashboard-icons';

type NavKey = 'home' | 'events' | 'dining' | 'map' | 'more';

const NAV = [HomeNavIcon, CalendarNavIcon, DiningNavIcon, MapNavIcon, MoreNavIcon];
const KEYS: NavKey[] = ['home', 'events', 'dining', 'map', 'more'];
const HREF: Record<NavKey, string | undefined> = {
  home: '/pwa/dashboard',
  events: undefined,
  dining: '/pwa/restaurants',
  map: undefined,
  more: '/pwa/more',
};

/**
 * Bottom nav para pantallas que se renderizan dentro de un layer 375-space escalado
 * (Profile/Settings/Delete/Restaurants). No usa `PwaBottomNav` (que tiene su propio
 * `Layer` con scale) para evitar doble escala: aquí los iconos van en coords 375 directas.
 */
export function InLayerNav({ active }: { active?: NavKey }) {
  const router = useRouter();
  return (
    <div
      className="absolute left-0 flex"
      style={{ top: 756.5, width: 375, height: 56, backgroundColor: 'hsl(var(--brand-primary))' }}
    >
      {NAV.map((Icon, i) => {
        const key = KEYS[i];
        const href = HREF[key];
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => href && router.push(href)}
            className="flex flex-1 items-center justify-center text-white"
            style={isActive ? { backgroundColor: 'hsl(var(--pwa-primary))' } : undefined}
          >
            <Icon size={22.5} />
          </button>
        );
      })}
    </div>
  );
}
