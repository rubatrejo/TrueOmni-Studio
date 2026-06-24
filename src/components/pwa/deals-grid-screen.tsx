'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { Deal, PwaDealsModuleConfig } from '@/lib/config';
import {
  applyDealsFilter,
  type DealSortOrder,
  filterActiveDeals,
  searchDeals,
  sortDeals,
} from '@/lib/deals';
import { EMPTY_FILTER, type FilterState } from '@/lib/listings-filter';

import { PwaBottomNav } from './bottom-nav';
import { SearchIcon } from './dashboard-icons';
import { DealCardPwa } from './deal-card-pwa';
import { DealRedeemPopup } from './deal-redeem-popup';
import { useDevice } from './device-context';
import { S } from './mobile-layer';
import { PwaFilterOverlay, type FilterTexts } from './pwa-filter-overlay';
import { PwaListTabletHeader } from './pwa-list-tablet-header';
import { PwaSortOverlay, type SortOption } from './pwa-sort-overlay';
import { PwaSubHeader } from './pwa-sub-header';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const BRAND = 'hsl(var(--brand-primary))';

const HEADER_H = 90;

/**
 * Módulo Deals #1 — grid de cupones (`/pwa/deals`). Réplica mobile del módulo
 * Deals del kiosk: header brand (back + título + Sort/Filter), barra de búsqueda
 * persistente debajo del header (filtra en vivo), grid de 2 columnas de
 * `DealCardPwa` y bottom nav. Tap en una card abre el `DealRedeemPopup`. El
 * pipeline reutiliza los helpers del kiosk (`filterActiveDeals` →
 * `applyDealsFilter` → `searchDeals` → `sortDeals`).
 *
 * White-label: textos desde `config.features.pwa.deals`; los cupones se reutilizan
 * de `home.modules.deals`; colores por tokens (`--pwa-primary`, `--pwa-deals-expiry`).
 */
export function DealsGridScreen({
  texts,
  deals,
  featureCatalog,
}: {
  texts: PwaDealsModuleConfig;
  deals: Deal[];
  featureCatalog: string[];
}) {
  const router = useRouter();
  const { isTablet, isLandscape } = useDevice();
  const [query, setQuery] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<DealSortOrder>('expiring-soon');
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [redeemDeal, setRedeemDeal] = useState<Deal | null>(null);

  // Pipeline (idéntico al del kiosk).
  const active = filterActiveDeals(deals);
  const filtered = applyDealsFilter(active, { features: [...filter.features] });
  const searched = searchDeals(filtered, query);
  const visible = sortDeals(searched, sortOrder);

  const filterActive = filter.features.length > 0;

  const sortOptions: SortOption<DealSortOrder>[] = [
    { value: 'expiring-soon', label: texts.sort.expiringSoon },
    { value: 'recent', label: texts.sort.recent },
    { value: 'a-z', label: texts.sort.alphabetical },
    { value: 'best-discount', label: texts.sort.bestDiscount },
  ];

  const filterTexts: FilterTexts = {
    title: texts.filters.title,
    features: texts.filters.features,
    clearAll: texts.filters.clearAll,
    apply: texts.filters.apply,
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header brand: back + título + Sort/Filter.
          Tablet = full-width compartido; phone = 375-space escalado (pixel-perfect). */}
      {isTablet ? (
        <PwaListTabletHeader
          title={texts.title}
          onBack={() => router.push('/pwa/dashboard')}
          onSort={() => setSortOpen(true)}
          onFilter={() => setFilterOpen(true)}
          filterActive={filterActive}
        />
      ) : (
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
            <PwaSubHeader title={texts.title} onBack={() => router.push('/pwa/dashboard')} />

            {/* Sort */}
            <button
              type="button"
              aria-label="Sort"
              onClick={() => setSortOpen(true)}
              className="absolute flex items-center justify-center text-white"
              style={{ left: 300, top: 49, width: 26, height: 26 }}
            >
              <svg width={21} height={19} viewBox="0 0 576 512" fill="currentColor" aria-hidden>
                <path d="M151.6 469.6C145.5 476.2 137 480 128 480s-17.5-3.8-23.6-10.4l-88-96c-11.9-13-11.1-33.3 2-45.2s33.3-11.1 45.2 2L96 365.7V96c0-17.7 14.3-32 32-32s32 14.3 32 32V365.7l32.4-35.4c11.9-13 32.2-13.9 45.2-2s13.9 32.2 2 45.2l-88 96zM320 480c-17.7 0-32-14.3-32-32s14.3-32 32-32h32c17.7 0 32 14.3 32 32s-14.3 32-32 32H320zm0-128c-17.7 0-32-14.3-32-32s14.3-32 32-32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H320zm0-128c-17.7 0-32-14.3-32-32s14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H320zm0-128c-17.7 0-32-14.3-32-32s14.3-32 32-32H544c17.7 0 32 14.3 32 32s-14.3 32-32 32H320z" />
              </svg>
            </button>
            {/* Filter */}
            <button
              type="button"
              aria-label="Filter"
              onClick={() => setFilterOpen(true)}
              className="absolute flex items-center justify-center text-white"
              style={{ left: 337, top: 49, width: 26, height: 26 }}
            >
              {filterActive && (
                <span
                  className="absolute rounded-full"
                  style={{
                    right: 0,
                    top: 0,
                    width: 8,
                    height: 8,
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
          </div>
        </div>
      )}

      {/* Barra de búsqueda persistente (filtra en vivo) */}
      <div className={`shrink-0 pb-1 pt-3 ${isTablet ? 'px-8' : 'px-4'}`}>
        <div
          className="flex items-center gap-2 rounded-full px-3.5"
          style={{ height: 40, backgroundColor: 'hsl(var(--foreground) / 0.06)' }}
        >
          <SearchIcon size={14} className="shrink-0 text-foreground/45" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={texts.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-foreground/40"
            style={{ fontSize: 14, ...OPEN_SANS }}
          />
          {query.length > 0 ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="shrink-0 text-foreground/50"
            >
              <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Grid 2-col / empty */}
      <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
        {visible.length > 0 ? (
          <div
            className={`grid gap-3 px-4 pb-5 pt-2 ${isLandscape ? 'grid-cols-3' : 'grid-cols-2'}`}
          >
            {visible.map((d) => (
              <DealCardPwa
                key={d.slug}
                deal={d}
                expiresPrefix={texts.expiresPrefix}
                onOpen={setRedeemDeal}
              />
            ))}
          </div>
        ) : (
          <p
            className="px-8 pt-16 text-center"
            style={{ fontSize: 14, color: 'hsl(var(--foreground) / 0.55)', ...OPEN_SANS }}
          >
            {texts.empty}
          </p>
        )}
      </div>

      <PwaBottomNav />

      {/* Overlays */}
      <PwaSortOverlay
        open={sortOpen}
        title={texts.sort.title}
        options={sortOptions}
        value={sortOrder}
        onSelect={(v) => {
          setSortOrder(v);
          setSortOpen(false);
        }}
        onCancel={() => setSortOpen(false)}
      />

      <PwaFilterOverlay
        open={filterOpen}
        features={featureCatalog}
        subcategories={[]}
        initial={filter}
        texts={filterTexts}
        onCancel={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilter(next);
          setFilterOpen(false);
        }}
      />

      <DealRedeemPopup deal={redeemDeal} texts={texts} onClose={() => setRedeemDeal(null)} />
    </div>
  );
}
