'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Listing, PwaMapCategory } from '@/lib/config';
import { applyFilters, EMPTY_FILTER, isFilterEmpty, type FilterState } from '@/lib/listings-filter';
import type { MapItem } from '@/lib/map-item';

import { PwaBottomNav } from './bottom-nav';
import { ListingRow, type ListingItem } from './listing-row';
import { ListingsMap } from './listings-map';
import { S } from './mobile-layer';
import { PwaFilterOverlay, type FilterTexts } from './pwa-filter-overlay';

const BRAND = 'hsl(var(--brand-primary))';
const OPEN_SANS = 'var(--font-open-sans)';
const HEADER_H = 150;

interface Props {
  title: string;
  tabs: { listings: string; map: string };
  resultsLabel: string;
  distanceSuffix: string;
  allLabel: string;
  categories: PwaMapCategory[];
  items: ListingItem[];
  mapItems: MapItem[];
  /** Listings crudos (slug = uid) para el overlay de filtros. */
  listings: Listing[];
  /** Pool de features agregado para el overlay. */
  features: string[];
  filterTexts: FilterTexts;
  origin?: { lat: number; lng: number };
  mapboxToken?: string;
}

/**
 * Módulo Maps (`/pwa/map`) — list+map agregado de varias categorías. Mismo patrón
 * que `ListingsListScreen` (header brand + segmented Listings/Map + cuerpo) pero:
 * abre en **Map**, agrega los listings de `pwa.map.categories` con pines de color
 * por categoría, y usa **chips de categoría** en vez del overlay de filtros. El tap
 * navega al detalle dentro del propio módulo (`/pwa/map/<module>/<slug>`).
 */
export function PwaMapScreen({
  title,
  tabs,
  resultsLabel,
  distanceSuffix,
  allLabel,
  categories,
  items,
  mapItems,
  listings,
  features,
  filterTexts,
  origin,
  mapboxToken,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'listings' | 'map'>('map');
  const [chip, setChip] = useState<string>('all');
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

  // Filtrado combinado: chip de categoría (por source) AND overlay (applyFilters).
  const chipSource = chip === 'all' ? null : categories.find((c) => c.key === chip)?.source;
  const allowedSlugs = new Set(applyFilters(listings, filter).map((l) => l.slug));
  const keep = (moduleSlug: string | undefined, slug: string) =>
    (!chipSource || moduleSlug === chipSource) && allowedSlugs.has(slug);
  const vItems = items.filter((i) => keep(i.moduleSlug, i.slug));
  const vMapItems = mapItems.filter((m) => keep(m.moduleSlug, m.slug));
  const filterActive = !isFilterEmpty(filter);

  const hrefForItem = (it: ListingItem) => `/pwa/map/${it.moduleSlug}/${it.detailSlug}`;

  const chips = [{ key: 'all', label: allLabel }, ...categories];

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header brand: back + título + segmented Listings/Map */}
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
            onClick={() => router.push('/pwa/dashboard')}
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

      {/* Barra de chips de categoría */}
      <div
        className="scrollbar-hide flex shrink-0 gap-2 overflow-x-auto border-b px-4 py-2.5"
        style={{ borderColor: 'hsl(var(--foreground) / 0.1)' }}
      >
        {chips.map((c) => {
          const isActive = chip === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setChip(c.key)}
              className="shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 font-semibold"
              style={{
                fontSize: 13,
                fontFamily: OPEN_SANS,
                backgroundColor: isActive ? BRAND : 'hsl(var(--brand-primary) / 0.1)',
                color: isActive ? '#fff' : BRAND,
              }}
            >
              {c.label}
            </button>
          );
        })}
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
              <ListingRow
                key={it.slug}
                item={it}
                href={hrefForItem(it)}
                fav={favs.has(it.slug)}
                onToggleFav={() => toggleFav(it.slug)}
                distanceSuffix={distanceSuffix}
              />
            ))}
          </ul>
        </div>
      ) : (
        <ListingsMap
          token={mapboxToken}
          center={origin ?? vItems[0]?.coords ?? { lat: 33.4484, lng: -112.074 }}
          items={vItems}
          mapItems={vMapItems}
          basePath="/pwa/map"
          hrefForItem={hrefForItem}
        />
      )}

      <PwaBottomNav active="map" />

      <PwaFilterOverlay
        open={filterOpen}
        features={features}
        subcategories={[]}
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
