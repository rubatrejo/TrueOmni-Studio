'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { SearchOverlay } from '@/components/home/search-overlay';
import { useModuleLabel, useTextosMap } from '@/components/i18n-provider';
import { FloatingHomeButton } from '@/components/listings/floating-home-button';
import { ListingsToolbar } from '@/components/listings/listings-toolbar';
import { SortOverlay } from '@/components/listings/sort-overlay';
import type { Deal, HomeDealsModule, HomeListing } from '@/lib/config';
import {
  applyDealsFilter,
  DEAL_SORT_OPTIONS,
  EMPTY_DEALS_FILTER,
  type DealsFilterState,
  type DealSortOrder,
  deriveDealFeatures,
  filterActiveDeals,
  searchDeals,
  sortDeals,
} from '@/lib/deals';

import { DealRedeemHost } from './deal-redeem-host';
import { DealsFilterOverlay } from './deals-filter-overlay';
import { DealsGrid } from './deals-grid';

/**
 * Orquestador del módulo Deals. Pipeline:
 *   filterActiveDeals (expiración) → applyDealsFilter (features AND) →
 *   searchDeals (si hay query) → sortDeals (order activo).
 *
 * Reusa SearchOverlay del Home, SortOverlay y ListingsToolbar de Listings,
 * FloatingHomeButton y el chrome clásico del kiosk. El CTA de la card emite
 * un CustomEvent que escucha `DealRedeemHost` renderizado aquí mismo.
 */
export function DealsModule({
  moduleKey,
  module: mod,
  header,
}: {
  moduleKey: string;
  module: HomeDealsModule;
  header: ReactNode;
}) {
  const textos = useTextosMap();
  const moduleLabel = useModuleLabel(moduleKey, mod.label);
  const [filter, setFilter] = useState<DealsFilterState>(EMPTY_DEALS_FILTER);
  const [sort, setSort] = useState<DealSortOrder>('expiring-soon');
  const [query, setQuery] = useState<string>('');

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Override del Studio (live preview): reemplaza `mod` cuando llega un payload
  // por postMessage. En runtime normal queda en null y se usa `mod` directo.
  const [override, setOverride] = useState<HomeDealsModule | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          label?: string;
          heroImage?: string;
          featureCatalog?: string[];
          deals?: Deal[];
          qrLogo?: string;
        }>
      ).detail;
      if (!detail || !Array.isArray(detail.deals)) return;
      setOverride({
        kind: 'deals',
        label: detail.label ?? mod.label,
        heroImage: detail.heroImage ?? mod.heroImage,
        featureCatalog: detail.featureCatalog ?? mod.featureCatalog,
        deals: detail.deals,
        qrLogo: detail.qrLogo,
      });
    };
    window.addEventListener('kiosk:deals-override', handler);
    return () => window.removeEventListener('kiosk:deals-override', handler);
  }, [mod.label, mod.heroImage, mod.featureCatalog]);

  const effective = override ?? mod;
  const activeDeals = useMemo(() => filterActiveDeals(effective.deals), [effective.deals]);

  const featureCatalog = useMemo(
    () =>
      effective.featureCatalog.length > 0
        ? effective.featureCatalog
        : deriveDealFeatures(activeDeals),
    [effective.featureCatalog, activeDeals],
  );

  const visibleDeals = useMemo<Deal[]>(() => {
    const filtered = applyDealsFilter(activeDeals, filter);
    const searched = searchDeals(filtered, query);
    return sortDeals(searched, sort);
  }, [activeDeals, filter, sort, query]);

  const searchItems = useMemo<HomeListing[]>(
    () =>
      activeDeals.map((d) => ({
        slug: d.slug,
        title: d.title,
        category: moduleKey,
        image: d.cover,
      })),
    [activeDeals, moduleKey],
  );

  const sortOptions = useMemo(
    () =>
      DEAL_SORT_OPTIONS.map((o) => ({
        value: o.value,
        label:
          o.value === 'expiring-soon'
            ? (textos.deals_sort_expiring ?? o.label)
            : o.value === 'recent'
              ? (textos.deals_sort_recent ?? o.label)
              : o.value === 'a-z'
                ? (textos.deals_sort_az ?? o.label)
                : (textos.deals_sort_best ?? o.label),
      })),
    [textos],
  );

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
        activeSort={sort !== 'expiring-soon' || filter.features.length > 0 || query.length > 0}
      />

      <main className="scrollbar-hide relative flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <DealsGrid
          deals={visibleDeals}
          emptyLabel={textos.deals_empty ?? 'No deals available right now.'}
          expiresPrefix={textos.deals_expires_prefix ?? 'EXPIRES'}
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

      <DealsFilterOverlay
        open={filterOpen}
        featureCatalog={featureCatalog}
        initial={filter}
        title={textos.deals_filters_title ?? 'FILTERS'}
        featuresLabel={textos.deals_filter_features ?? 'Features'}
        clearAllLabel={textos.deals_clear_all ?? 'CLEAR ALL'}
        applyLabel={textos.deals_apply ?? 'APPLY'}
        onCancel={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilter(next);
          setFilterOpen(false);
        }}
      />
      <SortOverlay
        open={sortOpen}
        current={sort}
        options={sortOptions}
        onSelect={(next) => {
          setSort(next as DealSortOrder);
          setSortOpen(false);
        }}
        onCancel={() => setSortOpen(false)}
      />
      {searchOpen ? (
        <DealsSearchAdapter
          items={searchItems}
          deals={activeDeals}
          moduleKey={moduleKey}
          onClose={() => setSearchOpen(false)}
          onPickDeal={(slug) => {
            setQuery('');
            setSearchOpen(false);
            window.dispatchEvent(
              new CustomEvent('kiosk:deal-redeem-open', { detail: { dealSlug: slug } }),
            );
          }}
        />
      ) : null}

      <DealRedeemHost deals={activeDeals} qrLogo={effective.qrLogo} />
    </div>
  );
}

/**
 * Adapta `SearchOverlay` (que lleva a `/home/{category}/{slug}`) para Deals
 * donde el slug NO tiene detail fullscreen — en su lugar disparamos el
 * CustomEvent del redeem modal. Para lograrlo interceptamos el onClick via
 * `onPickDeal` antes de que el Link del SearchOverlay navegue.
 */
function DealsSearchAdapter({
  items,
  deals,
  moduleKey,
  onClose,
  onPickDeal,
}: {
  items: readonly HomeListing[];
  deals: readonly Deal[];
  moduleKey: string;
  onClose: () => void;
  onPickDeal: (slug: string) => void;
}) {
  // Mapeo ligero: cuando el usuario hace click en un resultado, el Link nativo
  // del SearchOverlay navega a /home/{moduleKey}/{slug} — que no existe para
  // deals (el [slug]/page.tsx hace notFound). Para una UX correcta,
  // interceptamos el click a nivel document en capture phase.
  void deals;
  void moduleKey;
  const handleClickCapture = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href^="/home/"]') as HTMLAnchorElement | null;
    if (!link) return;
    const href = link.getAttribute('href') ?? '';
    const slug = href.split('/').pop() ?? '';
    if (!slug) return;
    e.preventDefault();
    e.stopPropagation();
    onPickDeal(slug);
  };
  return (
    <div onClickCapture={handleClickCapture}>
      <SearchOverlay listings={items} onClose={onClose} />
    </div>
  );
}
