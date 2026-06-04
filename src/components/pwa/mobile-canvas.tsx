'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { PwaAdsSlot } from './ads/pwa-ads-slot';
import { PwaKeyboardProvider } from './pwa-keyboard-provider';

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

/** PWA instalada (añadida a inicio): el SO la lanza full-screen sin chrome del navegador. */
function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS Safari expone `navigator.standalone`; el resto, el media query estándar.
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches;
}

/** Color del header/bottom-nav: rellena el notch y el home-indicator de forma continua. */
const BRAND = 'hsl(var(--brand-primary))';

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
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setEmbedded(detectEmbedded());
    setStandalone(detectStandalone());
  }, []);

  useEffect(() => {
    if (embedded || standalone) return; // sin scaling interno en preview ni standalone

    const updateScale = () => {
      const availW = window.innerWidth - VIEWPORT_PADDING_X_PX * 2;
      const availH = window.innerHeight - VIEWPORT_PADDING_Y_PX * 2;
      setScale(Math.min(availW / PWA_WIDTH_PX, availH / PWA_HEIGHT_PX, 1));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [embedded, standalone]);

  // Modo standalone (PWA instalada en el SO): llena el viewport real y respeta las
  // safe-areas de iOS (notch / Dynamic Island arriba, home indicator abajo). El padding
  // navy continúa el color del header y del bottom nav. Ancho tope 390 (centrado) para
  // no deformar el layout 375-space en pantallas anchas (E1).
  if (standalone) {
    return (
      <div
        className="flex justify-center overflow-hidden"
        style={{
          width: '100%',
          height: '100dvh',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          backgroundColor: BRAND,
        }}
      >
        <div
          data-pwa-canvas
          className="relative h-full w-full overflow-hidden bg-background text-foreground"
          style={{ maxWidth: `${PWA_WIDTH_PX}px` }}
        >
          <PwaKeyboardProvider>{children}</PwaKeyboardProvider>
          <PwaAdsSlot />
        </div>
      </div>
    );
  }

  // Modo embedded (iframe): canvas a 390×844 reales, ocupando el iframe.
  if (embedded) {
    return (
      <div
        data-pwa-canvas
        className="relative overflow-hidden bg-background text-foreground"
        style={{ width: `${PWA_WIDTH_PX}px`, height: `${PWA_HEIGHT_PX}px` }}
      >
        <PwaKeyboardProvider>{children}</PwaKeyboardProvider>
        <PwaAdsSlot />
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
          <PwaKeyboardProvider>{children}</PwaKeyboardProvider>
          <PwaAdsSlot />
        </div>
      </div>
    </div>
  );
}
