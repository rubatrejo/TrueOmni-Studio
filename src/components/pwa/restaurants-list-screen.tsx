'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { Listing } from '@/lib/config';
import { applyFilters, EMPTY_FILTER, isFilterEmpty, type FilterState } from '@/lib/listings-filter';
import type { MapItem } from '@/lib/map-item';

import { PwaBottomNav } from './bottom-nav';
import { S } from './mobile-layer';
import { PwaFilterOverlay, type FilterTexts } from './pwa-filter-overlay';
import { PwaHeart } from './pwa-heart';
import { RestaurantsMap } from './restaurants-map';

const BRAND = 'hsl(var(--brand-primary))';
const OPEN_SANS = 'var(--font-open-sans)';
const HEADER_H = 150;

export interface RestaurantListItem {
  slug: string;
  title: string;
  subcategory: string;
  image: string;
  coords: { lat: number; lng: number };
  distanceMi: number;
  /** "City, ST" derivado de la dirección (para la card del mapa, estilo kiosk). */
  cityState: string;
  /** "Open until 11 pm" (prefijo de config + cierre de hoy). */
  openUntil: string;
}

interface Props {
  title: string;
  tabs: { listings: string; map: string };
  resultsLabel: string;
  distanceSuffix: string;
  items: RestaurantListItem[];
  mapItems: MapItem[];
  /** Listings crudos del kiosk para el filtrado (`applyFilters`). */
  listings: Listing[];
  /** Pools del filtro. */
  features: string[];
  subcategories: string[];
  filterTexts: FilterTexts;
  origin?: { lat: number; lng: number };
  mapboxToken?: string;
}

/**
 * Restaurants #2/#3 — Listings (lista) + Map (tab). Header brand fijo (back + título +
 * filtro + tabs), cuerpo scrolleable con filas (thumb + nombre + distancia + favorito).
 * La data es la del kiosk (`home.modules.restaurants.listings`).
 */
export function RestaurantsListScreen({
  title,
  tabs,
  resultsLabel,
  distanceSuffix,
  items,
  mapItems,
  listings,
  features,
  subcategories,
  filterTexts,
  origin,
  mapboxToken,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'listings' | 'map'>('listings');
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);

  const toggleFav = (slug: string) =>
    setFavs((s) => {
      const next = new Set(s);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  // Filtro (reusa applyFilters del kiosk sobre los listings crudos).
  const visibleSlugs = new Set(applyFilters(listings, filter).map((l) => l.slug));
  const vItems = items.filter((i) => visibleSlugs.has(i.slug));
  const vMapItems = mapItems.filter((m) => visibleSlugs.has(m.slug));
  const filterActive = !isFilterEmpty(filter);

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header fijo (brand): back + título + filtro + tabs Listings/Map */}
      <div
        className="relative z-10 shrink-0"
        style={{ height: HEADER_H * S, backgroundColor: BRAND }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: 375,
            height: HEADER_H,
            transform: `scale(${S})`,
            transformOrigin: 'top left',
          }}
        >
          <button
            type="button"
            aria-label="Back"
            onClick={() => router.push('/pwa/restaurants')}
            className="absolute"
            style={{ left: 12, top: 44, width: 40, height: 40 }}
          >
            <svg
              className="mx-auto"
              width={11.87}
              height={20.36}
              viewBox="0 0 11.87 20.36"
              fill="#fff"
              aria-hidden
            >
              <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
            </svg>
          </button>
          <div
            className="pointer-events-none absolute text-center font-bold text-white"
            style={{ left: 0, top: 50, width: 375, fontSize: 17, fontFamily: OPEN_SANS }}
          >
            {title}
          </div>
          <button
            type="button"
            aria-label="Filter"
            onClick={() => setFilterOpen(true)}
            className="absolute text-white"
            style={{ left: 333, top: 48, width: 28, height: 28 }}
          >
            {filterActive && (
              <span
                className="absolute rounded-full"
                style={{
                  right: -2,
                  top: -2,
                  width: 9,
                  height: 9,
                  backgroundColor: 'hsl(var(--pwa-favorite))',
                }}
              />
            )}
            <svg width={24} height={22} viewBox="0 0 512 512" fill="currentColor" aria-hidden>
              <path d="M0 416c0 17.7 14.3 32 32 32l54.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 448c17.7 0 32-14.3 32-32s-14.3-32-32-32l-246.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 384c-17.7 0-32 14.3-32 32zm128 0a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM320 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm32-80c-32.8 0-61 19.7-73.3 48L32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l246.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48l54.7 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-54.7 0c-12.3-28.3-40.5-48-73.3-48zM192 96a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm-73.3 0L32 96C14.3 96 0 110.3 0 128s14.3 32 32 32l86.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 160c17.7 0 32-14.3 32-32s-14.3-32-32-32L265.3 96C253 67.7 224.8 48 192 48s-61 19.7-73.3 48z" />
            </svg>
          </button>
          {/* Segmented control */}
          <div
            className="absolute flex overflow-hidden rounded-[6px]"
            style={{
              left: 16,
              top: 100,
              width: 343,
              height: 38,
              border: '1px solid hsl(0 0% 100% / 0.5)',
            }}
          >
            {(['listings', 'map'] as const).map((t) => {
              const isActive = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="flex flex-1 items-center justify-center font-semibold"
                  style={{
                    fontSize: 15,
                    fontFamily: OPEN_SANS,
                    backgroundColor: isActive ? '#fff' : 'transparent',
                    color: isActive ? BRAND : '#fff',
                  }}
                >
                  {t === 'listings' ? tabs.listings : tabs.map}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cuerpo */}
      {tab === 'listings' ? (
        <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
          <div
            className="px-[18px] pt-4 font-semibold uppercase text-foreground/45"
            style={{ fontSize: 12, letterSpacing: 0.6, fontFamily: OPEN_SANS }}
          >
            {resultsLabel.replace('{count}', String(vItems.length))}
          </div>
          <ul className="mt-2">
            {vItems.map((it) => (
              <li
                key={it.slug}
                className="flex items-center gap-3 border-b px-[18px] py-3"
                style={{ borderColor: 'hsl(var(--foreground) / 0.1)' }}
              >
                <button
                  type="button"
                  onClick={() => router.push(`/pwa/restaurants/${it.slug}`)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className="shrink-0 rounded-[6px] bg-cover bg-center"
                    style={{
                      width: 84,
                      height: 64,
                      backgroundImage: `url("${resolveAssetUrl(it.image)}")`,
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate font-bold text-foreground"
                      style={{ fontSize: 17, fontFamily: OPEN_SANS }}
                    >
                      {it.title}
                    </span>
                    <span
                      className="block text-foreground/50"
                      style={{ fontSize: 13, fontFamily: OPEN_SANS }}
                    >
                      {it.distanceMi.toFixed(1)} {distanceSuffix}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Favorite"
                  onClick={() => toggleFav(it.slug)}
                  className="shrink-0"
                >
                  <PwaHeart filled={favs.has(it.slug)} size={27} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <RestaurantsMap
          token={mapboxToken}
          center={origin ?? vItems[0]?.coords ?? { lat: 33.4484, lng: -112.074 }}
          items={vItems}
          mapItems={vMapItems}
        />
      )}

      <PwaBottomNav active="dining" />

      <PwaFilterOverlay
        open={filterOpen}
        features={features}
        subcategories={subcategories}
        initial={filter}
        texts={filterTexts}
        onCancel={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilter(next);
          setFilterOpen(false);
        }}
      />
    </div>
  );
}
