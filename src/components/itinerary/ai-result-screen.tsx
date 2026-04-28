'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { WeatherClock } from '@/components/home/weather-clock';
import { useSubcategoryLabel } from '@/components/i18n-provider';
import type { GeneratedItinerary } from '@/lib/ai-itinerary';
import type { ItineraryCatalogItem } from '@/lib/itinerary-catalog';
import type { WeatherData } from '@/lib/weather';

function SubcategoryText({ subcategory }: { subcategory: string }) {
  const label = useSubcategoryLabel(subcategory);
  return <>{label}</>;
}

import { AiResultTimeline } from './ai-result-timeline';

export interface AiResultScreenTextos {
  resultTitle: string;
  tabEvents: string;
  /** Plantilla del tab DAY, ej. 'DAY {n}'. */
  tabDayTemplate: string;
  startOver: string;
  finish: string;
  sliderStart: string;
  sliderStop: string;
  /** "mi away" suffix de la card carousel. */
  miAwaySuffix?: string;
  /** "Open until …" prefix (opcional, fallback a item.openTodayLabel). */
  openUntilPrefix?: string;
}

export interface AiResultScreenProps {
  itinerary: GeneratedItinerary;
  resolveItem: (slug: string, kind: 'listing' | 'event' | 'trail') => ItineraryCatalogItem | null;
  textos: AiResultScreenTextos;
  /** Labels por kind para el timeline, vienen de config.textos. */
  kindLabels: Record<'breakfast' | 'lunch' | 'dinner' | 'activity' | 'event', string>;
  /** Weather + locale + tz para el WeatherClock del header (estándar kiosk). */
  weather?: WeatherData | null;
  locale?: string;
  timezone?: string;
  /** Coords del cliente para distancias en cards. */
  clientCoords?: { lat: number; lng: number };
  /** Distance template "{n} mi away". */
  distanceTemplate?: string;
  onStartOver: () => void;
  onFinish: () => void;
}

const formatTabDay = (tpl: string, n: number) => tpl.replace('{n}', String(n));

const haversineMi = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number => {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export function AiResultScreen(props: AiResultScreenProps) {
  const { itinerary, resolveItem, textos } = props;
  const hasEvents = itinerary.events.length > 0;
  const tabs: { key: string; label: string; entries: typeof itinerary.events }[] = [];
  if (hasEvents) {
    tabs.push({ key: 'events', label: textos.tabEvents, entries: itinerary.events });
  }
  itinerary.days.forEach((day, i) => {
    tabs.push({
      key: `day-${i}`,
      label: formatTabDay(textos.tabDayTemplate, i + 1),
      entries: day.entries,
    });
  });

  const [activeTab, setActiveTab] = useState(() => tabs[hasEvents ? 1 : 0]?.key ?? '');
  const activeEntries = tabs.find((t) => t.key === activeTab)?.entries ?? [];

  const carouselItems = useMemo(
    () =>
      activeEntries
        .map((e) => resolveItem(e.slug, e.itemKind))
        .filter((it): it is ItineraryCatalogItem => it !== null),
    [activeEntries, resolveItem],
  );

  const distanceTpl = props.distanceTemplate ?? '{n} mi away';

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      {/* Header azul con TrueOmni logo + WeatherClock — estándar kiosk */}
      <div
        className="relative w-full flex-shrink-0"
        style={{
          height: 156,
          backgroundColor: 'hsl(var(--itinerary-toolbar-bg))',
        }}
      >
        <div className="absolute" style={{ left: 65, top: 44 }}>
          <TrueOmniLogo className="h-[70px] w-auto text-white" />
        </div>
        {props.weather ? (
          <div
            className="absolute"
            style={{ left: 744, top: 40, width: 300, height: 85 }}
          >
            <WeatherClock
              initialWeather={props.weather}
              locale={props.locale ?? 'en-US'}
              timezone={props.timezone}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <h2
          className="px-10 pt-10 text-[44px] font-bold leading-tight"
          style={{ color: 'hsl(var(--primary))' }}
        >
          {itinerary.title.replace('{duration_label}', '').trim() || textos.resultTitle}
        </h2>

        {/* Tabs row (EVENTS · DAY 1 · DAY 2 · DAY 3). Active filled, inactive outline. */}
        <div className="mt-9 flex items-center gap-4 overflow-x-auto px-10 pb-1">
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                aria-pressed={isActive}
                className="flex h-[64px] flex-shrink-0 items-center justify-center rounded-md border-2 px-8 text-[22px] font-bold tracking-wider transition"
                style={{
                  borderColor: 'hsl(var(--primary))',
                  backgroundColor: isActive ? 'hsl(var(--primary))' : 'white',
                  color: isActive ? 'white' : 'hsl(var(--primary))',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Timeline list */}
        <div className="flex-1 overflow-y-auto px-10 pt-12">
          <AiResultTimeline entries={activeEntries} kindLabels={props.kindLabels} />
        </div>

        {/* Pills row + cards en el MISMO scroll container — al hacer scroll
         *  horizontal de las cards, los pills (Start/Stop N) siguen alineados
         *  con sus cards debajo. */}
        <div
          className="overflow-x-auto border-t border-zinc-200 pt-5 pb-4 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', paddingLeft: 16, paddingRight: 16 }}
        >
          <div className="flex flex-col" style={{ gap: 14 }}>
            {/* Row 1: pills + connector lines, alineados con cards de abajo */}
            <div className="flex items-center" style={{ gap: 10 }}>
              {carouselItems.map((_, i) => {
                const isStart = i === 0;
                return (
                  <div
                    key={`pill-${i}`}
                    className="relative flex flex-shrink-0 items-center"
                    style={{ width: 290, height: 29 }}
                  >
                    {/* Pill (alineado a la izquierda de su card) */}
                    <div
                      className="relative flex flex-shrink-0 items-center"
                      style={{
                        width: 79,
                        height: 29,
                        borderRadius: 14.5,
                        backgroundColor: 'hsl(var(--itinerary-slot-pill-bg))',
                        boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
                        paddingLeft: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: 'hsl(var(--itinerary-slot-pill-text))',
                          lineHeight: 1,
                        }}
                      >
                        {isStart ? 'Start' : 'Stop'}
                      </span>
                      <div
                        style={{
                          position: 'absolute',
                          right: 3.5,
                          top: 3.5,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: 'hsl(var(--itinerary-slot-pill-circle))',
                          color: 'hsl(var(--itinerary-slot-pill-circle-text))',
                          fontSize: 12,
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isStart ? (
                          <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
                            <path
                              d="M7.858,2.11c-1.145,0-2.09-.743-3.529-.743a4.152,4.152,0,0,0-1.453.257,1.2,1.2,0,1,0-1.8.554v8.246a.513.513,0,0,0,.513.513H1.93a.513.513,0,0,0,.513-.513V8.407a5.968,5.968,0,0,1,2.444-.473c1.145,0,2.09.743,3.529.743a4.472,4.472,0,0,0,2.617-.873.682.682,0,0,0,.3-.563V2.049a.683.683,0,0,0-.972-.62,6.219,6.219,0,0,1-2.5.68Z"
                              fill="hsl(var(--itinerary-slot-pill-circle-text))"
                            />
                          </svg>
                        ) : (
                          <span>{i}</span>
                        )}
                      </div>
                    </div>
                    {/* Línea connector que llena el resto del ancho de la card
                     *  hasta el siguiente pill (excepto en la última card). */}
                    {i < carouselItems.length - 1 ? (
                      <div
                        aria-hidden
                        style={{
                          flex: 1,
                          marginLeft: 8,
                          marginRight: -16,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: 'hsl(var(--itinerary-slot-connector))',
                        }}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Row 2: cards 290×163 (16:9) */}
            <div className="flex" style={{ gap: 10 }}>
              {carouselItems.map((item) => {
                const dist =
                  props.clientCoords ? haversineMi(item.coords, props.clientCoords).toFixed(1) : null;
                return (
                  <div
                    key={`${item.kind}:${item.slug}`}
                    className="relative flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900 shadow-md"
                    style={{ width: 290, height: 163 }}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="272px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : null}
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0"
                      style={{
                        height: 130,
                        background:
                          'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%)',
                      }}
                    />
                    <div className="absolute inset-x-4 bottom-3 text-white">
                      <p className="text-[13px] font-semibold uppercase tracking-[0.18em] opacity-85">
                        <SubcategoryText subcategory={item.subcategory} />
                      </p>
                      <p className="mt-1 text-[22px] font-bold leading-tight">{item.title}</p>
                      {dist ? (
                        <p className="mt-1 text-[14px] font-semibold opacity-95">
                          {distanceTpl.replace('{n}', dist)}
                        </p>
                      ) : null}
                    </div>
                    <div className="absolute right-3 top-3 flex h-[40px] w-[40px] items-center justify-center rounded-full bg-white/95">
                      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                          fill="hsl(var(--itinerary-heart))"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating BackButton — pill `#004f8b` 116×232 azul aprobado */}
      <button
        type="button"
        onClick={props.onStartOver}
        aria-label={textos.startOver}
        className="absolute z-30 flex items-center justify-end focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        style={{
          left: 0,
          top: '1000px',
          width: '116px',
          height: '232px',
          backgroundColor: '#004f8b',
          borderTopRightRadius: '116px',
          borderBottomRightRadius: '116px',
          paddingRight: '30px',
          boxShadow: '12px 0 28px rgba(0,0,0,0.22)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="46"
          height="52"
          viewBox="0 0 44.824 50.443"
          aria-hidden
        >
          <path
            d="M23.489,0a4.559,4.559,0,0,1,2.242,1.624c.65.749,1.334,1.461,2,2.2a3.462,3.462,0,0,1-.015,4.885q-4.87,5.345-9.749,10.68c-.113.124-.221.253-.412.474h.614q11.722,0,23.445-.006A2.855,2.855,0,0,1,44.5,21.67a4.867,4.867,0,0,1,.31,1.708c.04,1.245.005,2.492-.005,3.738-.018,2.132-1.228,3.458-3.18,3.465-2.68.009-5.36,0-8.039,0h-16c.184.215.3.354.415.484q4.851,5.3,9.7,10.592a3.172,3.172,0,0,1,.614,4,27.824,27.824,0,0,1-3.874,4.261,2.455,2.455,0,0,1-3.356-.341c-.114-.106-.224-.217-.33-.333Q10.9,38.462,1.057,27.677a3.427,3.427,0,0,1-.636-4.1A4.415,4.415,0,0,1,1.07,22.7q9.824-10.772,19.651-21.54A4.305,4.305,0,0,1,22.5,0Z"
            fill="#ffffff"
          />
        </svg>
      </button>

      {/* Footer CTAs */}
      <div className="flex flex-shrink-0 items-center justify-center gap-5 border-t border-zinc-200 bg-white px-12 py-5">
        <button
          type="button"
          onClick={props.onStartOver}
          className="flex h-[68px] items-center justify-center rounded-full px-14 text-[20px] font-bold text-white shadow-md transition hover:opacity-95"
          style={{ backgroundColor: 'hsl(var(--itinerary-olive))' }}
        >
          {textos.startOver}
        </button>
        <button
          type="button"
          onClick={props.onFinish}
          className="flex h-[68px] items-center justify-center rounded-full px-14 text-[20px] font-bold text-white shadow-md transition hover:opacity-95"
          style={{ backgroundColor: 'hsl(var(--primary))' }}
        >
          {textos.finish}
        </button>
      </div>
    </div>
  );
}
