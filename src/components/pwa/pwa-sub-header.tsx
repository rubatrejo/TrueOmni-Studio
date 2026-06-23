'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { TABLET_STATUS_INSET, useDevice } from './device-context';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const BRAND = 'hsl(var(--brand-primary))';

/**
 * Header de sub-página de la PWA (brand bar 375×88 + back + título centrado +
 * slot derecho). Se coloca dentro del layer 375-space de cada pantalla.
 *
 * - Back = SOLO el chevron (sin la palabra "Back"), por consistencia con el
 *   resto del kiosk/PWA. No añadir un label de texto al botón de back.
 * - `right` es un slot opcional (ej. gear de Edit Profile, link "Edit Profile").
 * - Back robusto: `router.back()` con fallback a `backHref` (o `/pwa/dashboard`).
 * - `onBack` opcional: si se pasa, el botón lo invoca en vez de la lógica de router
 *   (para pantallas con navegación propia: trip-planner, create-account, etc.).
 *   Default = comportamiento actual, sin cambios para los consumidores existentes.
 *
 * **Tablet:** el header se renderiza vía PORTAL al canvas (`[data-pwa-canvas]`)
 * como barra full-width a tamaño dashboard (64px), ESCAPANDO de la caja 375-space
 * escalada de cada pantalla. Así el chrome es consistente en todas las pantallas
 * sin tocarlas una por una. El phone queda IDÉNTICO (markup absolute en 375-space).
 */
export function PwaSubHeader({
  title,
  right,
  backHref = '/pwa/dashboard',
  onBack,
}: {
  title?: string;
  right?: ReactNode;
  backHref?: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const { isTablet } = useDevice();
  const [canvas, setCanvas] = useState<HTMLElement | null>(null);

  // En tablet montamos el header en el canvas (fuera del layer escalado).
  useEffect(() => {
    if (isTablet) setCanvas(document.querySelector<HTMLElement>('[data-pwa-canvas]'));
  }, [isTablet]);

  const handleBack =
    onBack ??
    (() => {
      if (typeof window !== 'undefined' && window.history.length > 1) router.back();
      else router.push(backHref);
    });

  // ---- Tablet: barra full-width vía portal al canvas (tamaño dashboard) ----
  if (isTablet) {
    if (!canvas) return null;
    return createPortal(
      <div
        className="absolute left-0 z-30 flex w-full items-center px-8"
        style={{ top: TABLET_STATUS_INSET, height: 64, backgroundColor: BRAND }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={handleBack}
          className="flex items-center text-white"
        >
          <svg width={14} height={24} viewBox="0 0 11.87 20.36" fill="#fff" aria-hidden>
            <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
          </svg>
        </button>
        {title ? (
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center font-bold text-white"
            style={{ fontSize: 22, letterSpacing: '-0.024em', ...OPEN_SANS }}
          >
            {title}
          </div>
        ) : null}
        {right ? <div className="ml-auto text-white">{right}</div> : null}
      </div>,
      canvas,
    );
  }

  // ---- Phone: markup absolute en 375-space (IDÉNTICO al original) ----
  return (
    <>
      <div
        className="absolute left-0 top-0 bg-[hsl(var(--brand-primary))]"
        style={{ width: 375, height: 90 }}
      />
      {/* Back (chevron + label opcional) */}
      <button
        type="button"
        aria-label="Back"
        onClick={handleBack}
        className="absolute flex items-center text-white"
        style={{ left: 18, top: 50, height: 28, ...OPEN_SANS }}
      >
        <svg width={11.87} height={20.36} viewBox="0 0 11.87 20.36" fill="#fff" aria-hidden>
          <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
        </svg>
      </button>

      {/* Título centrado */}
      {title ? (
        <div
          className="pointer-events-none absolute text-center font-bold text-white"
          style={{
            left: 60,
            top: 53,
            width: 255,
            fontSize: 17,
            letterSpacing: '-0.024em',
            ...OPEN_SANS,
          }}
        >
          {title}
        </div>
      ) : null}

      {/* Slot derecho */}
      {right ? (
        <div className="absolute text-white" style={{ right: 18, top: 50, height: 28 }}>
          {right}
        </div>
      ) : null}
    </>
  );
}
