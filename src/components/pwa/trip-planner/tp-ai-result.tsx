'use client';

import { useState } from 'react';

import type { GeneratedEntry, GeneratedItinerary } from '@/lib/ai-itinerary';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaTripPlannerModuleConfig } from '@/lib/config';
import type { UseItineraryRailResult } from '@/lib/itinerary-favorites';

import { Layer } from '../mobile-layer';
import { PwaHeart } from '../pwa-heart';

import type { TpCard } from './types';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

function KindIcon({ kind }: { kind: GeneratedEntry['kind'] }) {
  const meal = kind === 'breakfast' || kind === 'lunch' || kind === 'dinner';
  return (
    <span
      className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
        {meal ? (
          <path
            d="M7 3v7m0 0v11m0-11a2 2 0 002-2V3M17 3c-1.5 0-2.5 1.5-2.5 4s1 4 2.5 4m0 0v10"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : kind === 'event' ? (
          <path
            d="M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z"
            fill="#fff"
          />
        )}
      </svg>
    </span>
  );
}

export function TpAiResult({
  result,
  tp,
  textos,
  stayCards,
  resolveCard,
  rail,
  onStartOver,
  onFinish,
  onShare,
}: {
  result: GeneratedItinerary;
  tp: PwaTripPlannerModuleConfig;
  textos: Record<string, string>;
  stayCards: TpCard[];
  resolveCard: (kind: string, slug: string) => TpCard | undefined;
  rail: UseItineraryRailResult;
  onStartOver: () => void;
  onFinish: () => void;
  onShare: () => void;
}) {
  const lodgingLabel = 'LODGING';
  const tabs = [lodgingLabel, ...result.days.map((d) => d.label.toUpperCase())];
  const [tab, setTab] = useState(result.days.length > 0 ? 1 : 0);

  const kindLabel = (k: GeneratedEntry['kind']) =>
    k === 'breakfast'
      ? (textos.itinerary_kind_breakfast ?? 'Breakfast')
      : k === 'lunch'
        ? (textos.itinerary_kind_lunch ?? 'Lunch')
        : k === 'dinner'
          ? (textos.itinerary_kind_dinner ?? 'Dinner')
          : k === 'event'
            ? (textos.itinerary_kind_event ?? 'Event')
            : (textos.itinerary_kind_activity ?? 'Activity');

  const distanceTemplate = textos.itinerary_distance_away ?? '{n} mi away';
  const dayEntries = tab > 0 ? (result.days[tab - 1]?.entries ?? []) : [];
  const carouselCards: TpCard[] =
    tab === 0
      ? stayCards
      : dayEntries
          .map((e) => resolveCard(e.itemKind, e.slug))
          .filter((x): x is TpCard => Boolean(x));

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
          {tp.ai.resultTitle}
        </div>
        <button
          type="button"
          aria-label="Share"
          onClick={onShare}
          className="absolute text-white"
          style={{ right: 18, top: 50 }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M18 8a3 3 0 10-2.83-4M6 15a3 3 0 100-6 3 3 0 000 6zm12 7a3 3 0 10-2.83-4M8.6 13.5l6.8 3.9M15.4 6.6l-6.8 3.9"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </Layer>

      {/* Tabs */}
      <div
        className="scrollbar-hide flex shrink-0 gap-2 overflow-x-auto px-4 py-3"
        style={OPEN_SANS}
      >
        {tabs.map((t, i) => {
          const on = i === tab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(i)}
              className="shrink-0 rounded-[8px] border px-4 py-1.5 text-[12px] font-bold"
              style={{
                borderColor: 'hsl(var(--brand-secondary))',
                backgroundColor: on ? 'hsl(var(--brand-secondary))' : 'transparent',
                color: on ? '#fff' : 'hsl(var(--brand-secondary))',
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Contenido scrollable: timeline + carrusel */}
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto" style={OPEN_SANS}>
        {tab > 0 && (
          <div className="flex flex-col gap-3 px-4 pb-3">
            {dayEntries.map((e, i) => (
              <div
                key={i}
                className="flex gap-3 border-b pb-3"
                style={{ borderColor: 'hsl(var(--foreground)/0.1)' }}
              >
                <KindIcon kind={e.kind} />
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold text-foreground">{kindLabel(e.kind)}</p>
                  <p className="text-[12px] leading-relaxed text-foreground/70">{e.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Carrusel de cards */}
        <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-4 pt-1">
          {carouselCards.map((c) => {
            const fav = rail.has(c.slug, c.kind);
            return (
              <div
                key={`${c.kind}:${c.slug}`}
                className="relative h-[150px] w-[230px] shrink-0 overflow-hidden rounded-[12px] bg-cover bg-center shadow"
                style={{ backgroundImage: `url("${resolveAssetUrl(c.image)}")` }}
              >
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                <button
                  type="button"
                  aria-label="Toggle"
                  onClick={() => (fav ? rail.remove(c.slug, c.kind) : rail.add(c.slug, c.kind))}
                  className="absolute right-2 top-2 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/90"
                >
                  <PwaHeart filled={fav} size={17} />
                </button>
                <div className="absolute bottom-2 left-3 right-3">
                  <p className="text-[8px] font-bold uppercase text-white/80">{c.subcategory}</p>
                  <p className="truncate text-[14px] font-bold text-white">{c.title}</p>
                  <p className="text-[11px] text-white/90">
                    {distanceTemplate.replace('{n}', c.distanceMi.toFixed(1))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botones Start Over / Finish */}
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
