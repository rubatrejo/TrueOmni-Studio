'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { Listing } from '@/lib/config';
import { applyFilters, EMPTY_FILTER, isFilterEmpty, type FilterState } from '@/lib/listings-filter';
import type { MapItem } from '@/lib/map-item';

import { PwaBottomNav, type PwaNavKey } from './bottom-nav';
import { ListingsMap } from './listings-map';
import { S } from './mobile-layer';
import { PwaFilterOverlay, type FilterTexts } from './pwa-filter-overlay';
import { PwaHeart } from './pwa-heart';

const BRAND = 'hsl(var(--brand-primary))';
const OPEN_SANS = 'var(--font-open-sans)';
const HEADER_H = 150;

export interface ListingItem {
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
  items: ListingItem[];
  mapItems: MapItem[];
  /** Listings crudos del kiosk para el filtrado (`applyFilters`). */
  listings: Listing[];
  /** Pools del filtro. */
  features: string[];
  subcategories: string[];
  filterTexts: FilterTexts;
  origin?: { lat: number; lng: number };
  mapboxToken?: string;
  /** Ruta base del módulo, ej. "/pwa/restaurants" o "/pwa/stay". */
  basePath: string;
  /** Celda del bottom nav a resaltar (opcional). */
  navActive?: PwaNavKey;
}

/**
 * Módulo de listings #2/#3 — Listings (lista) + Map (tab). Header brand fijo
 * (back + título + filtro + tabs), cuerpo scrolleable con filas (thumb + nombre +
 * distancia + favorito). La data es la del kiosk (`home.modules.<key>.listings`).
 * Reutilizado por Restaurants, Places to Stay y futuros módulos vía `basePath`.
 */
export function ListingsListScreen({
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
  basePath,
  navActive,
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
            onClick={() => router.push(basePath)}
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
            <svg width={24} height={20.6} viewBox="0 0 28 24" fill="currentColor" aria-hidden>
              <g transform="translate(-2 -4)">
                <path d="M2,7A1,1,0,0,1,3,6H20.184a2.982,2.982,0,0,1,5.632,0H29a1,1,0,0,1,0,2H25.816a2.982,2.982,0,0,1-5.632,0H3A1,1,0,0,1,2,7Zm27,8H14.816a2.982,2.982,0,0,0-5.632,0H3a1,1,0,0,0,0,2H9.184a2.982,2.982,0,0,0,5.632,0H29a1,1,0,0,0,0-2Zm0,9H25.816a2.982,2.982,0,0,0-5.632,0H3a1,1,0,0,0,0,2H20.184a2.982,2.982,0,0,0,5.632,0H29a1,1,0,0,0,0-2Z" />
              </g>
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
                  onClick={() => router.push(`${basePath}/${it.slug}`)}
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
        <ListingsMap
          token={mapboxToken}
          center={origin ?? vItems[0]?.coords ?? { lat: 33.4484, lng: -112.074 }}
          items={vItems}
          mapItems={vMapItems}
          basePath={basePath}
        />
      )}

      <PwaBottomNav active={navActive} />

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
