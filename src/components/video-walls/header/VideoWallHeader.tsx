'use client';

import { useEffect, useState } from 'react';

import { formatSignageClock, formatSignageDate } from '@/lib/signage/dates';
import type { SignageHeaderWeather } from '@/lib/signage/weather-adapter';
import { canvasDimensionsOf, HEADER_H, type GridConfig } from '@/lib/video-walls/dimensions';
import type { VideoWallClientResolved } from '@/lib/video-walls/schema';

/**
 * <VideoWallHeader> — banda top continua del producto Video Walls.
 *
 * Layout verbatim de los SVGs Adobe XD del catálogo 3×2:
 *   - Canvas: `cols × 1920 × 335 px`. Background `--signage-header-bg`.
 *   - Logo cliente: x=80, y=92, alto ~165px.
 *   - Weather: x=2198, y=38. Current temp grande + 3 forecast cards.
 *     (En grids más anchos como 4×2 el bloque se desliza al centro
 *     proporcionalmente.)
 *   - Clock + date: x derecha-5277 desde el borde izquierdo del XD del
 *     3×2 (= 483px del borde derecho del canvas 5760). Para grids
 *     distintos lo anclamos a `right: 483px`.
 *
 * Reusa CSS vars del cliente (--signage-* tokens) para colores. El XD
 * usa `#004f8b` que coincide con el header signage del cliente default.
 *
 * Cells (0,*) muestran su porción 1920×335 top + 1920×745 body. Cells
 * (1+, *) NO ven header — `cellRectToPx` ajusta el offset.
 */
export interface VideoWallHeaderProps {
  client: VideoWallClientResolved;
  weather: SignageHeaderWeather;
  grid: GridConfig;
}

export function VideoWallHeader({ client, weather, grid }: VideoWallHeaderProps) {
  const { width: canvasW } = canvasDimensionsOf(grid);

  // Clock + date actualizados en vivo (re-render cada minuto).
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const clockText = formatSignageClock(
    now,
    client.locale,
    client.timezone,
    client.header.clockFormat,
  );
  const dateText = formatSignageDate(now, client.locale, client.timezone);

  // Logo resolution (igual que SignageHeader).
  const logoRel = client.branding.logos?.default ?? '';
  const isExternalLogo =
    logoRel.startsWith('http') || logoRel.startsWith('/') || logoRel.startsWith('data:');
  const hasCustomLogo = !!logoRel && (isExternalLogo || logoRel !== 'assets/logo.svg');
  const resolvedLogoSrc = hasCustomLogo
    ? isExternalLogo
      ? logoRel
      : `/signage-assets/${client.slug}/${logoRel}`
    : null;

  // Forecast cards (cap a 3 — el XD del 3×2 muestra exactamente 3).
  const forecasts = weather.forecast.slice(0, 3);
  // Center the weather block: en 3×2 está en x=2198. Para mantener
  // proporción en otros grids, centramos al canvas total.
  // Pero al ser pixel-perfect contra 3×2, mantenemos x=2198 cuando cols=3.
  const weatherLeft = grid === '3x2' ? 2198 : Math.round(canvasW / 2 - 600);

  // Clock anchor right: en 3×2 el clock empieza en x=5277, canvas=5760
  // → right offset = 483. Aplicable a cualquier grid manteniendo el
  // mismo padding desde el borde derecho.
  const clockRight = 483;

  return (
    <div
      className="pointer-events-none absolute left-0 top-0"
      style={{
        width: canvasW,
        height: HEADER_H,
        zIndex: 20,
        backgroundColor: 'hsl(var(--signage-header-bg, 210 100% 27%))',
        color: 'hsl(var(--signage-header-text, 0 0% 100%))',
        fontFamily: 'var(--signage-font-body, "Open Sans"), system-ui, sans-serif',
      }}
    >
      {/* Logo zone: x=80, y=92 */}
      <div className="absolute" style={{ left: 80, top: 92, height: 165 }}>
        {resolvedLogoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedLogoSrc}
            alt={client.name}
            style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
          />
        ) : (
          <TrueOmniLogoInline height={165} />
        )}
      </div>

      {/* Weather zone: x=2198, y=38 */}
      <div
        className="absolute"
        style={{ left: weatherLeft, top: 38, display: 'flex', alignItems: 'flex-start', gap: 40 }}
      >
        <div
          style={{
            fontFamily: 'var(--signage-font-display, "Montserrat"), system-ui, sans-serif',
            fontSize: 180,
            fontWeight: 700,
            lineHeight: 1,
            color: 'hsl(var(--signage-header-text, 0 0% 100%))',
          }}
        >
          {weather.currentTempText}
        </div>
        {forecasts.map((f, i) => (
          <ForecastCard key={i} forecast={f} />
        ))}
      </div>

      {/* Clock zone: right-anchored */}
      <div className="absolute" style={{ right: clockRight, top: 61, textAlign: 'right' }}>
        <div
          style={{
            fontFamily: 'var(--signage-font-display, "Montserrat"), system-ui, sans-serif',
            fontSize: 92,
            fontWeight: 700,
            lineHeight: 1,
            color: 'hsl(var(--signage-header-text, 0 0% 100%))',
          }}
        >
          {clockText}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 72,
            fontWeight: 400,
            lineHeight: 1,
            opacity: 0.85,
            color: 'hsl(var(--signage-header-text, 0 0% 100%))',
          }}
        >
          {dateText}
        </div>
      </div>
    </div>
  );
}

function ForecastCard({ forecast }: { forecast: SignageHeaderWeather['forecast'][number] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          fontFamily: 'var(--signage-font-display, "Montserrat"), system-ui, sans-serif',
          fontSize: 96,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {forecast.dayLabel}
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 48, fontWeight: 600 }}>
        <span>{forecast.highText}</span>
        <span style={{ opacity: 0.65 }}>{forecast.lowText}</span>
      </div>
    </div>
  );
}

/** Inline isotipo + wordmark "TrueOmni" en blanco. Cuando el cliente
 *  no tiene logo custom, se pinta este como fallback. Brand identity
 *  de TrueOmni, no del cliente. */
function TrueOmniLogoInline({ height }: { height: number }) {
  // Aspect ratio aproximado del isotipo + wordmark: 5:1.
  return (
    <svg
      height={height}
      viewBox="0 0 500 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
      aria-label="TrueOmni"
    >
      {/* Isotipo: dos diamantes superpuestos */}
      <g fill="currentColor">
        <path d="M 20 50 L 50 20 L 80 50 L 50 80 Z" />
        <circle cx="50" cy="50" r="10" fill="#0088ce" />
      </g>
      {/* Wordmark */}
      <text
        x="100"
        y="68"
        fontFamily="Montserrat, system-ui, sans-serif"
        fontSize="56"
        fontWeight="700"
        fill="currentColor"
      >
        TrueOmni
      </text>
    </svg>
  );
}

/** Sentinel para callers que NO tienen weather resuelto. */
export const PLACEHOLDER_WEATHER: SignageHeaderWeather = {
  currentTempText: '--°',
  currentWeatherCode: null,
  forecast: [
    { dayLabel: 'FRI', highText: '--°', lowText: '--°', weatherCode: null },
    { dayLabel: 'SAT', highText: '--°', lowText: '--°', weatherCode: null },
    { dayLabel: 'SUN', highText: '--°', lowText: '--°', weatherCode: null },
  ],
};
