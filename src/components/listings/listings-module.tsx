'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { SearchOverlay } from '@/components/home/search-overlay';
import { useModuleLabel } from '@/components/i18n-provider';
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
  initialSubcategory,
}: {
  moduleKey: string;
  module: HomeModule;
  /** Coords del cliente para el sort "distance" (haversine). */
  clientCoords?: { lat: number; lng: number };
  /** Hero + header server-rendered (pasado por la page). */
  header: ReactNode;
  /**
   * Sub-categoría con la que arranca pre-filtrada la lista (cuando se entra
   * desde la pantalla de sub-categorías del kiosk). Vacío = lista completa.
   */
  initialSubcategory?: string;
}) {
  // Live preview override del Studio (S3.7 dynamic). El Studio dispatcha
  // kiosk:listings-override con un array de entries (cada entry = un listing
  // module dinámico). Buscamos por `key === moduleKey`.
  const [override, setOverride] = useState<HomeModule | null>(null);
  const effective: HomeModule = override ?? mod;

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<unknown>).detail;
      if (!Array.isArray(detail)) return;
      const entry = detail.find(
        (en): en is ListingsEntryPatch =>
          !!en && typeof en === 'object' && (en as ListingsEntryPatch).key === moduleKey,
      );
      if (!entry) return;
      const sub = entry.catalog;
      if (!sub) return;
      setOverride({
        kind: 'listings',
        label: entry.label ?? mod.label,
        heroImage: sub.heroImage ?? mod.heroImage,
        subcategories: sub.subcategories ?? mod.subcategories,
        features: sub.features ?? mod.features,
        listings: (sub.listings ?? mod.listings) as Listing[],
      });
    };
    window.addEventListener('kiosk:listings-override', handler);
    return () => window.removeEventListener('kiosk:listings-override', handler);
  }, [moduleKey, mod.label, mod.heroImage, mod.subcategories, mod.features, mod.listings]);

  const moduleLabel = useModuleLabel(moduleKey, effective.label);

  const [filter, setFilter] = useState<FilterState>(() =>
    initialSubcategory ? { ...EMPTY_FILTER, subcategories: [initialSubcategory] } : EMPTY_FILTER,
  );
  const [sort, setSort] = useState<SortOrder>('popularity');

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const { isFavorited, toggle: toggleFavorite } = useFavorites();

  const visible = useMemo(
    () => sortListings(applyFilters(effective.listings, filter), sort, clientCoords),
    [effective.listings, filter, sort, clientCoords],
  );

  const computeDistanceMi = useCallback(
    (listing: Listing) => (clientCoords ? haversineMi(clientCoords, listing.coords) : undefined),
    [clientCoords],
  );

  // Mapeo del shape Listing → HomeListing para el SearchOverlay existente.
  const searchListings: HomeListing[] = useMemo(
    () =>
      effective.listings.map((l) => ({
        slug: l.slug,
        title: l.title,
        category: moduleKey,
        image: l.image,
      })),
    [effective.listings, moduleKey],
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
        label={moduleLabel}
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
        mod={effective}
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

/** Shape de cada entry recibida en `kiosk:listings-override` (array). */
type ListingsEntryPatch = {
  key: string;
  label?: string;
  iconKey?: string;
  enabled?: boolean;
  catalog?: {
    heroImage?: string;
    subcategories?: string[];
    features?: string[];
    listings?: Listing[];
  };
};
