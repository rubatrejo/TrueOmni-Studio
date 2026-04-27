'use client';

import Image from 'next/image';
import { useState } from 'react';

import type { GeneratedItinerary } from '@/lib/ai-itinerary';
import type { ItineraryCatalogItem } from '@/lib/itinerary-catalog';

import { AiResultTimeline } from './ai-result-timeline';

export interface AiResultScreenTextos {
  resultTitle: string;
  tabEvents: string;
  /** Plantilla del tab DAY, ej. 'DAY {n}'. */
  tabDayTemplate: string;
  startOver: string;
  finish: string;
}

export interface AiResultScreenProps {
  itinerary: GeneratedItinerary;
  resolveItem: (slug: string, kind: 'listing' | 'event' | 'trail') => ItineraryCatalogItem | null;
  textos: AiResultScreenTextos;
  /** Logo del header. */
  logoSrc?: string;
  onStartOver: () => void;
  onFinish: () => void;
}

const formatTabDay = (tpl: string, n: number) => tpl.replace('{n}', String(n));

export function AiResultScreen(props: AiResultScreenProps) {
  const { itinerary, resolveItem, textos } = props;
  const hasEvents = itinerary.events.length > 0;
  const tabs: { key: string; label: string; entries: typeof itinerary.events }[] = [];
  if (hasEvents) {
    tabs.push({ key: 'events', label: textos.tabEvents, entries: itinerary.events });
  }
  itinerary.days.forEach((day, i) => {
    tabs.push({ key: `day-${i}`, label: formatTabDay(textos.tabDayTemplate, i + 1), entries: day.entries });
  });

  const [activeTab, setActiveTab] = useState(() => tabs[hasEvents ? 1 : 0]?.key ?? '');
  const activeEntries = tabs.find((t) => t.key === activeTab)?.entries ?? [];

  const carouselItems = activeEntries
    .map((e) => resolveItem(e.slug, e.itemKind))
    .filter((it): it is ItineraryCatalogItem => it !== null);

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      {/* Header simple azul */}
      <div
        className="relative w-full"
        style={{ height: 130, backgroundColor: 'hsl(var(--primary))' }}
      >
        {props.logoSrc ? (
          <div className="absolute" style={{ left: 65, top: 44 }}>
            <Image
              src={props.logoSrc}
              alt="logo"
              width={200}
              height={70}
              className="h-[70px] w-auto"
              unoptimized
            />
          </div>
        ) : null}
      </div>

      <h2
        className="px-10 pt-6 text-[28px] font-semibold"
        style={{ color: 'hsl(var(--primary))' }}
      >
        {itinerary.title.replace('{duration_label}', '').trim() || textos.resultTitle}
      </h2>

      <div className="mt-3 flex items-center gap-2 overflow-x-auto px-10">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              aria-pressed={isActive}
              className="flex h-[40px] flex-shrink-0 items-center justify-center rounded-md border-2 px-4 text-[14px] font-bold transition"
              style={{
                borderColor: 'hsl(var(--primary))',
                backgroundColor: isActive ? 'hsl(var(--primary))' : 'transparent',
                color: isActive ? 'white' : 'hsl(var(--primary))',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-10 pt-5">
        <AiResultTimeline entries={activeEntries} />
      </div>

      {/* Slider mock con play button + barra */}
      <div className="border-t border-zinc-200 px-10 pt-4">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-foreground">Start</span>
          <button
            type="button"
            aria-label="Play preview"
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-white"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 2v12l11-6z" fill="currentColor" />
            </svg>
          </button>
          <div className="relative flex-1 overflow-hidden rounded-full bg-zinc-200" style={{ height: 6 }}>
            <span
              className="absolute left-0 top-0 h-full"
              style={{ width: '20%', backgroundColor: 'hsl(var(--primary))' }}
            />
          </div>
          <span className="text-[13px] font-semibold uppercase tracking-wider text-zinc-400">Stop</span>
        </div>
      </div>

      {/* Carousel horizontal de cards */}
      <div className="overflow-x-auto px-10 py-4">
        <div className="flex gap-4">
          {carouselItems.map((item) => (
            <div
              key={`${item.kind}:${item.slug}`}
              className="relative flex-shrink-0 overflow-hidden rounded-md bg-zinc-900 shadow-md"
              style={{ width: 240, height: 200 }}
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="240px"
                  className="object-cover"
                  unoptimized
                />
              ) : null}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0"
                style={{
                  height: 90,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%)',
                }}
              />
              <div className="absolute inset-x-3 bottom-2 text-white">
                <p className="text-[12px] font-semibold uppercase tracking-wider opacity-80">
                  {item.subcategory}
                </p>
                <p className="text-[16px] font-bold leading-tight">{item.title}</p>
              </div>
              <div
                className="absolute right-2 top-2 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/90"
                aria-hidden="true"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    fill="#e02020"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTAs */}
      <div className="flex items-center justify-center gap-4 border-t border-zinc-200 bg-white px-10 py-5">
        <button
          type="button"
          onClick={props.onStartOver}
          className="flex h-[56px] items-center justify-center rounded-full px-12 text-[18px] font-semibold text-white shadow-md"
          style={{ backgroundColor: 'hsl(var(--itinerary-olive))' }}
        >
          {textos.startOver}
        </button>
        <button
          type="button"
          onClick={props.onFinish}
          className="flex h-[56px] items-center justify-center rounded-full px-12 text-[18px] font-semibold text-white shadow-md"
          style={{ backgroundColor: 'hsl(var(--primary))' }}
        >
          {textos.finish}
        </button>
      </div>
    </div>
  );
}
