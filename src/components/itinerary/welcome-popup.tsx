'use client';

import Image from 'next/image';

import { buildMapboxStaticUrl } from '@/lib/itinerary-asset';

export interface WelcomePopupTextos {
  kicker: string;
  intro: string;
  title: string;
  body: string;
  createCta: string;
  aiCta: string;
  categoryThings: string;
  categoryRestaurants: string;
  categoryStay: string;
  categoryVenues: string;
}

export interface WelcomePopupProps {
  textos: WelcomePopupTextos;
  /** Coords del cliente para el mapa de fondo. */
  clientCoords?: { lat: number; lng: number };
  mapboxToken?: string;
  onCreate: () => void;
  onAi: () => void;
  onClose: () => void;
}

/** Pin marker dibujado encima del mapa de fondo del welcome popup. */
function CategoryPin({
  label,
  x,
  y,
  alignLabel,
}: {
  label: string;
  x: number;
  y: number;
  alignLabel: 'right' | 'left';
}) {
  return (
    <div
      className="absolute flex items-center"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -100%)',
        flexDirection: alignLabel === 'right' ? 'row' : 'row-reverse',
      }}
    >
      {/* Pin teardrop */}
      <svg
        width="38"
        height="50"
        viewBox="0 0 38 50"
        className="drop-shadow-lg"
        aria-hidden="true"
      >
        <path
          d="M19 0C8.5 0 0 8.5 0 19c0 14 19 31 19 31s19-17 19-31C38 8.5 29.5 0 19 0z"
          fill="hsl(var(--primary))"
        />
        <circle cx="19" cy="19" r="6.5" fill="white" />
      </svg>
      {/* Label pill */}
      <div
        className="rounded-md bg-white px-3 py-1 text-[12px] font-bold tracking-wider text-foreground shadow-md"
        style={{ marginLeft: alignLabel === 'right' ? 8 : 0, marginRight: alignLabel === 'left' ? 8 : 0 }}
      >
        {label}
      </div>
    </div>
  );
}

export function WelcomePopup(props: WelcomePopupProps) {
  const { textos, clientCoords, mapboxToken, onCreate, onAi, onClose } = props;

  const mapBgUrl = buildMapboxStaticUrl({
    token: mapboxToken,
    lng: clientCoords?.lng,
    lat: clientCoords?.lat,
    zoom: 12,
    width: 540,
    height: 1080,
  });

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={textos.title}
    >
      {/* Background: mapa estático Mapbox o fallback gris */}
      <div className="absolute inset-0 overflow-hidden bg-zinc-300">
        {mapBgUrl && (
          <Image
            src={mapBgUrl}
            alt=""
            fill
            sizes="1080px"
            className="object-cover opacity-90"
            priority
            unoptimized
          />
        )}
        {/* 4 pins de categoría superpuestos al mapa */}
        <CategoryPin label={textos.categoryThings} x={170} y={350} alignLabel="right" />
        <CategoryPin label={textos.categoryRestaurants} x={760} y={500} alignLabel="left" />
        <CategoryPin label={textos.categoryStay} x={250} y={680} alignLabel="right" />
        <CategoryPin label={textos.categoryVenues} x={820} y={780} alignLabel="left" />
      </div>

      {/* Backdrop semi-transparente para legibilidad */}
      <div className="absolute inset-0 bg-black/15" aria-hidden="true" />

      {/* Card central */}
      <div
        className="relative flex w-[860px] flex-col items-center rounded-[28px] bg-white px-16 py-14 shadow-2xl"
        style={{ marginTop: 80 }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-foreground/85 text-white transition hover:bg-foreground"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <p
          className="text-[18px] font-bold tracking-[0.18em]"
          style={{ color: 'hsl(var(--primary))' }}
        >
          {textos.kicker}
        </p>
        <p className="mt-6 text-[26px] font-semibold tracking-[0.05em] text-foreground">
          {textos.intro}
        </p>
        <h1
          className="mt-3 text-center text-[44px] font-bold uppercase leading-[1.05] tracking-tight"
          style={{ color: 'hsl(var(--primary))', whiteSpace: 'pre-line' }}
        >
          {textos.title}
        </h1>
        <p className="mt-6 max-w-[600px] text-center text-[19px] leading-[1.45] text-zinc-600">
          {textos.body}
        </p>

        <div className="mt-10 flex gap-5">
          <button
            type="button"
            onClick={onCreate}
            className="flex h-[64px] items-center justify-center rounded-full px-10 text-[20px] font-semibold text-white shadow-md transition hover:opacity-95"
            style={{ backgroundColor: 'hsl(var(--itinerary-olive))' }}
          >
            {textos.createCta}
          </button>
          <button
            type="button"
            onClick={onAi}
            className="flex h-[64px] items-center justify-center rounded-full px-10 text-[20px] font-semibold text-white shadow-md transition hover:opacity-95"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
          >
            {textos.aiCta}
          </button>
        </div>
      </div>
    </div>
  );
}
