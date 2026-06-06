'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';

import { useItineraryRail } from '@/lib/itinerary-favorites';

/** Bookmark (mismo glifo del header del grid de listings). `size` = altura. */
function BookmarkGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size * 0.8417}
      height={size}
      viewBox="0 0 44.192 52.507"
      fill="currentColor"
      aria-hidden
    >
      <g transform="translate(-32.26 -28.91)">
        <g transform="translate(32.26 28.91)">
          <path
            d="M68.423,80.372l.2.162a5,5,0,0,0,7.83-4.1V36.379a7.475,7.475,0,0,0-7.469-7.469H39.729a7.475,7.475,0,0,0-7.469,7.469V76.438a4.979,4.979,0,0,0,7.818,4.083,1.257,1.257,0,0,0,.2-.162L54.343,68.284Z"
            transform="translate(-32.26 -28.91)"
          />
        </g>
      </g>
    </svg>
  );
}

/**
 * Botón "Saved trip" para los headers de las pantallas de listings
 * (Restaurants, Stay, Things to Do, Events, Tickets…). Navega al Trip Planner
 * para ver los listings agregados al itinerario y muestra un badge con el número
 * de items guardados (`useItineraryRail().count`), con el mismo estilo de badge
 * que el icono de notificaciones del Dashboard. El padre posiciona el botón vía
 * `className`/`style`.
 */
export function SavedTripButton({
  size = 24,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const router = useRouter();
  const { count } = useItineraryRail();
  return (
    <button
      type="button"
      aria-label="Saved trip"
      onClick={() => router.push('/pwa/trip-planner')}
      className={`relative text-white ${className ?? ''}`}
      style={style}
    >
      <BookmarkGlyph size={size} />
      {count > 0 ? (
        <span
          className="absolute flex items-center justify-center rounded-full font-bold text-white"
          style={{
            top: -5,
            right: -6,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            fontSize: 10,
            lineHeight: 1,
            backgroundColor: 'hsl(var(--pwa-favorite))',
            fontFamily: 'var(--font-open-sans)',
          }}
        >
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </button>
  );
}
