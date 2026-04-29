'use client';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { WeatherClock } from '@/components/home/weather-clock';
import type { WeatherData } from '@/lib/weather';

export interface ItineraryHeaderProps {
  weather: WeatherData | null;
  locale: string;
  timezone?: string;
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  /** Tap en la barra de búsqueda → abre el on-screen keyboard. */
  onSearchFocus?: () => void;
}

/**
 * Header del Trip Planner. Banda azul primary 230px de altura con:
 *   - TrueOmniLogo @ (65, 44).
 *   - WeatherClock @ (744, 40).
 *   - Title (col1) + Searchbar (col2) en una segunda fila.
 *
 * Coords aproximadas del SVG `Trip Planner-Start.svg`. El pulido pixel-
 * perfect se aplica en sub-fase 3.17-13.
 */
export function ItineraryHeader(props: ItineraryHeaderProps) {
  const {
    weather,
    locale,
    timezone,
    title,
    searchPlaceholder,
    searchValue,
    onSearchChange,
    onSearchFocus,
  } = props;

  return (
    <div
      className="absolute left-0 top-0 w-[1080px] text-white"
      style={{
        height: 230,
        backgroundColor: 'hsl(var(--itinerary-toolbar-bg))',
        zIndex: 10,
      }}
    >
      <div className="absolute" style={{ left: 65, top: 44 }}>
        <TrueOmniLogo className="h-[70px] w-auto text-white" />
      </div>
      <div className="absolute" style={{ left: 744, top: 40, width: 300, height: 85 }}>
        {weather ? (
          <WeatherClock initialWeather={weather} locale={locale} timezone={timezone} />
        ) : null}
      </div>

      <div
        className="absolute flex items-center"
        style={{ left: 65, top: 145, right: 65, gap: 24 }}
      >
        <h1 className="text-[34px] font-bold tracking-tight whitespace-nowrap">{title}</h1>
        <div
          className="relative ml-auto flex h-[56px] w-[620px] items-center rounded-full bg-white/95 px-6"
          style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            className="mr-3 text-zinc-400"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
            <path
              d="M20 20l-3.6-3.6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={onSearchFocus}
            onClick={onSearchFocus}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            readOnly={!!onSearchFocus}
            className="flex-1 cursor-pointer bg-transparent text-[18px] text-foreground placeholder:text-zinc-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
