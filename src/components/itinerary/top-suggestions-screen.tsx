'use client';

import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { useMemo, useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { WeatherClock } from '@/components/home/weather-clock';
import { useSubcategoryLabel } from '@/components/i18n-provider';
import type { ItineraryCatalogItem } from '@/lib/itinerary-catalog';
import type { WeatherData } from '@/lib/weather';

function SubcategoryText({ subcategory }: { subcategory: string }) {
  const label = useSubcategoryLabel(subcategory);
  return <>{label}</>;
}

export interface TopSuggestionsScreenTextos {
  title: string;
  subtitle: string;
  scanLabel: string;
  /** Tab labels — orden fijo: things-to-do, events, restaurants. */
  tabThingsToDo: string;
  tabEvents: string;
  tabRestaurants: string;
  moreInfo: string;
  directions: string;
  startOver: string;
  finish: string;
  /** Distance template, ej. "{n} mi away" → label corto. */
  distanceTemplate: string;
  /** "Open until …" prefix (opcional). */
  openUntilPrefix?: string;
}

export interface TopSuggestionsScreenProps {
  /** Pool curado: viene del catálogo, separado por kind. */
  thingsToDo: ItineraryCatalogItem[];
  events: ItineraryCatalogItem[];
  restaurants: ItineraryCatalogItem[];
  textos: TopSuggestionsScreenTextos;
  /** Weather + locale + tz para el header. */
  weather?: WeatherData | null;
  locale?: string;
  timezone?: string;
  clientCoords?: { lat: number; lng: number };
  /** URL del QR. */
  qrUrl: string;
  /** Tap en card "More info" → abre detail screen del listing. */
  onMoreInfo: (item: ItineraryCatalogItem) => void;
  /** Tap en "Directions" → callback opcional. */
  onDirections?: (item: ItineraryCatalogItem) => void;
  /** Toggle heart → añade/quita del rail. */
  onToggleFavorite: (item: ItineraryCatalogItem) => void;
  isInRail: (item: ItineraryCatalogItem) => boolean;
  onStartOver: () => void;
  onFinish: () => void;
}

const haversineMi = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

type TabKey = 'things' | 'events' | 'restaurants';

export function TopSuggestionsScreen(props: TopSuggestionsScreenProps) {
  const { textos, thingsToDo, events, restaurants, qrUrl } = props;
  const [activeTab, setActiveTab] = useState<TabKey>('things');

  const items = useMemo(() => {
    if (activeTab === 'things') return thingsToDo;
    if (activeTab === 'events') return events;
    return restaurants;
  }, [activeTab, thingsToDo, events, restaurants]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      {/* Header azul con TrueOmni logo + WeatherClock */}
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
          <div className="absolute" style={{ left: 744, top: 40, width: 300, height: 85 }}>
            <WeatherClock
              initialWeather={props.weather}
              locale={props.locale ?? 'en-US'}
              timezone={props.timezone}
            />
          </div>
        ) : null}
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Title + subtitle (más grandes que la versión anterior) */}
        <h2
          className="px-12 pt-9 text-center text-[51px] font-bold leading-tight"
          style={{ color: 'hsl(var(--primary))' }}
        >
          {textos.title}
        </h2>
        <p className="mt-4 px-10 text-center text-[28px] leading-relaxed text-zinc-600">
          {textos.subtitle}
        </p>

        {/* QR + scan label */}
        <div className="mt-7 flex items-center justify-center gap-6">
          <div className="rounded-md bg-white p-1" style={{ border: '1px solid hsl(220 14% 88%)' }}>
            <QRCodeSVG value={qrUrl} size={124} level="M" includeMargin={false} />
          </div>
          <p
            className="text-[28px] font-bold leading-snug"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {textos.scanLabel}
          </p>
        </div>

        {/* Tabs row (text + underline para activo) */}
        <div className="mt-8 flex items-center justify-center gap-12 border-b border-zinc-200">
          {[
            { key: 'things' as TabKey, label: textos.tabThingsToDo },
            { key: 'events' as TabKey, label: textos.tabEvents },
            { key: 'restaurants' as TabKey, label: textos.tabRestaurants },
          ].map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                aria-pressed={isActive}
                className="relative pb-4 text-[28px] font-bold transition"
                style={{
                  color: isActive ? 'hsl(var(--primary))' : 'hsl(0 0% 50%)',
                }}
              >
                {t.label}
                {isActive ? (
                  <span
                    aria-hidden
                    className="absolute -bottom-px left-0 right-0 h-[3px]"
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Cards verticales scrollable. Ancla absoluta en y=680 (de la
         *  pantalla 1080×1920 del kiosk) — el header ocupa 0..156 y la zona
         *  título+subtítulo+QR+tabs ocupa 156..680. */}
        <div
          className="absolute inset-x-0 overflow-y-auto px-12 [&::-webkit-scrollbar]:hidden"
          style={{
            top: 680 - 156,
            bottom: 0,
            scrollbarWidth: 'none',
            paddingTop: 8,
            paddingBottom: 60,
          }}
        >
          <div className="grid grid-cols-2 gap-5">
            {items.map((item) => {
              const dist = props.clientCoords
                ? haversineMi(item.coords, props.clientCoords).toFixed(1)
                : null;
              const distLabel = dist ? props.textos.distanceTemplate.replace('{n}', dist) : null;
              const inRail = props.isInRail(item);
              const city = item.address?.split(',').slice(-2, -1)[0]?.trim() ?? '';
              const stateMatch = item.address?.match(/,\s*([A-Z]{2})\s/)?.[1] ?? '';
              const openUntil = item.hours?.split('–')[1]?.trim() ?? item.hours ?? '';
              return (
                <button
                  key={`${item.kind}:${item.slug}`}
                  type="button"
                  onClick={() => props.onMoreInfo(item)}
                  className="relative block overflow-hidden text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
                  style={{ width: '100%', aspectRatio: '293 / 268.63' }}
                >
                  {/* Imagen ~61.3% del alto (mismo ratio que ListingCard 164.63/268.63). */}
                  <div
                    className="absolute inset-x-0 top-0 overflow-hidden"
                    style={{ height: '61.28%' }}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="500px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-white"
                        style={{
                          background:
                            'linear-gradient(135deg, hsl(var(--brand-primary)) 0%, hsl(var(--brand-secondary)) 100%)',
                          fontSize: 18,
                          fontWeight: 700,
                          padding: 12,
                          textAlign: 'center',
                        }}
                      >
                        {item.title}
                      </div>
                    )}
                    {/* Heart top-right */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        props.onToggleFavorite(item);
                      }}
                      aria-label={inRail ? 'Remove from itinerary' : 'Add to itinerary'}
                      aria-pressed={inRail}
                      className="absolute flex items-center justify-center"
                      style={{
                        right: 10,
                        top: 10,
                        width: 65,
                        height: 65,
                        borderRadius: 32.5,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <svg
                        width="38"
                        height="38"
                        viewBox="0 0 24 24"
                        fill={inRail ? 'hsl(var(--itinerary-heart))' : 'none'}
                        stroke="hsl(var(--itinerary-heart))"
                        strokeWidth={inRail ? 0 : 1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>

                  {/* Footer dark #555555 ~38.72% del alto */}
                  <div
                    className="absolute inset-x-0 bottom-0 overflow-hidden"
                    style={{ height: '38.72%', backgroundColor: '#555555' }}
                  >
                    <span
                      className="absolute font-sans uppercase text-white"
                      style={{
                        left: 20,
                        right: 20,
                        top: 14,
                        fontSize: 14,
                        lineHeight: 1,
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <SubcategoryText subcategory={item.subcategory} />
                    </span>
                    <span
                      className="absolute font-sans text-white"
                      style={{
                        left: 20,
                        right: 20,
                        top: 34,
                        fontSize: 24,
                        lineHeight: 1.1,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      className="absolute font-sans text-white"
                      style={{
                        left: 20,
                        right: 20,
                        top: 70,
                        fontSize: 15,
                        lineHeight: 1,
                        fontWeight: 300,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {distLabel ? `${distLabel}` : ''}
                      {distLabel && (city || stateMatch) ? ' · ' : ''}
                      {city}
                      {stateMatch ? `, ${stateMatch}` : ''}
                    </span>
                    {openUntil ? (
                      <span
                        className="absolute font-sans"
                        style={{
                          left: 20,
                          right: 20,
                          top: 96,
                          fontSize: 14,
                          lineHeight: 1,
                          fontWeight: 600,
                          color: 'hsl(var(--itinerary-olive))',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {textos.openUntilPrefix ?? 'Open until'} {openUntil}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gradient blanco→transparente en la base del scroll para indicar
         *  visualmente que hay más cards abajo. Sentinel sobre el scroll
         *  container con `pointer-events: none` para que no interfiera con
         *  los CTAs de las cards. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0"
          style={{
            bottom: 0,
            height: 140,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 70%, rgba(255,255,255,1) 100%)',
            zIndex: 5,
          }}
        />
      </div>

      {/* Floating BackButton — pill aprobado */}
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
          backgroundColor: 'hsl(var(--brand-primary))',
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
