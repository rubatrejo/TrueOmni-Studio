'use client';

import Image from 'next/image';

import { pinDataUri } from '@/components/map/map-pin-icons';
import type { MapSource } from '@/lib/config';

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
  onCreate: () => void;
  onAi: () => void;
  onClose: () => void;
}

/** Pin con el mismo estilo del MapCanvas (teardrop + icono por categoría). */
function CategoryPin({
  source,
  label,
  x,
  y,
  alignLabel,
}: {
  source: MapSource;
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
      <Image
        src={pinDataUri(source)}
        alt=""
        width={56}
        height={75}
        unoptimized
        className="drop-shadow-md"
      />
      <div
        className="rounded-md bg-white px-3 py-[6px] text-[14px] font-bold tracking-[0.07em] text-foreground shadow-md"
        style={{
          marginLeft: alignLabel === 'right' ? 8 : 0,
          marginRight: alignLabel === 'left' ? 8 : 0,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/**
 * Welcome popup overlay del Itinerary Builder. NO tiene mapa propio: se
 * renderiza encima de la pantalla manual completa (header + tabs + listings
 * column + map + toolbar + rail), oscureciéndola con un backdrop semi-
 * transparente. Los 4 pins decorativos de categoría flotan en la zona del
 * mapa para destacar las 4 categorías principales.
 */
export function WelcomePopup(props: WelcomePopupProps) {
  const { textos, onCreate, onAi, onClose } = props;

  return (
    <div
      className="absolute inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={textos.title}
    >
      {/* Backdrop semi-transparente blanco para apagar el manual de atrás
          (suaviza colores sin oscurecer demasiado, como el SVG). */}
      <div className="absolute inset-0 bg-white/40" aria-hidden="true" />

      {/* 4 pins decorativos sobre la zona del mapa (top:320 .. bottom:366
          en el manual). Los posicionamos en coords absolute del canvas. */}
      <CategoryPin
        source="things-to-do"
        label={textos.categoryThings}
        x={345}
        y={500}
        alignLabel="right"
      />
      <CategoryPin
        source="restaurants"
        label={textos.categoryRestaurants}
        x={780}
        y={620}
        alignLabel="left"
      />
      <CategoryPin
        source="stay"
        label={textos.categoryStay}
        x={355}
        y={780}
        alignLabel="right"
      />
      <CategoryPin
        source="events"
        label={textos.categoryVenues}
        x={820}
        y={870}
        alignLabel="left"
      />

      {/* Card central */}
      <div className="absolute inset-x-0 flex justify-center" style={{ top: 920 }}>
        <div
          className="relative flex w-[860px] flex-col items-center rounded-[28px] bg-white px-16 py-12 shadow-2xl"
          style={{ minHeight: 460 }}
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
            className="text-[20px] font-bold tracking-[0.18em]"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {textos.kicker}
          </p>
          <p className="mt-6 text-[28px] font-semibold tracking-[0.04em] text-foreground">
            {textos.intro}
          </p>
          <h1
            className="mt-3 text-center text-[48px] font-bold uppercase leading-[1.05] tracking-tight"
            style={{ color: 'hsl(var(--primary))', whiteSpace: 'pre-line' }}
          >
            {textos.title}
          </h1>
          <p className="mt-6 max-w-[640px] text-center text-[20px] leading-[1.45] text-zinc-600">
            {textos.body}
          </p>

          <div className="mt-10 flex gap-5">
            <button
              type="button"
              onClick={onCreate}
              className="flex h-[68px] items-center justify-center rounded-full px-12 text-[22px] font-semibold text-white shadow-md transition hover:opacity-95"
              style={{ backgroundColor: 'hsl(var(--itinerary-olive))' }}
            >
              {textos.createCta}
            </button>
            <button
              type="button"
              onClick={onAi}
              className="flex h-[68px] items-center justify-center rounded-full px-12 text-[22px] font-semibold text-white shadow-md transition hover:opacity-95"
              style={{ backgroundColor: 'hsl(var(--primary))' }}
            >
              {textos.aiCta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
