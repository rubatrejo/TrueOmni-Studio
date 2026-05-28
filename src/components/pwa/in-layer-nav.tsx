'use client';

import { useRouter } from 'next/navigation';

import {
  CalendarNavIcon,
  DiningNavIcon,
  HomeNavIcon,
  MapNavIcon,
  MoreNavIcon,
} from './dashboard-icons';

const NAV = [HomeNavIcon, CalendarNavIcon, DiningNavIcon, MapNavIcon, MoreNavIcon];
const HREF: (string | undefined)[] = [
  '/pwa/dashboard',
  undefined,
  undefined,
  undefined,
  '/pwa/more',
];

/**
 * Bottom nav para pantallas que se renderizan dentro de un layer 375-space escalado
 * (Profile/Settings/Delete). No usa `PwaBottomNav` (que tiene su propio `Layer` con
 * scale) para evitar doble escala: aquí los iconos van en coords 375 directas.
 */
export function InLayerNav() {
  const router = useRouter();
  return (
    <div
      className="absolute left-0 flex"
      style={{ top: 756.5, width: 375, height: 56, backgroundColor: 'hsl(var(--brand-primary))' }}
    >
      {NAV.map((Icon, i) => (
        <button
          key={i}
          type="button"
          onClick={() => HREF[i] && router.push(HREF[i] as string)}
          className="flex flex-1 items-center justify-center text-white"
        >
          <Icon size={22.5} />
        </button>
      ))}
    </div>
  );
}
