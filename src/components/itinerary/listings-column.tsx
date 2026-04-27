'use client';

import type { ItineraryCatalogItem } from '@/lib/itinerary-catalog';

import { ItineraryListingCard } from './itinerary-listing-card';

export interface ListingsColumnProps {
  items: ItineraryCatalogItem[];
  isInRail: (slug: string, kind: ItineraryCatalogItem['kind']) => boolean;
  onToggle: (item: ItineraryCatalogItem) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Coords del cliente para calcular distancias. */
  clientCoords?: { lat: number; lng: number };
  emptyLabel: string;
  onCardDragStart?: (
    item: ItineraryCatalogItem,
    ev: React.PointerEvent<HTMLDivElement>,
  ) => void;
}

const COLUMN_LEFT = 30;
const COLUMN_TOP = 340;
const COLUMN_WIDTH = 400;
const COLUMN_BOTTOM_RESERVED = 380; // toolbar 70 + rail ~310 (con caption)

const haversineMi = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number => {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/**
 * Columna izquierda con cards scrollables. Cuando `collapsed=true` muestra un
 * pulpo flotante con la flecha derecha para expandir; el mapa ocupa el ancho
 * total mientras tanto.
 */
export function ListingsColumn(props: ListingsColumnProps) {
  const { items, isInRail, onToggle, collapsed, onToggleCollapsed, clientCoords, emptyLabel } =
    props;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label="Expand listings"
        className="absolute z-20 flex items-center justify-center rounded-r-full bg-primary text-white shadow-lg transition hover:opacity-90"
        style={{ left: 0, top: 660, width: 56, height: 88 }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="absolute z-20"
      style={{
        left: COLUMN_LEFT,
        top: COLUMN_TOP,
        width: COLUMN_WIDTH,
        bottom: COLUMN_BOTTOM_RESERVED,
      }}
    >
      <div
        className="flex h-full flex-col gap-3 overflow-y-auto pr-1"
        style={{ scrollbarWidth: 'thin' }}
      >
        {items.length === 0 ? (
          <div className="mt-8 text-center text-[15px] text-muted-foreground">{emptyLabel}</div>
        ) : (
          items.map((item) => (
            <ItineraryListingCard
              key={`${item.kind}:${item.slug}`}
              item={item}
              isInRail={isInRail(item.slug, item.kind)}
              onToggle={onToggle}
              distanceMi={clientCoords ? haversineMi(item.coords, clientCoords) : undefined}
              onDragStart={props.onCardDragStart}
            />
          ))
        )}
      </div>
      {/* Collapse handle (flecha izquierda) */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label="Collapse listings"
        className="absolute flex items-center justify-center rounded-l-full bg-primary text-white shadow-md transition hover:opacity-90"
        style={{ left: COLUMN_WIDTH + 4, top: 220, width: 36, height: 70 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
