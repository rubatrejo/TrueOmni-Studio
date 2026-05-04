'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Toast interactivo y llamativo que aparece al añadir un favorito.
 * Vive por encima de cualquier modal (z-index 70).
 *
 * Contenido:
 *   - Icono heart blanco sobre un circle olive destacado.
 *   - "Added!" + contador.
 *   - CTA pill blanco con texto azul "Itinerary →".
 *
 * Gradient olive→blue con sombra fuerte para sobresalir del fondo.
 * Dismiss automático en 4s o manual con la X.
 */
export function FavoriteAddedToast() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ slug: string; count: number }>).detail;
      setCount(detail.count);
      setOpen(true);
    };
    window.addEventListener('kiosk:favorite-added', handler);
    return () => window.removeEventListener('kiosk:favorite-added', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setOpen(false), 4000);
    return () => clearTimeout(timer);
  }, [open, count]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 flex justify-center"
      style={{ top: '44px', zIndex: 70 }}
    >
      <div
        className="pointer-events-auto relative flex items-center overflow-hidden"
        style={{
          padding: '14px 14px 14px 20px',
          borderRadius: '999px',
          background: 'linear-gradient(95deg, hsl(var(--brand-tertiary)) 0%, hsl(var(--brand-secondary)) 100%)',
          boxShadow: '0 22px 48px rgba(0,0,0,0.45), 0 0 0 3px rgba(255,255,255,0.25) inset',
          columnGap: '14px',
          animation: 'kiosk-fav-in 0.35s cubic-bezier(0.2,0.9,0.3,1.1)',
        }}
      >
        {/* Heart circle destacado */}
        <div
          className="flex items-center justify-center"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            flexShrink: 0,
            boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              fill="#e02020"
            />
          </svg>
        </div>

        {/* Mensaje compacto */}
        <div
          className="flex flex-col"
          style={{ rowGap: '2px', color: '#ffffff', whiteSpace: 'nowrap' }}
        >
          <span
            className="font-sans"
            style={{
              fontSize: '18px',
              lineHeight: '18px',
              fontWeight: 800,
              letterSpacing: '0.02em',
            }}
          >
            Added to Itinerary
          </span>
          <span
            className="font-sans"
            style={{
              fontSize: '13px',
              lineHeight: '16px',
              fontWeight: 600,
              opacity: 0.9,
            }}
          >
            {count === 1 ? '1 item saved' : `${count} items saved`}
          </span>
        </div>

        {/* CTA pill blanca */}
        <Link
          href="/home/itinerary-builder"
          className="flex items-center justify-center font-sans focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{
            padding: '12px 22px',
            borderRadius: '999px',
            backgroundColor: '#ffffff',
            color: 'hsl(var(--brand-primary))',
            fontSize: '15px',
            lineHeight: '15px',
            fontWeight: 800,
            letterSpacing: '0.02em',
            columnGap: '8px',
            whiteSpace: 'nowrap',
            boxShadow: '0 6px 14px rgba(0,0,0,0.2)',
          }}
        >
          View
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M5 12h14M13 5l7 7-7 7"
              fill="none"
              stroke="hsl(var(--brand-primary))"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        {/* Close small */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar aviso"
          className="flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            flexShrink: 0,
            backgroundColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M6 6l12 12M18 6l-12 12"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <style jsx>{`
        @keyframes kiosk-fav-in {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
