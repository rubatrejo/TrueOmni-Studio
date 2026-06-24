'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { PwaAdsSlot } from './ads/pwa-ads-slot';
import { deviceDims, TABLET_STATUS_INSET, useDevice } from './device-context';
import { PwaKeyboardProvider } from './pwa-keyboard-provider';
import { isStandalone } from './runtime-detect';

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
export function MobileCanvas({
  children,
  immersive = false,
}: {
  children: ReactNode;
  /**
   * Pantalla **inmersiva** (fondo fullscreen, sin header navy): login, welcome,
   * create account, forgot password… En tablet NO reservamos la franja del status
   * bar ni pintamos la barra navy superior, para que el fondo llegue al borde.
   */
  immersive?: boolean;
}) {
  const { device, orientation } = useDevice();
  // Dimensiones del canvas según el form factor (phone 390×844 intacto; tablet
  // = dims iPad por orientación). Las pantallas con layout de tablet reflowean
  // dentro de este canvas; las que aún no, caen al layout phone.
  const { w: canvasW, h: canvasH } = deviceDims(device, orientation);
  const isTablet = device === 'tablet';
  const [scale, setScale] = useState(1);
  const [embedded, setEmbedded] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setEmbedded(detectEmbedded());
    setStandalone(isStandalone());
  }, []);

  useEffect(() => {
    if (embedded || standalone) return; // sin scaling interno en preview ni standalone

    const updateScale = () => {
      const availW = window.innerWidth - VIEWPORT_PADDING_X_PX * 2;
      const availH = window.innerHeight - VIEWPORT_PADDING_Y_PX * 2;
      setScale(Math.min(availW / canvasW, availH / canvasH, 1));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [embedded, standalone, canvasW, canvasH]);

  // En tablet reservamos una franja navy arriba (status bar del SO: hora + batería/
  // wifi). El contenido de TODAS las pantallas baja por el `paddingTop` del canvas,
  // así el header navy de cada una continúa el color de la franja. Phone = 0.
  const tabletInset = isTablet && !immersive ? TABLET_STATUS_INSET : 0;
  const body = (
    <>
      {isTablet && !immersive ? (
        // La franja SOLAPA ~12px el header (navy sobre navy) para tapar el seam
        // sub-pixel (línea blanca) entre el área de padding y el header en flujo.
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-40"
          style={{ height: tabletInset + 12, backgroundColor: BRAND }}
        />
      ) : null}
      <PwaKeyboardProvider>{children}</PwaKeyboardProvider>
      <PwaAdsSlot />
    </>
  );

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
          style={{ maxWidth: `${canvasW}px`, boxSizing: 'border-box', paddingTop: tabletInset }}
        >
          {body}
        </div>
      </div>
    );
  }

  // Modo embedded (iframe): canvas a tamaño real del device, ocupando el iframe.
  if (embedded) {
    return (
      <div
        data-pwa-canvas
        className="relative overflow-hidden bg-background text-foreground"
        style={{
          width: `${canvasW}px`,
          height: `${canvasH}px`,
          boxSizing: 'border-box',
          paddingTop: tabletInset,
        }}
      >
        {body}
      </div>
    );
  }

  // Dev-view normal (fuera de iframe).
  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-900"
      style={{ padding: VIEWPORT_PADDING_Y_PX }}
    >
      <div style={{ width: canvasW * scale, height: canvasH * scale }}>
        <div
          data-pwa-canvas
          className={`relative overflow-hidden bg-background text-foreground shadow-2xl ${
            isTablet ? 'rounded-[28px]' : 'rounded-[44px]'
          }`}
          style={{
            width: `${canvasW}px`,
            height: `${canvasH}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            boxSizing: 'border-box',
            paddingTop: tabletInset,
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}
