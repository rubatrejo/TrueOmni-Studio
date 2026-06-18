'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { SearchOverlay } from '@/components/home/search-overlay';
import { useModuleHeroBridge } from '@/components/home/use-module-hero-bridge';
import { useModuleLabel, useTextosMap } from '@/components/i18n-provider';
import { FavoriteAddedToast } from '@/components/listings/favorite-added-toast';
import { FloatingHomeButton } from '@/components/listings/floating-home-button';
import { ListingsGrid } from '@/components/listings/listings-grid';
import { ListingsToolbar } from '@/components/listings/listings-toolbar';
import { SortOverlay } from '@/components/listings/sort-overlay';
import { getCachedTrails } from '@/components/studio-bridge';
import type { HomeListing, HomeTrailsModule, Listing, Trail } from '@/lib/config';
import { useTrailFavorites } from '@/lib/favorites';
import type { SortOrder } from '@/lib/listings-sort';
import { haversineMi, SORT_OPTIONS, sortListings } from '@/lib/listings-sort';
import {
  applyTrailsFilter,
  EMPTY_TRAILS_FILTER,
  searchTrails,
  trailToListing,
  type TrailFilterState,
} from '@/lib/trails';

import { TrailsFilterOverlay } from './trails-filter-overlay';

/**
 * Orquestrador del módulo Trails. Pipeline:
 *   applyTrailsFilter (features AND + difficulty OR + trailType OR) →
 *   searchTrails (si hay query) → sortListings (reusa SORT_OPTIONS).
 *
 * Reusa `ListingsGrid` via `trailToListing` adapter. Bucket de favoritos
 * propio `kiosk_trail_favorites` para que el Trip Builder futuro
 * pueda leerlo sin mezclarse con listings/events.
 */
export function TrailsModule({
  moduleKey,
  module: mod,
  clientCoords,
  header,
}: {
  moduleKey: string;
  module: HomeTrailsModule;
  clientCoords?: { lat: number; lng: number };
  header: ReactNode;
}) {
  const textos = useTextosMap();

  // Live preview override del Studio (S3.7).
  const [override, setOverride] = useState<HomeTrailsModule | null>(null);
  const effective: HomeTrailsModule = override ?? mod;
  useEffect(() => {
    const apply = (detail: unknown) => {
      const d = detail as
        | {
            label?: string;
            heroImage?: string;
            subcategories?: string[];
            features?: string[];
            difficulties?: HomeTrailsModule['difficulties'];
            trailTypes?: HomeTrailsModule['trailTypes'];
            trails?: Trail[];
          }
        | undefined;
      if (!d || !Array.isArray(d.trails)) return;
      setOverride({
        kind: 'trails',
        label: d.label ?? mod.label,
        heroImage: d.heroImage ?? mod.heroImage,
        subcategories: d.subcategories ?? mod.subcategories,
        features: d.features ?? mod.features,
        difficulties: d.difficulties ?? mod.difficulties,
        trailTypes: d.trailTypes ?? mod.trailTypes,
        trails: d.trails,
      });
    };
    // Hidrata desde el cache del bridge (edita→navega). No-op en runtime real.
    apply(getCachedTrails());
    const handler = (e: Event) => apply((e as CustomEvent<unknown>).detail);
    window.addEventListener('kiosk:trails-override', handler);
    return () => window.removeEventListener('kiosk:trails-override', handler);
  }, [mod.label, mod.heroImage, mod.subcategories, mod.features, mod.difficulties, mod.trailTypes]);

  // Empuja el hero efectivo al HomeHeader (preview live del Studio).
  useModuleHeroBridge(effective.heroImage);

  const moduleLabel = useModuleLabel(moduleKey, effective.label);
  const [filter, setFilter] = useState<TrailFilterState>(EMPTY_TRAILS_FILTER);
  const [sort, setSort] = useState<SortOrder>('popularity');
  const [query, setQuery] = useState('');

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const { isFavorited, toggle: toggleFavorite } = useTrailFavorites();

  // Pipeline: filter → search → to-listing → sort.
  const visibleListings = useMemo<Listing[]>(() => {
    const filtered = applyTrailsFilter(effective.trails, filter);
    const searched = searchTrails(filtered, query);
    const asListings = searched.map(trailToListing);
    return sortListings(asListings, sort, clientCoords);
  }, [effective.trails, filter, query, sort, clientCoords]);

  const computeDistanceMi = useCallback(
    (listing: Listing) => (clientCoords ? haversineMi(clientCoords, listing.coords) : undefined),
    [clientCoords],
  );

  const searchItems: HomeListing[] = useMemo(
    () =>
      effective.trails.map((t) => ({
        slug: t.slug,
        title: t.title,
        category: moduleKey,
        image: t.image,
      })),
    [effective.trails, moduleKey],
  );

  const filterActive =
    filter.features.length > 0 || filter.difficulties.length > 0 || filter.trailTypes.length > 0;
  const sortActive = sort !== 'popularity';
  void setQuery;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: '#f8f8f8' }}
    >
      {header}

      <ListingsToolbar
        label={moduleLabel}
        onSearch={() => setSearchOpen(true)}
        onSort={() => setSortOpen(true)}
        onFilter={() => setFilterOpen(true)}
        activeSort={sortActive || filterActive}
      />

      <main className="scrollbar-hide relative flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <ListingsGrid
          listings={visibleListings}
          moduleKey={moduleKey}
          isFavorited={isFavorited}
          onToggleFavorite={toggleFavorite}
          computeDistanceMi={sort === 'distance' ? computeDistanceMi : undefined}
        />
      </main>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{
          height: '140px',
          background:
            'linear-gradient(180deg, rgba(248,248,248,0) 0%, rgba(248,248,248,0.95) 75%, rgba(248,248,248,1) 100%)',
        }}
      />

      <FloatingHomeButton />

      <TrailsFilterOverlay
        open={filterOpen}
        featureCatalog={effective.features}
        difficulties={effective.difficulties}
        trailTypes={effective.trailTypes}
        initial={filter}
        title={textos.trails_filters_title ?? 'FILTERS'}
        featuresLabel={textos.trails_filter_features ?? 'Features'}
        difficultyLabel={textos.trails_filter_difficulty ?? 'Difficulty'}
        typeLabel={textos.trails_filter_type ?? 'Trail Type'}
        clearAllLabel={textos.trails_clear_all ?? 'CLEAR ALL'}
        applyLabel={textos.trails_apply ?? 'APPLY'}
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
        <SearchOverlay listings={searchItems} onClose={() => setSearchOpen(false)} />
      ) : null}

      <FavoriteAddedToast />
    </div>
  );
}
