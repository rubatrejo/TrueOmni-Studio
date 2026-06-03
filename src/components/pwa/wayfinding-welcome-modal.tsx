'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pwa-wayfinding-welcomed';
const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface WayfindingWelcomeModalProps {
  title: string;
  description: string;
  tagline: string;
  button: string;
}

/**
 * Modal de bienvenida al Wayfinding. Verbatim del XD:
 * - Fondo: overlay semi-transparente sobre la zona de contenido
 * - Título grande en blanco sobre gradiente oscuro (zona del floor plan)
 * - Card blanca con descripción + tagline + botón cobre
 * Se muestra solo la primera vez (localStorage).
 */
export function WayfindingWelcomeModal({
  title,
  description,
  tagline,
  button,
}: WayfindingWelcomeModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setShow(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={OPEN_SANS}>
      {/* Zona superior transparente — deja ver el sub-header + floor plan */}
      <div className="h-[170px] shrink-0" />

      {/* Título sobre fondo gradiente oscuro semi-transparente */}
      <div
        className="flex items-center justify-center px-8 py-5"
        style={{
          background:
            'linear-gradient(to bottom, hsl(var(--brand-primary) / 0.85), hsl(var(--brand-primary) / 0.92))',
        }}
      >
        <h2 className="text-center text-[22px] font-bold leading-tight text-white">{title}</h2>
      </div>

      {/* Card blanca con descripción + botón */}
      <div className="flex flex-1 flex-col items-center bg-white/95 px-8 pt-6">
        <p className="mb-3 text-center text-[13px] leading-relaxed text-gray-600">{description}</p>
        <p className="mb-5 text-center text-[13px] italic text-gray-500">{tagline}</p>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full px-12 py-[10px] text-[14px] font-bold text-white"
          style={{ backgroundColor: 'hsl(var(--brand-accent, 25 60% 55%))' }}
        >
          {button}
        </button>
      </div>

      {/* Zona inferior — deja entrever las cards detrás */}
      <div className="h-[100px] shrink-0 bg-black/30" />
    </div>
  );
}
