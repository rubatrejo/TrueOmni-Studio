'use client';

import { useRouter } from 'next/navigation';

import { NAV_ARIA, PWA_NAV, type PwaNavKey } from './bottom-nav';

/**
 * Bottom nav para pantallas que se renderizan dentro de un layer 375-space escalado
 * (Profile/Settings/Delete/Restaurants). No usa `PwaBottomNav` (que tiene su propio
 * `Layer` con scale) para evitar doble escala: aquí los iconos van en coords 375 directas.
 * Consume `PWA_NAV` (misma fuente que el bottom nav) → mismos destinos, sin drift.
 */
export function InLayerNav({ active }: { active?: PwaNavKey }) {
  const router = useRouter();
  return (
    <div
      className="absolute left-0 flex"
      style={{ top: 756.5, width: 375, height: 56, backgroundColor: 'hsl(var(--brand-primary))' }}
    >
      {PWA_NAV.map(({ key, Icon, href }) => (
        <button
          key={key}
          type="button"
          aria-label={NAV_ARIA[key]}
          aria-current={key === active ? 'page' : undefined}
          onClick={() => href && router.push(href)}
          className="flex flex-1 items-center justify-center text-white"
          style={key === active ? { backgroundColor: 'hsl(var(--pwa-primary))' } : undefined}
        >
          <Icon size={22.5} />
        </button>
      ))}
    </div>
  );
}
