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
  /** Plantilla del label "Stop {n}" tokenizado. */
  stopLabelTemplate: string;
  /** Pointerdown sobre el body de un slot ocupado → inicia drag para reorder. */
  onDragHandle?: (ev: React.PointerEvent<HTMLDivElement>) => void;
}

/**
 * Slot individual del rail inferior. Si tiene `item`, muestra thumbnail +
 * label "Stop N" + distance + heart. Si está vacío, muestra placeholder con
 * un heart outline gris.
 */
export function StopSlot({
  index,
  item,
  onRemove,
  distanceLabel,
  stopLabelTemplate,
  onDragHandle,
}: StopSlotProps) {
  const stopLabel = stopLabelTemplate.replace('{n}', String(index));
  return (
    <div
      data-itinerary-slot={index - 1}
      onPointerDown={item && onDragHandle ? onDragHandle : undefined}
      className="relative flex-shrink-0 overflow-hidden rounded-md bg-zinc-100"
      style={{ width: 200, height: 220 }}
    >
      {/* Header con número del stop */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center px-3 py-2 text-[12px] font-semibold text-foreground">
        <span className="mr-1 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-[10px] text-white">
          {index}
        </span>
        {stopLabel}
      </div>

      {/* Body */}
      {item ? (
        <>
          <div className="absolute inset-0 top-7">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="200px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-zinc-700" />
            )}
            {/* gradient bottom para legibilidad del texto */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{
                height: 70,
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.78) 100%)',
              }}
            />
            <div className="absolute inset-x-2 bottom-2 text-white">
              <p className="line-clamp-1 text-[14px] font-semibold">{item.title}</p>
              {distanceLabel ? (
                <p className="text-[11px] opacity-90">{distanceLabel}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove stop ${index}`}
            className="absolute right-1 top-7 z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/90"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                fill="hsl(var(--itinerary-heart))"
              />
            </svg>
          </button>
        </>
      ) : (
        <div className="absolute inset-0 top-7 flex items-center justify-center bg-white">
          <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              fill="none"
              stroke="hsl(var(--itinerary-heart-empty))"
              strokeWidth="1.6"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
