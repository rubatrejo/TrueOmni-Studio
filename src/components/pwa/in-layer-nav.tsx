'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { NAV_ARIA, PwaBottomNavTablet, usePwaVisibleNav, type PwaNavKey } from './bottom-nav';
import { useDevice } from './device-context';

/**
 * Bottom nav para pantallas que se renderizan dentro de un layer 375-space escalado
 * (Profile/Settings/Delete/Restaurants). No usa `PwaBottomNav` (que tiene su propio
 * `Layer` con scale) para evitar doble escala: aquí los iconos van en coords 375 directas.
 * Consume `PWA_NAV` (misma fuente que el bottom nav) → mismos destinos, sin drift.
 *
 * **Tablet:** se renderiza vía PORTAL al canvas (`[data-pwa-canvas]`) como el nav
 * full-width tamaño dashboard (`PwaBottomNavTablet`), ESCAPANDO de la caja 375-space
 * escalada. Así el chrome es consistente con el resto del tablet. Phone IDÉNTICO.
 */
export function InLayerNav({ active }: { active?: PwaNavKey }) {
  const router = useRouter();
  const nav = usePwaVisibleNav();
  const { isTablet } = useDevice();
  const [canvas, setCanvas] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isTablet) setCanvas(document.querySelector<HTMLElement>('[data-pwa-canvas]'));
  }, [isTablet]);

  // ---- Tablet: nav full-width fijo al fondo del canvas (tamaño dashboard) ----
  if (isTablet) {
    if (!canvas) return null;
    return createPortal(
      <div className="absolute inset-x-0 bottom-0 z-30">
        <PwaBottomNavTablet active={active} />
      </div>,
      canvas,
    );
  }

  // ---- Phone: nav absolute en 375-space (IDÉNTICO al original) ----
  return (
    <div
      className="absolute left-0 flex"
      style={{ top: 756.5, width: 375, height: 56, backgroundColor: 'hsl(var(--brand-primary))' }}
    >
      {nav.map(({ key, Icon, href }) => (
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
