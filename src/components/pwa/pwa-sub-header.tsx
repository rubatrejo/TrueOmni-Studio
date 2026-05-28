'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/**
 * Header de sub-página de la PWA (brand bar 375×88 + back + título centrado +
 * slot derecho). Se coloca dentro del layer 375-space de cada pantalla.
 *
 * - `backLabel` muestra "Back" junto al chevron (pantallas Settings/Delete).
 * - `right` es un slot opcional (ej. gear de Edit Profile, link "Edit Profile").
 * - Back robusto: `router.back()` con fallback a `backHref` (o `/pwa/dashboard`).
 */
export function PwaSubHeader({
  title,
  backLabel,
  right,
  backHref = '/pwa/dashboard',
}: {
  title?: string;
  backLabel?: string;
  right?: ReactNode;
  backHref?: string;
}) {
  const router = useRouter();
  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(backHref);
  };

  return (
    <>
      <div
        className="absolute left-0 top-0 bg-[hsl(var(--brand-primary))]"
        style={{ width: 375, height: 88 }}
      />
      {/* Back (chevron + label opcional) */}
      <button
        type="button"
        aria-label="Back"
        onClick={onBack}
        className="absolute flex items-center gap-2 text-white"
        style={{ left: 18, top: 50, height: 28, ...OPEN_SANS }}
      >
        <svg width={11.87} height={20.36} viewBox="0 0 11.87 20.36" fill="#fff" aria-hidden>
          <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
        </svg>
        {backLabel ? <span style={{ fontSize: 16 }}>{backLabel}</span> : null}
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
