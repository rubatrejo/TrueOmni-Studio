'use client';

import Image from 'next/image';

import type { ItineraryCatalogItem } from '@/lib/itinerary-catalog';

export interface ItineraryListingCardProps {
  item: ItineraryCatalogItem;
  isInRail: boolean;
  onToggle: (item: ItineraryCatalogItem) => void;
  /** Distancia en millas desde el cliente. */
  distanceMi?: number;
  /** Plantilla del label de distancia, ej. "{n} mi away". */
  distanceTemplate?: string;
  /** Si está dentro del drag&drop, callback invocado al pointerdown. */
  onDragStart?: (item: ItineraryCatalogItem, ev: React.PointerEvent<HTMLDivElement>) => void;
}

/**
 * Card horizontal del catálogo del Itinerary Builder.
 * Layout:
 *   - Wrapper 360×170 oscuro (#1f2227) con esquinas levemente redondeadas.
 *   - Imagen full bleed con gradient bottom para legibilidad.
 *   - Título + distance overlay sobre el gradient en la parte inferior.
 *   - Heart toggle 50×50 top-right con backdrop blanco/0.7.
 *
 * Coords aproximadas del SVG; pulido pixel-perfect en 3.17-13.
 */
export function ItineraryListingCard(props: ItineraryListingCardProps) {
  const { item, isInRail, onToggle, distanceMi, distanceTemplate, onDragStart } = props;
  const distanceLabel =
    distanceMi != null && distanceTemplate
      ? distanceTemplate.replace('{n}', distanceMi.toFixed(1))
      : null;

  return (
    <div
      data-itinerary-card={item.slug}
      onPointerDown={(ev) => onDragStart?.(item, ev)}
      className="relative flex-shrink-0 overflow-hidden rounded-[10px] bg-zinc-900 shadow-md"
      style={{ width: 360, height: 170 }}
    >
      {item.image ? (
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="360px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-700" />
      )}
      {/* gradient bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: 90,
          background:
            'linear-gradient(180deg, hsl(var(--itinerary-card-shadow) / 0) 0%, hsl(var(--itinerary-card-shadow) / 0.8) 100%)',
        }}
      />
      {/* title + distance */}
      <div className="absolute inset-x-4 bottom-3 text-white">
        <p className="text-[20px] font-semibold leading-tight drop-shadow">{item.title}</p>
        {distanceLabel ? <p className="mt-1 text-[14px] opacity-90">{distanceLabel}</p> : null}
      </div>
      {/* heart toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle(item);
        }}
        aria-label={isInRail ? 'Remove from itinerary' : 'Add to itinerary'}
        aria-pressed={isInRail}
        className="absolute right-2 top-2 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill={isInRail ? 'hsl(var(--itinerary-heart))' : 'none'}
          stroke="hsl(var(--itinerary-heart))"
          strokeWidth={isInRail ? 0 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>
  );
}
