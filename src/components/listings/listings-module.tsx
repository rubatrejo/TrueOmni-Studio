'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { SearchOverlay } from '@/components/home/search-overlay';
import type { HomeListing, HomeModule, Listing } from '@/lib/config';
import { useFavorites } from '@/lib/favorites';
import type { FilterState } from '@/lib/listings-filter';
import { applyFilters, EMPTY_FILTER, isFilterEmpty } from '@/lib/listings-filter';
import type { SortOrder } from '@/lib/listings-sort';
import { haversineMi, SORT_OPTIONS, sortListings } from '@/lib/listings-sort';

import { FavoriteAddedToast } from './favorite-added-toast';
import { FilterOverlay } from './filter-overlay';
import { FloatingHomeButton } from './floating-home-button';
import { ListingsGrid } from './listings-grid';
import { ListingsToolbar } from './listings-toolbar';
import { SortOverlay } from './sort-overlay';

/**
 * Orquestrador del módulo de Listings (Restaurants / Things to Do / Stay).
 *
 * Layout:
 *   - `header` prop (HomeHeader server-component renderizado por la page):
 *     y=0..620 — logo + clock + weather + gradient azul, foto del módulo.
 *   - Toolbar y=620..738.
 *   - Grid y=738..1920 con scroll + gradient scroll-hint fijo en el bottom.
 */
export function ListingsModule({
  moduleKey,
  module: mod,
  clientCoords,
  header,
}: {
  moduleKey: string;
  module: HomeModule;
  /** Coords del cliente para el sort "distance" (haversine). */
  clientCoords?: { lat: number; lng: number };
  /** Hero + header server-rendered (pasado por la page). */
  header: ReactNode;
}) {
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [sort, setSort] = useState<SortOrder>('popularity');

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const { isFavorited, toggle: toggleFavorite } = useFavorites();

  const visible = useMemo(
    () => sortListings(applyFilters(mod.listings, filter), sort, clientCoords),
    [mod.listings, filter, sort, clientCoords],
  );

  const computeDistanceMi = useCallback(
    (listing: Listing) => (clientCoords ? haversineMi(clientCoords, listing.coords) : undefined),
    [clientCoords],
  );

  // Mapeo del shape Listing → HomeListing para el SearchOverlay existente.
  const searchListings: HomeListing[] = useMemo(
    () =>
      mod.listings.map((l) => ({
        slug: l.slug,
        title: l.title,
        category: moduleKey,
        image: l.image,
      })),
    [mod.listings, moduleKey],
  );

  const filterActive = !isFilterEmpty(filter);
  const sortActive = sort !== 'popularity';

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: '#f8f8f8' }}
    >
      {/* Hero + header universal */}
      {header}

      {/* Toolbar */}
      <ListingsToolbar
        label={mod.label}
        onSearch={() => setSearchOpen(true)}
        onSort={() => setSortOpen(true)}
        onFilter={() => setFilterOpen(true)}
        activeSort={sortActive || filterActive}
      />

      {/* Grid scrollable con scroll-hint fijo */}
      <main className="scrollbar-hide relative flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <ListingsGrid
          listings={visible}
          moduleKey={moduleKey}
          isFavorited={isFavorited}
          onToggleFavorite={toggleFavorite}
          computeDistanceMi={sort === 'distance' ? computeDistanceMi : undefined}
        />
      </main>

      {/* Gradient scroll-hint bottom (fixed dentro del frame del módulo) */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{
          height: '140px',
          background:
            'linear-gradient(180deg, rgba(248,248,248,0) 0%, rgba(248,248,248,0.95) 75%, rgba(248,248,248,1) 100%)',
        }}
      />

      {/* Floating home button */}
      <FloatingHomeButton />

      {/* Overlays dentro del canvas */}
      <FilterOverlay
        open={filterOpen}
        mod={mod}
        initial={filter}
        onCancel={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilter(next);
          setFilterOpen(false);
        }}
      />
      <SortOverlay
        open={sortOpen}
        current={sort}
        options={SORT_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label,
          disabled: o.value === 'distance' && !clientCoords,
        }))}
        onSelect={(next) => {
          setSort(next as SortOrder);
          setSortOpen(false);
        }}
        onCancel={() => setSortOpen(false)}
      />
      {searchOpen ? (
        <SearchOverlay listings={searchListings} onClose={() => setSearchOpen(false)} />
      ) : null}

      {/* Toast global: aparece al añadir favorito */}
      <FavoriteAddedToast />
    </div>
  );
}
