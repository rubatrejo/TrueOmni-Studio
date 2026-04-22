'use client';

import { forwardRef, useEffect, useRef } from 'react';

import type { MapItem } from '@/lib/map-item';

import { MapTopCard } from './map-top-card';

interface MapTopCarouselProps {
  items: readonly MapItem[];
  selectedSlug: string | null;
  clientCoords?: { lat: number; lng: number };
  onSelect: (slug: string) => void;
}

/**
 * Carrusel horizontal de `MapTopCard`. Refleja el pool filtrado de items.
 * Al cambiar `selectedSlug` desplaza al card correspondiente (smooth).
 */
export const MapTopCarousel = forwardRef<HTMLDivElement, MapTopCarouselProps>(
  function MapTopCarousel({ items, selectedSlug, clientCoords, onSelect }, _ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!selectedSlug || !containerRef.current) return;
      const el = containerRef.current.querySelector<HTMLElement>(
        `[data-map-slug="${CSS.escape(selectedSlug)}"]`,
      );
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      }
    }, [selectedSlug]);

    if (items.length === 0) {
      return (
        <div
          style={{ height: '200px' }}
          className="flex items-center justify-center bg-white/80 text-sm text-gray-500"
        >
          No places match your filters.
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="scrollbar-hide flex flex-shrink-0 overflow-x-auto overscroll-contain py-3"
        style={{
          scrollSnapType: 'x mandatory',
          scrollPaddingLeft: '65px',
          paddingLeft: '65px', // alineado con el logo TrueOmni del header
          paddingRight: '32px',
          gap: '20px',
        }}
        aria-label="Places carousel"
      >
        {items.map((it) => (
          <div
            key={`${it.moduleSlug}-${it.slug}`}
            data-map-slug={it.slug}
            style={{ scrollSnapAlign: 'start' }}
          >
            <MapTopCard
              item={it}
              active={it.slug === selectedSlug}
              distanceMi={distanceBy(it.slug, items, clientCoords)}
              onClick={() => onSelect(it.slug)}
            />
          </div>
        ))}
      </div>
    );
  },
);

function distanceBy(
  slug: string,
  items: readonly MapItem[],
  clientCoords?: { lat: number; lng: number },
): number | undefined {
  if (!clientCoords) return undefined;
  const it = items.find((i) => i.slug === slug);
  if (!it) return undefined;
  // Usamos Haversine aquí mismo para evitar un import del módulo de listings
  // (queremos que distanceMi sea consistente con `formatMiAway` del bubble).
  const R_MI = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(it.coords.lat - clientCoords.lat);
  const dLng = toRad(it.coords.lng - clientCoords.lng);
  const lat1 = toRad(clientCoords.lat);
  const lat2 = toRad(it.coords.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}
