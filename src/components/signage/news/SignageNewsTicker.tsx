'use client';

import { useEffect, useState } from 'react';

import type { SignageNewsItem } from '@/lib/signage/schema';

/**
 * `<SignageNewsTicker>` — slideshow rotativo de news items con animación
 * cinematográfica.
 *
 * Cada item entra deslizando desde la derecha (translateX 100%→0 + fade),
 * permanece visible en pausa, y sale deslizando hacia la izquierda
 * (translateX 0→-100% + fade) antes de cambiar al siguiente. La categoría
 * (item.title — ej: "BREAKING NEWS") va en un badge naranja con halo pulsante
 * para captar atención periférica. El body se renderea en gran tamaño bold
 * para legibilidad desde lejos. Progress dots verticales en el borde derecho
 * indican posición en la rotación.
 *
 * Cero handlers touch/click — view-only puro.
 */
export interface SignageNewsTickerProps {
  items: SignageNewsItem[];
  intervalSec: number;
}

export function SignageNewsTicker({ items, intervalSec }: SignageNewsTickerProps) {
  const [index, setIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
      setAnimKey((k) => k + 1);
    }, intervalSec * 1000);
    return () => window.clearInterval(id);
  }, [items.length, intervalSec]);

  const item = items[index];
  if (!item) return null;

  const date = item.publishedAt
    ? formatNewsDate(item.publishedAt)
    : null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Keyframes globales (idempotentes — repetir el bloque no cambia DOM). */}
      <style>{NEWS_KEYFRAMES}</style>

      {/* Card animado — re-keyed en cada item para reiniciar la animación. */}
      <div
        key={animKey}
        className="absolute inset-0 flex flex-col justify-center gap-2 pr-14"
        style={{
          animation: `signageNewsCycle ${intervalSec}s ease-in-out forwards`,
          willChange: 'transform, opacity',
        }}
      >
        <div className="flex items-center gap-4">
          <span
            className="inline-flex items-center rounded-full bg-signage-news-accent px-4 py-[6px] text-[15px] font-bold uppercase tracking-[0.18em] text-signage-text"
            style={{ animation: 'signageNewsBadgePulse 2.4s ease-in-out infinite' }}
          >
            {item.title}
          </span>
          {date ? (
            <span className="text-[18px] font-medium uppercase tracking-[0.14em] text-signage-text-on-brand">
              {date}
            </span>
          ) : null}
        </div>
        <p
          className="text-[26px] font-semibold leading-[1.25] text-signage-text-on-brand"
          style={{
            fontFamily: 'OpenSans-Semibold, "Open Sans", sans-serif',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.body}
        </p>
      </div>

      {/* Progress dots verticales — borde derecho. El activo es más alto + opaco. */}
      {items.length > 1 ? (
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-2">
          {items.map((_, i) => (
            <span
              key={i}
              className={`block w-[6px] rounded-full transition-all duration-500 ${
                i === index
                  ? 'h-6 bg-signage-text-on-brand'
                  : 'h-[6px] bg-signage-text-on-brand opacity-40'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatNewsDate(iso: string): string | null {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.valueOf())) return null;
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
      .format(d)
      .toUpperCase();
  } catch {
    return null;
  }
}

/**
 * Keyframes:
 *  - signageNewsCycle: slide-in-from-right + visible + slide-out-to-left.
 *  - signageNewsBadgePulse: halo de luz que se expande desde el badge para
 *    dar sensación de "live" / atención periférica.
 *
 * Distribución del tiempo (0%..100% del cycle):
 *   0%-7%   slide-in (entra desde +100% translateX, llega a 0)
 *   7%-93%  visible (estable)
 *   93%-100% slide-out (sale a -100% translateX)
 */
const NEWS_KEYFRAMES = `
@keyframes signageNewsCycle {
  0%   { transform: translateX(100%); opacity: 0; }
  7%   { transform: translateX(0);    opacity: 1; }
  93%  { transform: translateX(0);    opacity: 1; }
  100% { transform: translateX(-100%); opacity: 0; }
}
@keyframes signageNewsBadgePulse {
  0%   { box-shadow: 0 0 0 0   hsl(var(--signage-news-accent) / 0.55); }
  70%  { box-shadow: 0 0 0 14px hsl(var(--signage-news-accent) / 0);    }
  100% { box-shadow: 0 0 0 0   hsl(var(--signage-news-accent) / 0);    }
}
`;
