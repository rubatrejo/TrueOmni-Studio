'use client';

import { useEffect, useState } from 'react';

import type { WeatherData } from '@/lib/weather';

import { WeatherIcon } from './weather-icon';
import { WeatherPopup } from './weather-popup';

interface Props {
  initialWeather: WeatherData;
  locale: string;
  timezone?: string;
}

/**
 * Weather widget verbatim del SVG designs/Home/Dashboard.svg (Wheater group
 * en (744, 40.5)). Layout en DOS filas:
 *
 *   Fila 1 (baseline y≈28.5): "12:00 PM"  |  "50°"  [icono clima]
 *   Fila 2 (baseline y≈63.5): "Friday, December 10, 2025"
 *
 * Coordenadas locales al Wheater group (verbatim SVG):
 *   - 12:00 PM: x=-6, baseline y=28.5, OpenSans 25px white medium
 *   - Vertical line: x=118.5, y=8, height=25, white 1px
 *   - 50°: x=136, baseline y=29.5, OpenSans 25px white medium
 *   - Icono clima: x=210, y=-3, ~55×40
 *   - Date: x=-6, baseline y=63.5, OpenSans 23px white regular
 *
 * Todo dinámico con timezone Arizona. Click abre popup dentro del frame.
 */
export function WeatherClock({ initialWeather, locale, timezone }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const timeLabel = now.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  });
  const dateLabel = now.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setPopupOpen(true)}
        aria-label="Ver pronóstico de 5 días"
        className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        {/* 12:00 PM. baseline (-6, 28.5) → top ≈ 28.5 - 25*0.82 = 8. */}
        <span
          className="absolute font-sans text-white"
          style={{
            left: '-6px',
            top: '8px',
            fontSize: '25px',
            lineHeight: '1',
            fontWeight: 500,
            letterSpacing: '0.01em',
          }}
        >
          {timeLabel}
        </span>
        {/* Vertical separator line @ (118.5, 8) height 25 */}
        <div
          className="absolute"
          style={{
            left: '118.5px',
            top: '8px',
            width: '1px',
            height: '25px',
            backgroundColor: '#fff',
          }}
        />
        {/* 50° baseline (136, 29.5) → top ≈ 29.5 - 25*0.82 = 9 */}
        <span
          className="absolute font-sans text-white"
          style={{
            left: '136px',
            top: '9px',
            fontSize: '25px',
            lineHeight: '1',
            fontWeight: 500,
          }}
        >
          {initialWeather.currentTempF}°
        </span>
        {/* Icono clima @ (210, -3). Dynamic según weatherCode. */}
        <div className="absolute" style={{ left: '210px', top: '-3px' }}>
          <WeatherIcon code={initialWeather.weatherCode} size={48} color="#fff" strokeWidth={2} />
        </div>
        {/* Date. baseline (-6, 63.5) → top ≈ 63.5 - 23*0.82 = 44.7 */}
        <span
          className="absolute font-sans text-white"
          style={{
            left: '-6px',
            top: '45px',
            fontSize: '23px',
            lineHeight: '1',
            fontWeight: 400,
            whiteSpace: 'nowrap',
          }}
        >
          {dateLabel}
        </span>
      </button>
      {popupOpen ? (
        <WeatherPopup data={initialWeather} onClose={() => setPopupOpen(false)} />
      ) : null}
    </>
  );
}
