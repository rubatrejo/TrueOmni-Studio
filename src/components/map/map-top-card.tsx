'use client';

import { useState } from 'react';

import { useEventFavorites, useFavorites } from '@/lib/favorites';
import type { MapItem } from '@/lib/map-item';

/**
 * Card del carrusel superior del Map. MISMO contenido y estructura que
 * `ListingCard` del módulo Listings (Fase 3.3) para mantener consistencia:
 *   - Imagen arriba con heart top-right (ratio ~293×164).
 *   - Footer oscuro (#3b3b3b) con SUBCATEGORY + title + distance + open until.
 *
 * Selección:
 *   - normal   → 293 × 268.63 (tamaño canon de ListingCard).
 *   - active   → 15% más grande (337 × 309).
 */
interface MapTopCardProps {
  item: MapItem;
  active: boolean;
  distanceMi?: number;
  onClick: () => void;
}

const CARD_W = 293;
const CARD_H = 268.63;
const IMG_H = 164.63;
const FOOTER_H = 104;
const ACTIVE_SCALE = 1.18;
const ACTIVE_LIFT = 10; // px que se eleva la card activa para destacarla

export function MapTopCard({ item, active, distanceMi, onClick }: MapTopCardProps) {
  // Cuando está activa crece 18% en ancho Y alto, se eleva 10px y gana un
  // borde azul + shadow más intenso para que se note inequívocamente cuál
  // está seleccionada en el mapa.
  const w = active ? CARD_W * ACTIVE_SCALE : CARD_W;
  const h = active ? CARD_H * ACTIVE_SCALE : CARD_H;
  const imgH = active ? IMG_H * ACTIVE_SCALE : IMG_H;
  const footerH = active ? FOOTER_H * ACTIVE_SCALE : FOOTER_H;
  const scaleFont = active ? ACTIVE_SCALE : 1;

  const listingsFavs = useFavorites();
  const eventsFavs = useEventFavorites();
  const isEvent = item.source === 'events';
  const favs = isEvent ? eventsFavs : listingsFavs;
  const isFavorited = favs.isFavorited(item.slug);

  const city = item.address.split(',').slice(-2, -1)[0]?.trim() ?? '';
  const stateFromAddr = item.address.match(/,\s*([A-Z]{2})\s/)?.[1] ?? '';
  const distanceStr = distanceMi != null ? `${distanceMi.toFixed(1)} mi · ` : '';
  const openUntil = item.openTodayLabel ?? item.dateLabel ?? item.hours ?? '';

  const heartSize = 65 * scaleFont;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={item.title}
      className="relative block flex-shrink-0 overflow-hidden text-left transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        transform: active ? `translateY(-${ACTIVE_LIFT}px)` : 'translateY(0)',
        boxShadow: active ? 'none' : '0 4px 10px rgba(0,0,0,0.15)',
      }}
    >
      {/* Imagen */}
      <div
        className="absolute left-0 right-0 top-0 overflow-hidden"
        style={{ height: `${imgH}px` }}
      >
        <CardImage src={item.image} title={item.title} />
        {/* Heart */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            favs.toggle(item.slug);
          }}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFavorited}
          className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{
            right: '10px',
            top: '10px',
            width: `${heartSize}px`,
            height: `${heartSize}px`,
            borderRadius: `${heartSize / 2}px`,
            backgroundColor: 'rgba(255,255,255,0.7)',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={38 * scaleFont}
            height={38 * scaleFont}
            viewBox="0 0 24 24"
            fill={isFavorited ? '#e02020' : 'none'}
            stroke="#e02020"
            strokeWidth={isFavorited ? 0 : 1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Footer dark */}
      <div
        className="absolute left-0 right-0 overflow-hidden"
        style={{ top: `${imgH}px`, height: `${footerH}px`, backgroundColor: '#3b3b3b' }}
      >
        <span
          className="absolute font-sans uppercase text-white"
          style={{
            left: `${20 * scaleFont}px`,
            top: `${12 * scaleFont}px`,
            fontSize: `${12 * scaleFont}px`,
            lineHeight: '1',
            letterSpacing: '0.04em',
          }}
        >
          {item.subcategory}
        </span>
        <span
          className="absolute font-sans text-white"
          style={{
            left: `${20 * scaleFont}px`,
            top: `${28 * scaleFont}px`,
            right: `${20 * scaleFont}px`,
            fontSize: `${22 * scaleFont}px`,
            lineHeight: '1',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.title}
        </span>
        <span
          className="absolute font-sans text-white"
          style={{
            left: `${20 * scaleFont}px`,
            top: `${60 * scaleFont}px`,
            fontSize: `${14 * scaleFont}px`,
            lineHeight: '1',
            fontWeight: 300,
          }}
        >
          {distanceStr}
          {city}
          {stateFromAddr ? `, ${stateFromAddr}` : ''}
        </span>
        <span
          className="absolute font-sans"
          style={{
            left: `${20 * scaleFont}px`,
            top: `${82 * scaleFont}px`,
            fontSize: `${12 * scaleFont}px`,
            lineHeight: '1',
            fontWeight: 600,
            color: '#b9bd39',
          }}
        >
          {openUntil}
        </span>
      </div>
    </button>
  );
}

function CardImage({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        aria-hidden
        className="flex h-full w-full items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #004f8b 0%, #1796d6 100%)',
          color: '#ffffff',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        {title}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
  );
}
