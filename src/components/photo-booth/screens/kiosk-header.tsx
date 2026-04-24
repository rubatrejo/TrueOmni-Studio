'use client';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { WeatherClock } from '@/components/home/weather-clock';
import type { WeatherData } from '@/lib/weather';

interface KioskHeaderProps {
  weather: WeatherData;
  locale: string;
  timezone?: string;
}

/**
 * Header del Photo Booth que reutiliza los componentes estándar del kiosk
 * (`TrueOmniLogo` + `WeatherClock`) en las mismas coords que el Home. Se
 * renderiza transparente encima de la live camera con un gradient azul
 * suave para legibilidad del logo/weather.
 *
 * Coords verbatim del SVG `0-Photo_Booth-Start.svg`:
 *   - Logo @ (65, 44).
 *   - Weather + clock @ (744, 40).
 */
export function KioskHeader({ weather, locale, timezone }: KioskHeaderProps) {
  return (
    <>
      {/* Gradient overlay transparent → azul oscuro para legibilidad */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: 0,
          top: 0,
          width: 1080,
          height: 397,
          background:
            'linear-gradient(180deg, rgba(0,79,139,0.9) 0%, rgba(0,79,139,0.55) 30%, rgba(0,79,139,0) 100%)',
        }}
      />
      <div className="absolute" style={{ left: 65, top: 44 }}>
        <TrueOmniLogo className="h-[70px] w-auto text-white" />
      </div>
      <div
        className="absolute"
        style={{ left: 744, top: 40, width: 300, height: 85 }}
      >
        <WeatherClock initialWeather={weather} locale={locale} timezone={timezone} />
      </div>
    </>
  );
}
