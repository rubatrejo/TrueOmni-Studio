'use client';

import Image from 'next/image';

import { useSubcategoryLabel } from '@/components/i18n-provider';
import { useEventFavorites, useFavorites } from '@/lib/favorites';
import type { MapItem } from '@/lib/map-item';
import { formatMiAway, walkingEta } from '@/lib/map-walking-eta';

/**
 * Burbuja tooltip "Map-Small-Detail" que aparece sobre el pin seleccionado.
 * Verbatim del SVG `Map-Small-Detail.svg`.
 *
 * La posición en pantalla (left/top) la calcula el parent con
 * `map.project(coords)` y la pasa como prop.
 */
interface MapPinBubbleProps {
  item: MapItem;
  left: number;
  top: number;
  clientCoords?: { lat: number; lng: number };
  /** Textos configurables desde `config.textos.map_*`. */
  labels: {
    seeMoreInfo: string;
    addToItinerary: string;
    addedToItinerary: string;
    miAwaySuffix: string;
    minWalkingSuffix: string;
  };
  /** Click en SEE MORE INFO — el parent decide si abre overlay in-place. */
  onSeeMore: () => void;
  onClose: () => void;
}

const BUBBLE_WIDTH = 540; // +10% vs 490
const BUBBLE_HEIGHT = 278; // +10% vs 252
const ARROW_HEIGHT = 14;
const SELECTED_PIN_HEIGHT = 210; // ver `map-pin-icons.ts#SELECTED_H`
const PIN_GAP = 14; // espacio libre entre el tope del pin y la flecha del bubble

export function MapPinBubble({
  item,
  left,
  top,
  clientCoords,
  labels,
  onSeeMore,
  onClose,
}: MapPinBubbleProps) {
  const subcategoryLabel = useSubcategoryLabel(item.subcategory);
  const listingsFavs = useFavorites();
  const eventsFavs = useEventFavorites();
  const isEvent = item.source === 'events';
  const favs = isEvent ? eventsFavs : listingsFavs;
  const isFavorited = favs.isFavorited(item.slug);

  const eta = clientCoords ? walkingEta(clientCoords, item.coords) : null;

  const handleSeeMore = () => onSeeMore();

  const handleAddItinerary = () => {
    favs.toggle(item.slug);
  };

  // Anchor: la burbuja va encima del pin seleccionado con un gap claro para
  // que el pin quede visible debajo de la flecha (no tapado por la burbuja).
  const bubbleLeft = left - BUBBLE_WIDTH / 2;
  const bubbleTop = top - SELECTED_PIN_HEIGHT - PIN_GAP - ARROW_HEIGHT - BUBBLE_HEIGHT;

  return (
    <div
      role="dialog"
      aria-label={item.title}
      className="absolute z-30"
      style={{
        left: `${bubbleLeft}px`,
        top: `${bubbleTop}px`,
        width: `${BUBBLE_WIDTH}px`,
      }}
    >
      <div
        className="relative overflow-hidden rounded-[14px] bg-black/10 shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
        style={{ height: `${BUBBLE_HEIGHT}px` }}
      >
        {/* Imagen de fondo con gradient */}
        <div className="absolute inset-0 bg-gray-300">
          {item.image ? (
            <Image
              src={item.image}
              alt=""
              fill
              sizes="490px"
              style={{ objectFit: 'cover' }}
              unoptimized
            />
          ) : null}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              // Gradient de transparente (arriba) a casi-negro (abajo) para
              // que el texto superpuesto se lea bien sobre cualquier imagen.
              background:
                'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.72) 75%, rgba(0,0,0,0.94) 100%)',
            }}
          />
        </div>

        {/* Pill walking top-left */}
        {eta ? (
          <div
            className="absolute inline-flex items-center gap-1 rounded-full bg-white"
            style={{ top: '14px', left: '14px', padding: '6px 14px' }}
          >
            <WalkingIcon />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '15px',
                color: '#0b6fbf',
                fontWeight: 600,
              }}
            >
              {eta.minutes} {labels.minWalkingSuffix}
            </span>
          </div>
        ) : null}

        {/* X close top-right */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/35 transition-colors hover:bg-black/55 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{ top: '12px', right: '12px' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M1 1L11 11M11 1L1 11"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Texto */}
        <div
          className="absolute flex flex-col gap-1"
          style={{ left: '24px', right: '170px', bottom: '82px' }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: 600,
              color: '#d6e2a0',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {subcategoryLabel}
          </span>
          <h3
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '28px',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {item.title}
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 600,
              color: '#ffffff',
              margin: 0,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {item.address}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 600,
              color: '#ffffff',
              margin: 0,
            }}
          >
            {item.phone ? `${item.phone}` : null}
            {item.phone && (item.openTodayLabel || item.dateLabel) ? ' | ' : null}
            {item.dateLabel ?? item.openTodayLabel}
          </p>
        </div>

        {/* Columna derecha: mi away + open until */}
        <div
          className="absolute flex flex-col items-end gap-1"
          style={{ right: '24px', bottom: '86px' }}
        >
          {eta ? (
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '17px',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {formatMiAway(eta.distanceMi)} {labels.miAwaySuffix}
            </span>
          ) : null}
          {item.openTodayLabel && !item.dateLabel ? (
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 500,
                color: '#d6e2a0',
              }}
            >
              {item.openTodayLabel}
            </span>
          ) : null}
        </div>

        {/* Botones inferiores */}
        <div
          className="absolute flex items-center overflow-hidden"
          style={{ left: 0, right: 0, bottom: 0, height: '64px' }}
        >
          <button
            type="button"
            onClick={handleSeeMore}
            className="flex-1 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            style={{
              height: '100%',
              backgroundColor: '#0b6fbf',
              color: '#ffffff',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {labels.seeMoreInfo}
          </button>
          <div
            aria-hidden="true"
            style={{ width: '1px', height: '60%', backgroundColor: 'rgba(255,255,255,0.35)' }}
          />
          <button
            type="button"
            onClick={handleAddItinerary}
            aria-pressed={isFavorited}
            className="flex-1 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            style={{
              height: '100%',
              backgroundColor: isFavorited ? '#a4b84a' : '#0b6fbf',
              color: '#ffffff',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {isFavorited ? labels.addedToItinerary : labels.addToItinerary}
          </button>
        </div>
      </div>

      {/* Flecha inferior apuntando al pin */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: `${BUBBLE_WIDTH / 2 - 10}px`,
          top: `${BUBBLE_HEIGHT}px`,
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: `${ARROW_HEIGHT}px solid rgba(0,0,0,0.55)`,
        }}
      />
    </div>
  );
}

function WalkingIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
      <circle cx="6.5" cy="1.5" r="1.5" fill="#0b6fbf" />
      <path
        d="M5 4 L7 4 L8 7 L10 9 L9.3 10 L7 8.3 L7 14 L6 14 L5.5 10 L4 13 L3 12.5 L4.5 9 L5 4 Z"
        fill="#0b6fbf"
      />
    </svg>
  );
}
