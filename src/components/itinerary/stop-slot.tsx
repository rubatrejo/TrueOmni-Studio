'use client';

import Image from 'next/image';

import type { ItineraryCatalogItem } from '@/lib/itinerary-catalog';

export interface StopSlotProps {
  /** Index 1-based del slot. */
  index: number;
  item: ItineraryCatalogItem | null;
  onRemove?: () => void;
  /** Distance text opcional (ej. "7.5 mi away"). */
  distanceLabel?: string;
  /** Pointerdown sobre el body de un slot ocupado → inicia drag para reorder. */
  onDragHandle?: (ev: React.PointerEvent<HTMLDivElement>) => void;
  /** Aria-label del botón de eliminar (ej. "Remove stop 1"). */
  removeAriaLabel?: string;
}

/**
 * Card rectangular horizontal del rail inferior. Ratio ~1.29:1 (ancho > alto)
 * verbatim del SVG `Itinerary-Drop-Bottom-Section.svg` adaptado a landscape.
 * Empty state: card blanca con borde gris + círculo gris claro centrado con
 * heart outline. Filled: thumbnail cubriendo + gradient inferior + título +
 * distancia + botón heart rojo para remove en la esquina superior derecha.
 */
const CARD_W = 220;
const CARD_H = 150;

export function StopSlot({
  index,
  item,
  onRemove,
  distanceLabel,
  onDragHandle,
  removeAriaLabel,
}: StopSlotProps) {
  return (
    <div
      data-itinerary-slot={index - 1}
      onPointerDown={item && onDragHandle ? onDragHandle : undefined}
      className="relative overflow-hidden"
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: 14,
        backgroundColor: '#ffffff',
        border: '3px solid hsl(var(--itinerary-slot-border))',
      }}
    >
      {item ? (
        <>
          {item.image ? (
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="220px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-zinc-700" />
          )}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: 70,
              background:
                'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.78) 100%)',
            }}
          />
          <div className="absolute inset-x-3 bottom-2 text-white">
            <p className="line-clamp-1 text-[14px] font-semibold">{item.title}</p>
            {distanceLabel ? (
              <p className="text-[11px] opacity-90">{distanceLabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeAriaLabel}
            className="absolute right-2 top-2 z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                fill="hsl(var(--itinerary-heart))"
              />
            </svg>
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--itinerary-slot-empty-circle) / 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                fill="hsl(var(--itinerary-heart-empty))"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
