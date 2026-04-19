'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef } from 'react';

const KIOSK_WIDTH_PX = 1080;
const KIOSK_HEIGHT_PX = 1920;

/**
 * Canvas fijo 1080×1920 (retrato) escalado para caber en el viewport
 * del navegador sin scroll, preservando el aspecto 9:16.
 *
 * El escalado se aplica con `transform: scale(var(--kiosk-scale))` y la
 * variable se calcula en un useEffect (resize-aware). Los hijos siguen
 * diseñándose en el espacio lógico 1080×1920 (posiciones absolutas
 * exactas del SVG, sin cálculo manual).
 */
export function KioskCanvas({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const updateScale = () => {
      const scale = Math.min(
        window.innerWidth / KIOSK_WIDTH_PX,
        window.innerHeight / KIOSK_HEIGHT_PX,
      );
      el.style.setProperty('--kiosk-scale', String(scale));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-background"
      style={{ ['--kiosk-scale' as string]: 1 } as CSSProperties}
    >
      <div
        data-kiosk-canvas
        className="relative origin-center overflow-hidden bg-background text-foreground shadow-2xl"
        style={{
          width: `${KIOSK_WIDTH_PX}px`,
          height: `${KIOSK_HEIGHT_PX}px`,
          transform: 'scale(var(--kiosk-scale))',
        }}
      >
        {children}
      </div>
    </div>
  );
}
