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

/** Isotipo TrueOmni verbatim del SVG Adobe XD. Mismos paths que usa el
 *  SignageHeader del producto Digital Displays. Brand identity de
 *  TrueOmni, los dos puntos `#0088ce` cyan se preservan literal — no
 *  son tokens del cliente. */
function TrueOmniLogoInline({ height }: { height: number }) {
  const width = Math.round(height * (316 / 58));
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 316 58"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TrueOmni"
      style={{ display: 'block' }}
    >
      <g>
        <path
          d="M209.257,30.981h-11.8V61.61h-7.124V30.981h.069V24.688h18.86Z"
          transform="translate(-103.941 -13.483)"
          fill="hsl(var(--signage-header-text, 0 0% 100%))"
        />
        <path
          d="M247.114,51.593a13.748,13.748,0,0,0-5.672,1.224,7.152,7.152,0,0,0-3.584,3.508V72.81H230.89V45.56h6.4v5.825A12.422,12.422,0,0,1,239,48.863a13.2,13.2,0,0,1,2.132-1.949,9.868,9.868,0,0,1,2.314-1.274,6.386,6.386,0,0,1,2.262-.442h.857a2.836,2.836,0,0,1,.545.051Z"
          transform="translate(-126.092 -24.683)"
          fill="hsl(var(--signage-header-text, 0 0% 100%))"
        />
        <path
          d="M286.1,73.768a7.735,7.735,0,0,1-6.4-2.7q-2.183-2.7-2.184-8.008V46h6.968V61.549q0,6.293,4.524,6.293a7.156,7.156,0,0,0,3.927-1.222,8.783,8.783,0,0,0,3.094-3.718V46H303V65.239a2.448,2.448,0,0,0,.393,1.56,1.7,1.7,0,0,0,1.274.524v5.928a14.853,14.853,0,0,1-1.742.262c-.468.034-.893.052-1.274.052a5.017,5.017,0,0,1-3.042-.859,3.376,3.376,0,0,1-1.378-2.36l-.156-2.184a11.619,11.619,0,0,1-4.68,4.212,14.079,14.079,0,0,1-6.293,1.4"
          transform="translate(-151.559 -25.121)"
          fill="hsl(var(--signage-header-text, 0 0% 100%))"
        />
        <path
          d="M362.336,73.206a15.13,15.13,0,0,1-5.928-1.118A13.372,13.372,0,0,1,349,64.573a14.342,14.342,0,0,1-1.014-5.357,15.172,15.172,0,0,1,.989-5.487,13.385,13.385,0,0,1,2.859-4.524,13.647,13.647,0,0,1,4.551-3.094,15.152,15.152,0,0,1,6.007-1.145,14.775,14.775,0,0,1,5.955,1.145,13.711,13.711,0,0,1,4.472,3.068,13.068,13.068,0,0,1,2.808,4.472,14.91,14.91,0,0,1,.962,5.3q0,.676-.026,1.3a5.344,5.344,0,0,1-.131,1.04H355.366a8.077,8.077,0,0,0,.787,2.859A7,7,0,0,0,360,67.639a7.35,7.35,0,0,0,2.6.468,8.041,8.041,0,0,0,3.933-1.013,5.375,5.375,0,0,0,2.521-2.678l5.981,1.665a12.155,12.155,0,0,1-4.81,5.122,14.91,14.91,0,0,1-7.878,2m7.073-16.432a7.25,7.25,0,0,0-2.261-4.914,7.028,7.028,0,0,0-11.18,2.158,7.5,7.5,0,0,0-.7,2.753Z"
          transform="translate(-190.04 -24.559)"
          fill="hsl(var(--signage-header-text, 0 0% 100%))"
        />
        <path
          d="M438.576,61.557a15.265,15.265,0,0,1-7.021-1.611,18.121,18.121,0,0,1-5.461-4.212,18.815,18.815,0,0,1-3.54-5.981,19.82,19.82,0,0,1-1.248-6.916,19.193,19.193,0,0,1,1.33-7.073,19.779,19.779,0,0,1,3.641-5.981,17.418,17.418,0,0,1,5.487-4.134,15.556,15.556,0,0,1,6.865-1.534,15.229,15.229,0,0,1,7.047,1.637,17.7,17.7,0,0,1,5.46,4.29,19.829,19.829,0,0,1,3.51,6.006,19.554,19.554,0,0,1-3.718,19.867,17.617,17.617,0,0,1-5.487,4.107,15.555,15.555,0,0,1-6.865,1.534M423.963,42.835a17.763,17.763,0,0,0,1.066,6.111,16.482,16.482,0,0,0,3.015,5.2,14.842,14.842,0,0,0,4.659,3.616,13.058,13.058,0,0,0,5.928,1.352,12.742,12.742,0,0,0,6.006-1.4,14.662,14.662,0,0,0,4.577-3.718A17.629,17.629,0,0,0,452.1,36.726a16.912,16.912,0,0,0-3.042-5.2,15.053,15.053,0,0,0-4.6-3.613,12.636,12.636,0,0,0-5.825-1.352,12.893,12.893,0,0,0-6.031,1.4,14.858,14.858,0,0,0-4.628,3.718,17.081,17.081,0,0,0-2.964,5.227,17.481,17.481,0,0,0-1.041,5.928"
          transform="translate(-230.086 -13.169)"
          fill="hsl(var(--signage-header-text, 0 0% 100%))"
        />
        <path
          d="M551.781,72.941h-2.6V57.864q0-5.147-1.586-7.592a5.393,5.393,0,0,0-4.863-2.444,8.21,8.21,0,0,0-3.173.624,9.609,9.609,0,0,0-2.753,1.742,11.229,11.229,0,0,0-2.158,2.652,13.952,13.952,0,0,0-1.43,3.409V72.941h-2.6V57.864q0-5.2-1.56-7.618a5.348,5.348,0,0,0-4.836-2.419,8.334,8.334,0,0,0-3.147.6,9.272,9.272,0,0,0-2.731,1.716,12.323,12.323,0,0,0-2.21,2.652,12.807,12.807,0,0,0-1.483,3.409V72.941h-2.6V45.9h2.444v6.446a13.167,13.167,0,0,1,4.368-5.1,10.478,10.478,0,0,1,5.981-1.82,7.735,7.735,0,0,1,5.564,2.028,8.553,8.553,0,0,1,2.554,5.306q3.848-7.333,10.609-7.333a6.8,6.8,0,0,1,6.319,3.146,17.121,17.121,0,0,1,1.9,8.815Z"
          transform="translate(-279.64 -24.813)"
          fill="hsl(var(--signage-header-text, 0 0% 100%))"
        />
        <path
          d="M639.56,72.936h-2.6V57.859q0-5.251-1.483-7.643a5.128,5.128,0,0,0-4.705-2.393,9.763,9.763,0,0,0-3.409.624,11.525,11.525,0,0,0-3.147,1.769,12.908,12.908,0,0,0-2.549,2.678,11.03,11.03,0,0,0-1.612,3.3V72.936h-2.6V45.895H619.9v6.446a12.707,12.707,0,0,1,2.054-2.834,12.948,12.948,0,0,1,2.753-2.184,13.9,13.9,0,0,1,3.255-1.405,12.729,12.729,0,0,1,3.54-.494q4.419,0,6.24,3.094a17.673,17.673,0,0,1,1.82,8.866Z"
          transform="translate(-337.206 -24.808)"
          fill="hsl(var(--signage-header-text, 0 0% 100%))"
        />
        <rect
          width="2.6"
          height="27.041"
          transform="translate(310.466 21.087)"
          fill="hsl(var(--signage-header-text, 0 0% 100%))"
        />
        <path
          d="M56.969,85.458a10.374,10.374,0,0,1-5.192-1.392l-8.146,8.15a21.7,21.7,0,0,0,26.863-.139l-8.128-8.128a10.373,10.373,0,0,1-5.4,1.51"
          transform="translate(-23.828 -45.846)"
          fill="hsl(var(--signage-header-text, 0 0% 100%))"
        />
        <path
          d="M57,16.305a21.658,21.658,0,0,0-13.317,4.573l8.149,8.149a10.373,10.373,0,0,1,10.537.122l8.128-8.128a21.67,21.67,0,0,0-13.5-4.712"
          transform="translate(-23.854 -8.904)"
          fill="hsl(var(--signage-header-text, 0 0% 100%))"
        />
        <path
          d="M103.9,37.758a21.57,21.57,0,0,0,0-17.155L117.165,0l-16.04,15.888-.033-.046-8.148,8.149a10.383,10.383,0,0,1,.014,10.357h-.014l1.725,1.7,6.44,6.44.026-.035,16.03,15.883Z"
          transform="translate(-50.758)"
          fill="hsl(var(--signage-header-text, 0 0% 100%))"
        />
        <path
          d="M13.261,37.758a21.57,21.57,0,0,1,0-17.155L0,0,16.04,15.888l.033-.046,8.148,8.149a10.383,10.383,0,0,0-.014,10.357h.014l-1.725,1.7-6.44,6.44-.026-.035L0,58.341Z"
          fill="hsl(var(--signage-header-text, 0 0% 100%))"
        />
        <path
          d="M175.794,27.554a3.738,3.738,0,1,1-3.738-3.738,3.738,3.738,0,0,1,3.738,3.738"
          transform="translate(-91.922 -13.007)"
          fill="#0088ce"
        />
        <path
          d="M686.49,28.487a3.738,3.738,0,1,1-3.738-3.738,3.738,3.738,0,0,1,3.738,3.738"
          transform="translate(-370.822 -13.519)"
          fill="#0088ce"
        />
      </g>
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
