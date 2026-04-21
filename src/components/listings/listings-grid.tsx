'use client';

import { useEffect, useRef, useState } from 'react';

import type { Listing } from '@/lib/config';

import { ListingCard } from './listing-card';

/**
 * Grid verbatim SVG Food & Drink: 3 columnas (x=50, 393.5, 737), gap vertical
 * 50px entre filas. Card 293×268.63.
 *
 * Infinite scroll: arranca mostrando 12 cards, carga de a 12 más cuando un
 * sentinel al final entra al viewport.
 */

const BATCH = 12;

export function ListingsGrid({
  listings,
  moduleKey,
  isFavorited,
  onToggleFavorite,
  computeDistanceMi,
}: {
  listings: readonly Listing[];
  moduleKey: string;
  isFavorited?: (slug: string) => boolean;
  onToggleFavorite?: (slug: string) => void;
  computeDistanceMi?: (listing: Listing) => number | undefined;
}) {
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + BATCH, listings.length));
        }
      },
      { root: null, rootMargin: '300px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [listings.length]);

  // Reset count al cambiar listings (por filtros/sort)
  useEffect(() => {
    setVisibleCount(BATCH);
  }, [listings]);

  const visible = listings.slice(0, visibleCount);

  return (
    <div className="relative" style={{ width: '1080px' }}>
      <div
        className="grid"
        style={{
          gridTemplateColumns: '293px 293px 293px',
          columnGap: '50.5px',
          rowGap: '50px',
          paddingLeft: '50px',
          paddingRight: '50px',
          paddingTop: '50px',
          paddingBottom: '50px',
        }}
      >
        {visible.map((listing) => (
          <ListingCard
            key={listing.slug}
            listing={listing}
            moduleKey={moduleKey}
            isFavorited={isFavorited?.(listing.slug) ?? false}
            onToggleFavorite={onToggleFavorite}
            distanceMi={computeDistanceMi?.(listing)}
          />
        ))}
      </div>
      {/* Sentinel para infinite scroll */}
      {visibleCount < listings.length ? (
        <div ref={sentinelRef} style={{ height: '1px' }} aria-hidden />
      ) : null}
    </div>
  );
}
