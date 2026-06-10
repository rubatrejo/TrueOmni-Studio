'use client';

import { useRef } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';

import { PwaNumberField } from './pwa-ui';

interface Point {
  x: number;
  y: number;
}

/**
 * Picker de un punto sobre la imagen del floor plan del Wayfinding. Las coords
 * son porcentajes 0–100 (NO lat/lng → no usa Mapbox). Click sobre la imagen
 * coloca el punto; sin imagen cae a inputs numéricos.
 */
export function FloorPointField({
  label,
  point,
  imageUrl,
  accent = '#0ea5e9',
  onChange,
}: {
  label: string;
  point: Point;
  imageUrl: string;
  accent?: string;
  onChange: (next: Point) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  if (!imageUrl) {
    return (
      <div className="space-y-1.5 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <span className="block text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </span>
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Set the floor plan image to place points visually.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <PwaNumberField
            label="X (%)"
            value={point.x}
            min={0}
            step={1}
            onChange={(x) => onChange({ ...point, x })}
          />
          <PwaNumberField
            label="Y (%)"
            value={point.y}
            min={0}
            step={1}
            onChange={(y) => onChange({ ...point, y })}
          />
        </div>
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    onChange({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  /** Soporte teclado: flechas desplazan el punto en pasos de 1 % */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 5 : 1;
    if (e.key === 'ArrowLeft') onChange({ ...point, x: Math.max(0, point.x - step) });
    else if (e.key === 'ArrowRight') onChange({ ...point, x: Math.min(100, point.x + step) });
    else if (e.key === 'ArrowUp') onChange({ ...point, y: Math.max(0, point.y - step) });
    else if (e.key === 'ArrowDown') onChange({ ...point, y: Math.min(100, point.y + step) });
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="relative w-full cursor-crosshair overflow-hidden rounded-md ring-1 ring-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:ring-zinc-800"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          loading="lazy"
          src={resolveAssetUrl(imageUrl)}
          alt=""
          className="block w-full select-none"
          draggable={false}
        />
        <span
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${point.x}%`, top: `${point.y}%`, backgroundColor: accent }}
        />
      </div>
      <p className="text-[11px] text-zinc-500">
        Click to place. Position: {point.x.toFixed(1)}%, {point.y.toFixed(1)}%.
      </p>
    </div>
  );
}
