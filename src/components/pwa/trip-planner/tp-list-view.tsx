'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { PwaTripPlannerModuleConfig } from '@/lib/config';
import type { UseItineraryRailResult } from '@/lib/itinerary-favorites';

import { SearchIcon } from '../dashboard-icons';
import { Layer, S } from '../mobile-layer';

import { TpCategoryMenu } from './tp-category-menu';
import { TpListingCard } from './tp-listing-card';
import { TpLocalListingCard } from './tp-local-listing-card';
import type { TpCategory, TpLocalListing } from './types';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const BRAND = 'hsl(var(--brand-primary))';

export function TpListView({
  tp,
  categories,
  localListings,
  textos,
  rail,
  onOpenMyPlan,
}: {
  tp: PwaTripPlannerModuleConfig;
  categories: TpCategory[];
  localListings: TpLocalListing[];
  textos: Record<string, string>;
  rail: UseItineraryRailResult;
  onOpenMyPlan: () => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCat, setActiveCat] = useState('things-to-do');
  const [selectedDay, setSelectedDay] = useState(1);

  const isLocal = activeCat === 'local-listings';
  const category = categories.find((c) => c.key === activeCat);
  const headerTitle = isLocal ? tp.menu.localListings : (category?.label ?? tp.title);
  const distanceTemplate = textos.itinerary_distance_away ?? '{n} mi away';

  const headerH = 90 * S;

  const localInPlan = (ll: TpLocalListing) =>
    ll.stops.length > 0 && ll.stops.every((s) => rail.has(s.slug, s.kind));
  const toggleLocal = (ll: TpLocalListing) => {
    if (localInPlan(ll)) ll.stops.forEach((s) => rail.remove(s.slug, s.kind));
    else ll.stops.forEach((s) => rail.add(s.slug, s.kind));
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      {/* Header: hamburguesa + título + search */}
      <Layer h={90} className="relative z-10 shrink-0" style={{ backgroundColor: BRAND }}>
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setMenuOpen((o) => !o)}
          className="absolute text-white"
          style={{ left: 18, top: 46 }}
        >
          {menuOpen ? (
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <path d="M5 5l14 14M19 5L5 19" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width={24} height={20} viewBox="0 0 24 20" fill="none">
              <path
                d="M2 2h20M2 10h20M2 18h20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
        <div
          className="pointer-events-none absolute text-center font-bold text-white"
          style={{ left: 60, top: 53, width: 255, fontSize: 17, ...OPEN_SANS }}
        >
          {headerTitle}
        </div>
        <button
          type="button"
          aria-label="Search"
          onClick={() => router.push('/pwa/search')}
          className="absolute text-white"
          style={{ right: 18, top: 48 }}
        >
          <SearchIcon size={20} />
        </button>
      </Layer>

      {/* Lista scrollable (bg navy → separa cards) */}
      <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-[3px] overflow-y-auto">
        {isLocal
          ? localListings.map((ll) => (
              <TpLocalListingCard
                key={ll.slug}
                ll={ll}
                inPlan={localInPlan(ll)}
                onToggle={() => toggleLocal(ll)}
                distanceTemplate={distanceTemplate}
                eyebrow={tp.menu.localListings.toUpperCase()}
              />
            ))
          : (category?.items ?? []).map((it) => {
              const fav = rail.has(it.slug, it.kind);
              return (
                <TpListingCard
                  key={`${it.kind}:${it.slug}`}
                  item={it}
                  fav={fav}
                  onToggleFav={() =>
                    fav ? rail.remove(it.slug, it.kind) : rail.add(it.slug, it.kind)
                  }
                  distanceTemplate={distanceTemplate}
                />
              );
            })}
      </div>

      {/* MY PLAN (n) pill */}
      {rail.count > 0 && (
        <button
          type="button"
          onClick={onOpenMyPlan}
          className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full py-2 pl-4 pr-2 text-white shadow-lg"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--brand-primary)), hsl(var(--brand-secondary)))',
            ...OPEN_SANS,
          }}
        >
          <span className="text-[13px] font-bold">{tp.myPlan.myPlanLabel}</span>
          <span
            className="flex h-[24px] min-w-[24px] items-center justify-center rounded-full bg-white px-1 text-[12px] font-bold"
            style={{ color: 'hsl(var(--brand-primary))' }}
          >
            {rail.count}
          </span>
        </button>
      )}

      {/* Menú de categorías */}
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 z-20 cursor-default"
            style={{ top: headerH }}
          />
          <div className="absolute left-0 z-30" style={{ top: headerH }}>
            <TpCategoryMenu
              categories={categories}
              localListingsLabel={tp.menu.localListings}
              active={activeCat}
              onSelect={(k) => {
                setActiveCat(k);
                setMenuOpen(false);
              }}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          </div>
        </>
      )}
    </div>
  );
}
