'use client';

import { useState } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaTripPlannerModuleConfig } from '@/lib/config';
import type { UseItineraryRailResult } from '@/lib/itinerary-favorites';

import { Layer } from '../mobile-layer';

import type { TpCard, TpCategory } from './types';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

const TAB_ORDER = ['things-to-do', 'events', 'restaurants'];

export function TpTopSuggestionsResult({
  tp,
  categories,
  textos,
  rail,
  onStartOver,
  onFinish,
}: {
  tp: PwaTripPlannerModuleConfig;
  categories: TpCategory[];
  textos: Record<string, string>;
  rail: UseItineraryRailResult;
  onStartOver: () => void;
  onFinish: () => void;
}) {
  const tabs = TAB_ORDER.map((key) => categories.find((c) => c.key === key)).filter(
    (x): x is TpCategory => Boolean(x),
  );
  const [tab, setTab] = useState(0);
  const tabLabelFor = (key: string) =>
    key === 'things-to-do'
      ? (textos.itinerary_top_tab_things ?? 'Things to do')
      : key === 'events'
        ? (textos.itinerary_top_tab_events ?? 'Events')
        : (textos.itinerary_top_tab_restaurants ?? 'Restaurants');

  const items = (tabs[tab]?.items ?? []).slice(0, 8);
  const distanceTemplate = textos.itinerary_distance_away ?? '{n} mi away';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      {/* Header */}
      <Layer
        h={90}
        className="relative z-10 shrink-0"
        style={{ backgroundColor: 'hsl(var(--brand-primary))' }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={onStartOver}
          className="absolute text-white"
          style={{ left: 18, top: 50, height: 28 }}
        >
          <svg width={11.87} height={20.36} viewBox="0 0 11.87 20.36" fill="#fff" aria-hidden>
            <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
          </svg>
        </button>
        <div
          className="pointer-events-none absolute text-center font-bold text-white"
          style={{ left: 60, top: 53, width: 255, fontSize: 17, ...OPEN_SANS }}
        >
          {textos.itinerary_top_title ?? 'Top Suggestions'}
        </div>
      </Layer>

      <p
        className="px-6 py-3 text-center text-[13px] font-semibold text-foreground/80"
        style={OPEN_SANS}
      >
        {textos.itinerary_top_subtitle ?? 'Top curated ideas. Just choose, save, or start over!'}
      </p>

      {/* Tabs (underline) */}
      <div
        className="flex shrink-0 gap-5 border-b px-5"
        style={{ borderColor: 'hsl(var(--foreground)/0.1)', ...OPEN_SANS }}
      >
        {tabs.map((c, i) => {
          const on = i === tab;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setTab(i)}
              className="-mb-px border-b-2 pb-2 text-[13px] font-bold"
              style={{
                borderColor: on ? 'hsl(var(--brand-secondary))' : 'transparent',
                color: on ? 'hsl(var(--brand-secondary))' : 'hsl(var(--foreground)/0.5)',
              }}
            >
              {tabLabelFor(c.key)}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-4 py-3" style={OPEN_SANS}>
        <div className="flex flex-col gap-3">
          {items.map((it: TpCard) => {
            const inPlan = rail.has(it.slug, it.kind);
            return (
              <div
                key={`${it.kind}:${it.slug}`}
                className="relative h-[140px] w-full overflow-hidden rounded-[12px] bg-cover bg-center"
                style={{ backgroundImage: `url("${resolveAssetUrl(it.image)}")` }}
              >
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <p className="truncate text-[15px] font-bold text-white drop-shadow">
                    {it.title}
                  </p>
                  <p className="mb-2 text-[11px] text-white/90">
                    {distanceTemplate.replace('{n}', it.distanceMi.toFixed(1))}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-white px-3 py-1 text-[10px] font-bold"
                      style={{ color: 'hsl(var(--brand-primary))' }}
                    >
                      {textos.itinerary_top_more_info ?? 'More info'}
                    </button>
                    <button
                      type="button"
                      onClick={() => rail.add(it.slug, it.kind)}
                      className="rounded-full px-3 py-1 text-[10px] font-bold text-white"
                      style={{
                        backgroundColor: 'hsl(var(--brand-tertiary))',
                        opacity: inPlan ? 0.6 : 1,
                      }}
                    >
                      {tp.top.itinerary}
                    </button>
                    <button
                      type="button"
                      onClick={() => rail.remove(it.slug, it.kind)}
                      className="rounded-full px-3 py-1 text-[10px] font-bold text-white"
                      style={{ backgroundColor: 'hsl(var(--brand-primary))' }}
                    >
                      {tp.top.remove}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Over / Finish */}
      <div className="flex shrink-0 gap-3 px-4 py-3" style={OPEN_SANS}>
        <button
          type="button"
          onClick={onStartOver}
          className="flex-1 rounded-full py-2.5 text-[13px] font-bold uppercase text-white"
          style={{ backgroundColor: 'hsl(var(--brand-tertiary))' }}
        >
          {textos.itinerary_ai_start_over ?? 'Start Over'}
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="flex-1 rounded-full py-2.5 text-[13px] font-bold uppercase text-white"
          style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
        >
          {textos.itinerary_ai_finish_cta ?? 'Finish'}
        </button>
      </div>
    </div>
  );
}
