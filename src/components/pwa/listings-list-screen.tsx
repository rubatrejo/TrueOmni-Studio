'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Listing } from '@/lib/config';
import { useFavorites } from '@/lib/favorites';
import { applyFilters, EMPTY_FILTER, isFilterEmpty, type FilterState } from '@/lib/listings-filter';
import type { MapItem } from '@/lib/map-item';

import { PwaBottomNav, type PwaNavKey } from './bottom-nav';
import { ListingRow, type ListingItem } from './listing-row';
import { ListingsMap } from './listings-map';
import { S } from './mobile-layer';
import { PwaFilterOverlay, type FilterTexts } from './pwa-filter-overlay';
import { PwaSubHeader } from './pwa-sub-header';

const BRAND = 'hsl(var(--brand-primary))';
const OPEN_SANS = 'var(--font-open-sans)';
const HEADER_H = 150;

export type { ListingItem };

interface Props {
  title: string;
  tabs: { listings: string; map: string };
  resultsLabel: string;
  /** Texto cuando los filtros no dejan resultados (white-label). */
  emptyLabel?: string;
  distanceSuffix: string;
  items: ListingItem[];
  mapItems: MapItem[];
  /** Listings crudos del kiosk para el filtrado (`applyFilters`). */
  listings: Listing[];
  /** Pools del filtro. */
  features: string[];
  subcategories: string[];
  /** Pool de dificultades (solo Trails; default vacío → sección oculta). */
  difficulties?: string[];
  /** Pool de tipos de trail (solo Trails; default vacío → sección oculta). */
  trailTypes?: string[];
  filterTexts: FilterTexts;
  origin?: { lat: number; lng: number };
  mapboxToken?: string;
  /** Ruta base del módulo, ej. "/pwa/restaurants" o "/pwa/stay". */
  basePath: string;
  /** Celda del bottom nav a resaltar (opcional). */
  navActive?: PwaNavKey;
  /** Pestaña inicial (default "listings"). */
  initialTab?: 'listings' | 'map';
  /**
   * Sub-categoría (`listing.subcategory`) con la que arranca pre-filtrada la
   * lista (cuando se entra tocando una tile del grid con `subcategory` bound).
   * Vacío = lista completa (retrocompat).
   */
  initialSubcategory?: string;
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
  emptyLabel,
  distanceSuffix,
  items,
  mapItems,
  listings,
  features,
  subcategories,
  difficulties = [],
  trailTypes = [],
  filterTexts,
  origin,
  mapboxToken,
  basePath,
  navActive,
  initialTab = 'listings',
  initialSubcategory,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'listings' | 'map'>(initialTab);
  // Favoritos persistentes (sessionStorage, compartido con kiosk + Trip Planner) — C3.
  const { isFavorited, toggle: toggleFav } = useFavorites();
  const [filter, setFilter] = useState<FilterState>(() =>
    initialSubcategory ? { ...EMPTY_FILTER, subcategories: [initialSubcategory] } : EMPTY_FILTER,
  );
  const [filterOpen, setFilterOpen] = useState(false);

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
          <PwaSubHeader title={title} onBack={() => router.push(basePath)} />
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
          {vItems.length > 0 ? (
            <ul className="mt-2 pb-6">
              {vItems.map((it) => (
                <ListingRow
                  key={it.slug}
                  item={it}
                  href={`${basePath}/${it.slug}`}
                  fav={isFavorited(it.slug)}
                  onToggleFav={() => toggleFav(it.slug)}
                  distanceSuffix={distanceSuffix}
                />
              ))}
            </ul>
          ) : (
            <div
              className="flex flex-col items-center px-10 pt-20 text-center text-foreground/45"
              style={{ fontFamily: OPEN_SANS }}
            >
              <svg width={40} height={40} viewBox="0 0 512 512" fill="currentColor" aria-hidden>
                <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
              </svg>
              <p className="mt-4 text-[15px]">{emptyLabel ?? 'No results match your filters.'}</p>
            </div>
          )}
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
        difficulties={difficulties}
        trailTypes={trailTypes}
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
