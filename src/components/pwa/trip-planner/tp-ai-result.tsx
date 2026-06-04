'use client';

import { useState } from 'react';

import type { GeneratedEntry, GeneratedItinerary } from '@/lib/ai-itinerary';
import type { PwaTripPlannerModuleConfig } from '@/lib/config';
import type { UseItineraryRailResult } from '@/lib/itinerary-favorites';

import { Layer } from '../mobile-layer';
import { ShareIconButton } from '../share-icon-button';

import { TpConfirmPopup } from './tp-confirm-popup';
import { TpStopCard } from './tp-stop-card';
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
  const [confirmStartOver, setConfirmStartOver] = useState(false);

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
          onClick={() => setConfirmStartOver(true)}
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
        <ShareIconButton
          onShare={onShare}
          size={20}
          className="absolute right-[18px] top-[50px] text-white"
        />
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

        {/* Carrusel de cards (estilo módulo Map para consistencia) */}
        <div className="scrollbar-hide flex gap-2.5 overflow-x-auto px-4 pb-4 pt-1">
          {carouselCards.map((c) => {
            const fav = rail.has(c.slug, c.kind);
            return (
              <TpStopCard
                key={`${c.kind}:${c.slug}`}
                image={c.image}
                eyebrow={c.subcategory}
                title={c.title}
                meta={distanceTemplate.replace('{n}', c.distanceMi.toFixed(1))}
                openUntil={c.openUntil}
                fav={fav}
                onToggleFav={() => (fav ? rail.remove(c.slug, c.kind) : rail.add(c.slug, c.kind))}
              />
            );
          })}
        </div>
      </div>

      {/* Botones Start Over / Finish */}
      <div className="flex shrink-0 gap-3 px-4 py-3" style={OPEN_SANS}>
        <button
          type="button"
          onClick={() => setConfirmStartOver(true)}
          className="flex-1 rounded-full py-2.5 text-[13px] font-bold uppercase text-white transition-transform active:scale-[0.97]"
          style={{ backgroundColor: 'hsl(var(--brand-tertiary))' }}
        >
          {textos.itinerary_ai_start_over ?? 'Start Over'}
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="flex-1 rounded-full py-2.5 text-[13px] font-bold uppercase text-white transition-transform active:scale-[0.97]"
          style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
        >
          {textos.itinerary_ai_finish_cta ?? 'Finish'}
        </button>
      </div>

      {/* Warning al hacer Start Over (descarta el itinerario AI generado) */}
      {confirmStartOver && (
        <TpConfirmPopup
          title={textos.itinerary_ai_leave_warning_title ?? 'Are you sure\nyou want to leave?'}
          body={
            textos.itinerary_ai_leave_warning_body ??
            "You'll lose the AI itinerary you've generated and have to answer the questions again."
          }
          cancelLabel={textos.itinerary_ai_leave_warning_cancel ?? 'Cancel'}
          confirmLabel={textos.itinerary_ai_leave_warning_confirm ?? 'Leave'}
          onCancel={() => setConfirmStartOver(false)}
          onConfirm={() => {
            setConfirmStartOver(false);
            onStartOver();
          }}
        />
      )}
    </div>
  );
}
