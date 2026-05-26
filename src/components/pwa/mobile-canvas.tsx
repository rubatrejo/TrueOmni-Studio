'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

/** Canvas de referencia de la PWA (mobile retrato). Adaptado de artboards XD 375×812. */
const PWA_WIDTH_PX = 390;
const PWA_HEIGHT_PX = 844;

/** Padding alrededor del canvas en dev-view (fuera del iframe del Studio). */
const VIEWPORT_PADDING_X_PX = 48;
const VIEWPORT_PADDING_Y_PX = 48;

/**
 * Detección eager de iframe (preview del Studio). Mismo criterio que `KioskCanvas`:
 * si estamos embebidos, el host externo controla la escala y el canvas se pinta
 * a tamaño real para evitar la doble escala.
 */
function detectEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.parent !== window;
  } catch {
    return true; // cross-origin → asumimos embedded
  }
}

/**
 * Canvas fijo 390×844 (mobile retrato) para la PWA.
 *
 * - **Dev-view** (fuera de iframe): se escala para caber en el viewport del navegador
 *   preservando el aspecto, con un fondo neutro y sombra (como el kiosk).
 * - **Embedded** (iframe del Studio): tamaño real, sin escala ni chrome; el host escala.
 *
 * Hydration safety (igual que `KioskCanvas`): SSR no conoce `window.parent`, así que
 * arrancamos en `embedded=false` (= SSR) y leemos el valor real tras mount.
 */
export function MobileCanvas({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    setEmbedded(detectEmbedded());
  }, []);

  useEffect(() => {
    if (embedded) return; // sin scaling interno cuando es preview

    const updateScale = () => {
      const availW = window.innerWidth - VIEWPORT_PADDING_X_PX * 2;
      const availH = window.innerHeight - VIEWPORT_PADDING_Y_PX * 2;
      setScale(Math.min(availW / PWA_WIDTH_PX, availH / PWA_HEIGHT_PX, 1));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [embedded]);

  // Modo embedded (iframe): canvas a 390×844 reales, ocupando el iframe.
  if (embedded) {
    return (
      <div
        data-pwa-canvas
        className="relative overflow-hidden bg-background text-foreground"
        style={{ width: `${PWA_WIDTH_PX}px`, height: `${PWA_HEIGHT_PX}px` }}
      >
        {children}
      </div>
    );
  }

  // Dev-view normal (fuera de iframe).
  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-900"
      style={{ padding: VIEWPORT_PADDING_Y_PX }}
    >
      <div style={{ width: PWA_WIDTH_PX * scale, height: PWA_HEIGHT_PX * scale }}>
        <div
          data-pwa-canvas
          className="relative overflow-hidden rounded-[44px] bg-background text-foreground shadow-2xl"
          style={{
            width: `${PWA_WIDTH_PX}px`,
            height: `${PWA_HEIGHT_PX}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
