'use client';

import type { ReactNode } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';

import { PwaHeart } from '../pwa-heart';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const OLIVE = 'hsl(var(--brand-tertiary))';
const FOOTER = 'hsl(var(--pwa-card-footer))'; // gris neutro del footer (≈ #555), consistente con el módulo Map

/** Ancho default de la card (estilo módulo Map). */
export const TP_STOP_CARD_W = 150;
export const TP_STOP_CARD_GAP = 10;

/**
 * Card de parada estilo módulo Map (imagen 16:9 + footer gris): fuente única
 * usada por el Map view, el AI Itinerary Result y Top Suggestions para que las
 * cards se vean consistentes en todo el Trip Planner.
 */
export function TpStopCard({
  image,
  eyebrow,
  title,
  meta,
  openUntil,
  width = TP_STOP_CARD_W,
  badge,
  fav,
  onToggleFav,
  onSelect,
  dimmed = false,
}: {
  image: string;
  eyebrow: string;
  title: string;
  meta: string;
  openUntil?: string;
  width?: number;
  /** Badge opcional sobre la imagen (p. ej. el número de parada del Map). */
  badge?: ReactNode;
  fav?: boolean;
  onToggleFav?: () => void;
  /** Si se pasa, imagen + footer son un botón (selección de la parada en el mapa). */
  onSelect?: () => void;
  /** Atenúa la card cuando hay otra seleccionada. */
  dimmed?: boolean;
}) {
  const imgH = Math.round((width * 9) / 16);
  const inner = (
    <>
      <div
        className="relative bg-cover bg-center"
        style={{ height: imgH, backgroundImage: `url("${resolveAssetUrl(image)}")` }}
      >
        {badge}
      </div>
      <div className="px-2.5 py-1.5" style={{ backgroundColor: FOOTER }}>
        <p className="truncate uppercase text-white" style={{ fontSize: 10, letterSpacing: 0.4 }}>
          {eyebrow}
        </p>
        <p className="truncate font-semibold text-white" style={{ fontSize: 13, lineHeight: 1.1 }}>
          {title}
        </p>
        <p className="truncate text-white" style={{ fontSize: 10, fontWeight: 300, marginTop: 2 }}>
          {meta}
        </p>
        {openUntil ? (
          <p
            className="truncate font-semibold"
            style={{ fontSize: 10, color: OLIVE, marginTop: 1 }}
          >
            {openUntil}
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <div
      className="relative shrink-0 snap-center overflow-hidden rounded-[6px] shadow-md transition-opacity"
      style={{ width, opacity: dimmed ? 0.55 : 1, ...OPEN_SANS }}
    >
      {onSelect ? (
        <button type="button" onClick={onSelect} className="block w-full text-left">
          {inner}
        </button>
      ) : (
        inner
      )}
      {onToggleFav ? (
        <button
          type="button"
          aria-label="Toggle"
          onClick={onToggleFav}
          className="absolute flex items-center justify-center rounded-full"
          style={{
            right: 6,
            top: 6,
            width: 28,
            height: 28,
            backgroundColor: 'hsl(0 0% 100% / 0.7)',
          }}
        >
          <PwaHeart filled={Boolean(fav)} size={16} />
        </button>
      ) : null}
    </div>
  );
}
