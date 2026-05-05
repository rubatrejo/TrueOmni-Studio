'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

const KIOSK_WIDTH_PX = 1080;
const KIOSK_HEIGHT_PX = 1920;
const PWA_WIDTH_PX = 390;
const PWA_HEIGHT_PX = 844;

/** Lee `?viewport=mobile-pwa` del URL (client-side). Usado para que el
 *  preview del Studio pueda forzar dims mobile sin un canvas alternativo. */
function detectPwaViewport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('viewport') === 'mobile-pwa';
  } catch {
    return false;
  }
}

/** Padding horizontal alrededor del canvas (dev-view). */
const VIEWPORT_PADDING_X_PX = 80;
/** Padding arriba del canvas (dev-view). */
const VIEWPORT_PADDING_TOP_PX = 64;
/** Espacio reservado debajo del canvas para el dev-nav (fuera del frame). */
const BOTTOM_NAV_SPACE_PX = 180;

/**
 * Canvas fijo 1080×1920 (retrato) escalado para caber en el viewport
 * del navegador sin scroll, preservando el aspecto 9:16.
 *
 * Si la página se carga dentro de un iframe (modo "preview" desde el
 * Studio), el canvas se renderiza a tamaño real (sin escala interna,
 * sin padding, sin chrome) para que el host externo controle la escala.
 * Esto evita la doble escala (canvas + iframe) que mete márgenes grises.
 */
/** Detección eager (lazy init) — sin SSR. */
function detectEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.parent !== window;
  } catch {
    return true; // cross-origin → asumimos embedded
  }
}

export function KioskCanvas({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  // Lazy init: en cliente la primera evaluación ya sabe si está en iframe.
  const [embedded] = useState(detectEmbedded);
  const [isPwa] = useState(detectPwaViewport);
  const W = isPwa ? PWA_WIDTH_PX : KIOSK_WIDTH_PX;
  const H = isPwa ? PWA_HEIGHT_PX : KIOSK_HEIGHT_PX;

  useEffect(() => {
    if (embedded) return; // sin scaling interno cuando es preview

    const updateScale = () => {
      const availW = window.innerWidth - VIEWPORT_PADDING_X_PX * 2;
      const availH = window.innerHeight - VIEWPORT_PADDING_TOP_PX - BOTTOM_NAV_SPACE_PX;
      setScale(Math.min(availW / W, availH / H));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [embedded]);

  // Modo embedded (iframe): canvas a 1080×1920 reales, ocupando 100% del
  // viewport del iframe. Sin padding, sin bg gris, sin shadow.
  if (embedded) {
    return (
      <div
        data-kiosk-canvas
        className="relative overflow-hidden bg-background text-foreground"
        style={{
          width: `${W}px`,
          height: `${H}px`,
        }}
      >
        {children}
      </div>
    );
  }

  // Dev-view normal (fuera de iframe).
  return (
    <div
      className="fixed inset-0 flex justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-900"
      style={{
        paddingTop: VIEWPORT_PADDING_TOP_PX,
        paddingBottom: BOTTOM_NAV_SPACE_PX,
      }}
    >
      <div
        style={{
          width: W * scale,
          height: H * scale,
        }}
      >
        <div
          data-kiosk-canvas
          className="relative overflow-hidden bg-background text-foreground shadow-2xl"
          style={{
            width: `${KIOSK_WIDTH_PX}px`,
            height: `${KIOSK_HEIGHT_PX}px`,
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
