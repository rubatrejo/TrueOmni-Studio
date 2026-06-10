'use client';

import { useEffect, useState, type CSSProperties } from 'react';

import { formatSignageClock, formatSignageDate } from '@/lib/signage/dates';
import type { SignageHeaderBackground } from '@/lib/signage/schema';
import type { SignageHeaderWeather } from '@/lib/signage/weather-adapter';
import { canvasDimensionsOf, HEADER_H, type GridConfig } from '@/lib/video-walls/dimensions';
import type { VideoWallClientResolved } from '@/lib/video-walls/schema';

/**
 * `<VideoWallHeader>` — header del runtime Video Walls.
 *
 * Layout HTML + flex (mismo patrón que el SignageHeader del DD) con 3 zonas
 * absolutamente posicionadas dentro del header:
 *   - `<LogoZone>`  con `header.layout` (logo-left/center/right).
 *   - `<WeatherZone>` con `header.weatherPlacement` (left/center/right).
 *   - `<ClockZone>` con `header.clockPlacement` (left/center/right).
 *
 * Respeta todos los toggles del editor:
 *   - `showLogo`, `showWeather`, `showClock`
 *   - `position`: top/bottom
 *   - `background`: color | gradient | image
 *   - `forecastDays`: 1 | 3 | 5
 *
 * Header height fijo `HEADER_H=335` (2.16× del DD landscape 155 para que
 * texto/iconos sean legibles a 5760×2160 vistos desde lejos).
 */
export interface VideoWallHeaderProps {
  client: VideoWallClientResolved;
  weather: SignageHeaderWeather;
  grid: GridConfig;
}

const PADDING_X_BASE = 80;
const PADDING_Y = 38;
/** Factor de escala vs SignageHeader del DD (HEADER_HEIGHT=155). VW=335 →
 *  335/155 = 2.16. Los tamaños base del DD escalados por esto. */
const SCALE = 335 / 155;
/** Canvas baseline del header — 3x2 (5760×335). Otros grids escalan el
 *  spacing horizontal proporcionalmente para que las 3 zonas
 *  (logo/weather/clock) no se solapen en el grid más angosto (2x2: 3840) ni
 *  queden muy separadas en el más ancho (4x2: 7680). */
const BASE_CANVAS_W = 5760;

/**
 * Factor de escala horizontal aplicado a padding lateral y gaps internos.
 * Cap a 1.0 — el baseline ya es generoso y aumentar más no aporta legibilidad.
 * Los grids vivos (2x2/3x2/4x2) dan ratios 0.667–1.0; el grid 1x2 (que habría
 * necesitado un floor) fue retirado del catálogo.
 */
function horizontalScaleFor(canvasW: number): number {
  return Math.min(1, canvasW / BASE_CANVAS_W);
}

/** Weather placeholder usado por el runtime cuando no se pasa weather real. */
export const PLACEHOLDER_WEATHER: SignageHeaderWeather = {
  currentTempText: '--°',
  currentWeatherCode: null,
  forecast: [
    { dayLabel: '---', highText: '--°', lowText: '--°', weatherCode: null },
    { dayLabel: '---', highText: '--°', lowText: '--°', weatherCode: null },
    { dayLabel: '---', highText: '--°', lowText: '--°', weatherCode: null },
  ],
};

export function VideoWallHeader({ client, weather, grid }: VideoWallHeaderProps) {
  const { width: canvasW } = canvasDimensionsOf(grid);
  const widthScale = horizontalScaleFor(canvasW);
  const paddingX = Math.round(PADDING_X_BASE * widthScale);

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const clockText = formatSignageClock(
    now,
    client.locale,
    client.timezone,
    client.header.clockFormat,
  );
  const dateText = formatSignageDate(now, client.locale, client.timezone);

  const logoRel = client.branding.logos?.default ?? '';
  const isExternalLogo =
    logoRel.startsWith('http') || logoRel.startsWith('/') || logoRel.startsWith('data:');
  const hasCustomLogo = !!logoRel && (isExternalLogo || logoRel !== 'assets/logo.svg');
  const resolvedLogoSrc = hasCustomLogo
    ? isExternalLogo
      ? logoRel
      : `/signage-assets/${client.slug}/${logoRel}`
    : null;

  const header = client.header;
  const headerPosition = header.position ?? 'top';
  const verticalAnchor: CSSProperties = headerPosition === 'bottom' ? { bottom: 0 } : { top: 0 };

  // forecastDays — el schema permite 0/1/3/5; mapeo 0 → 1 para que siempre haya al menos 1.
  // Se pasa tal cual: el `forecastBlockScale = 0.75` (WeatherZone) ajusta el tamaño de las
  // cards cuando son 5, sin necesidad de recortar días por ancho de canvas.
  const rawForecastDays = header.forecastDays as 0 | 1 | 3 | 5;
  const forecastDays: 1 | 3 | 5 = rawForecastDays === 0 ? 1 : rawForecastDays;

  return (
    <div
      className="pointer-events-none absolute left-0"
      style={{
        width: canvasW,
        height: HEADER_H,
        zIndex: 20,
        color: 'hsl(var(--signage-header-text, 0 0% 100%))',
        ...verticalAnchor,
        ...resolveBackgroundCss(header.background),
      }}
      data-vw-header-position={headerPosition}
    >
      {/* Border 1px stroke #707070 verbatim XD */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '1px solid #707070',
          pointerEvents: 'none',
        }}
        aria-hidden
      />
      {header.showLogo ? (
        <LogoZone
          placement={header.layout}
          customSrc={resolvedLogoSrc}
          paddingX={paddingX}
          widthScale={widthScale}
          canvasW={canvasW}
        />
      ) : null}
      {header.showWeather ? (
        <WeatherZone
          placement={header.weatherPlacement ?? 'center'}
          weather={weather}
          forecastDays={forecastDays}
          paddingX={paddingX}
          widthScale={widthScale}
        />
      ) : null}
      {header.showClock ? (
        <ClockZone
          placement={header.clockPlacement ?? 'right'}
          clockText={clockText}
          dateText={dateText}
          paddingX={paddingX}
          widthScale={widthScale}
        />
      ) : null}
    </div>
  );
}

function placementToCss(placement: 'left' | 'center' | 'right', paddingX: number): CSSProperties {
  const base: CSSProperties = {
    position: 'absolute',
    top: PADDING_Y,
    bottom: PADDING_Y,
    display: 'flex',
    alignItems: 'center',
  };
  if (placement === 'left') return { ...base, left: paddingX };
  if (placement === 'right') return { ...base, right: paddingX };
  return { ...base, left: '50%', transform: 'translateX(-50%)' };
}

function LogoZone({
  placement,
  customSrc,
  paddingX,
  widthScale,
  canvasW,
}: {
  placement: 'logo-left' | 'logo-center' | 'logo-right';
  customSrc: string | null;
  paddingX: number;
  widthScale: number;
  canvasW: number;
}) {
  const simple: 'left' | 'center' | 'right' =
    placement === 'logo-center' ? 'center' : placement === 'logo-right' ? 'right' : 'left';
  // Logo height escala con widthScale para que en el grid más angosto (2x2)
  // no domine el header. Antes era fijo 0.45 * HEADER_H = 151px, y con el
  // isotipo TrueOmni (aspect 5.46:1) el logo ocupaba demasiado del canvas →
  // overlap con weather/clock.
  const baseLogoHeight = HEADER_H * 0.45;
  const logoHeight = Math.round(baseLogoHeight * widthScale);
  // Cap del ancho del logo al 30% del canvas para que nunca invada las
  // otras zonas, sin importar el aspect del logo custom.
  const maxLogoWidth = Math.floor(canvasW * 0.3);
  return (
    <div style={placementToCss(simple, paddingX)}>
      <div
        style={{
          height: logoHeight,
          maxWidth: maxLogoWidth,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {customSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={customSrc}
            alt=""
            style={{
              height: '100%',
              maxWidth: '100%',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        ) : (
          <TrueOmniIsotipo height={logoHeight} />
        )}
      </div>
    </div>
  );
}

function WeatherZone({
  placement,
  weather,
  forecastDays,
  paddingX,
  widthScale,
}: {
  placement: 'left' | 'center' | 'right';
  weather: SignageHeaderWeather;
  forecastDays: 1 | 3 | 5;
  paddingX: number;
  widthScale: number;
}) {
  const forecastBlockScale = forecastDays === 5 ? 0.75 : 1;
  // Escalar TODO el weather (no solo gaps/dividers) por widthScale para que en
  // el grid más angosto (2x2) el "73°" no se monte con el logo. Antes los font
  // sizes eran independientes del canvas width → en grids angostos el texto era
  // demasiado grande relativo al espacio.
  const totalScale = SCALE * forecastBlockScale * widthScale;
  const tempFontSize = Math.round(64 * totalScale);
  // Gap horizontal entre forecast cards — escalado por widthScale para
  // que no queden separadas excesivamente en grids angostos. Mantiene el
  // tamaño de tipografía (legibilidad) pero comprime el spacing.
  const gap = Math.round(28 * totalScale * widthScale);
  const dividerH = Math.round(88 * totalScale);

  return (
    <div
      style={{
        gap,
        whiteSpace: 'nowrap',
        fontFamily: "'Open Sans', system-ui, sans-serif",
        ...placementToCss(placement, paddingX),
      }}
    >
      <span style={{ fontSize: tempFontSize, fontWeight: 700, lineHeight: 1 }}>
        {weather.currentTempText}
      </span>
      {weather.forecast.slice(0, forecastDays).map((f, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap }}>
          <Divider height={dividerH} />
          <ForecastCard
            dayLabel={f.dayLabel}
            highText={f.highText}
            lowText={f.lowText}
            weatherCode={f.weatherCode}
            scale={totalScale}
          />
        </div>
      ))}
    </div>
  );
}

function ForecastCard({
  dayLabel,
  highText,
  lowText,
  weatherCode,
  scale,
}: {
  dayLabel: string;
  highText: string;
  lowText: string;
  weatherCode: number | null;
  scale: number;
}) {
  const dayFs = Math.round(40 * scale);
  const tempFs = Math.round(22 * scale);
  const iconSize = Math.round(44 * scale);
  const rowGap = Math.round(4 * scale);
  const inlineGap = Math.round(14 * scale);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: rowGap,
        lineHeight: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: inlineGap }}>
        <span style={{ fontSize: dayFs, fontWeight: 800, letterSpacing: 0.5 }}>{dayLabel}</span>
        <WeatherIcon code={weatherCode} size={iconSize} />
      </div>
      <div style={{ fontSize: tempFs, display: 'flex', gap: Math.round(10 * scale) }}>
        <span style={{ fontWeight: 700 }}>{highText}</span>
        <span style={{ fontWeight: 400, opacity: 0.7 }}>{lowText}</span>
      </div>
    </div>
  );
}

function Divider({ height }: { height: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 4,
        height,
        borderRadius: 2,
        backgroundColor: 'currentColor',
        opacity: 0.55,
      }}
    />
  );
}

function ClockZone({
  placement,
  clockText,
  dateText,
  paddingX,
  widthScale,
}: {
  placement: 'left' | 'center' | 'right';
  clockText: string;
  dateText: string;
  paddingX: number;
  widthScale: number;
}) {
  // Mismo razonamiento que WeatherZone — escalar fonts por widthScale para
  // canvas estrechos (mínimo vivo 2x2 → widthScale 0.667).
  const clockScale = SCALE * widthScale;
  const clockFs = Math.round(42 * clockScale);
  const dateFs = Math.round(28 * clockScale);
  const textAlign: CSSProperties['textAlign'] =
    placement === 'left' ? 'left' : placement === 'right' ? 'right' : 'center';
  return (
    <div
      style={{
        textAlign,
        lineHeight: 1.15,
        fontFamily: "'Open Sans', system-ui, sans-serif",
        ...placementToCss(placement, paddingX),
      }}
    >
      <div>
        <div style={{ fontSize: clockFs, fontWeight: 700 }}>{clockText}</div>
        <div style={{ fontSize: dateFs, fontWeight: 500, opacity: 0.95 }}>{dateText}</div>
      </div>
    </div>
  );
}

function resolveBackgroundCss(bg: SignageHeaderBackground | undefined): CSSProperties {
  if (!bg) return { backgroundColor: 'hsl(var(--signage-header-bg, 210 100% 27%))' };
  if (bg.kind === 'color') {
    return { backgroundColor: bg.color };
  }
  if (bg.kind === 'gradient') {
    return {
      backgroundImage: `linear-gradient(${bg.angle ?? 180}deg, ${bg.from}, ${bg.to})`,
    };
  }
  if (bg.kind === 'image') {
    return {
      backgroundImage: `url(${bg.src})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { backgroundColor: 'hsl(var(--signage-header-bg, 210 100% 27%))' };
}

// ---------------------------------------------------------------------------
//  Weather icons (mismo set que SignageHeader)
// ---------------------------------------------------------------------------

function WeatherIcon({ code, size }: { code: number | null; size: number }) {
  const kind = pickIconKind(code);
  if (kind === 'sun') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <circle cx="12" cy="12" r="4.2" />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
          <line x1="18.4" y1="18.4" x2="19.8" y2="19.8" />
          <line x1="4.2" y1="19.8" x2="5.6" y2="18.4" />
          <line x1="18.4" y1="5.6" x2="19.8" y2="4.2" />
        </g>
      </svg>
    );
  }
  if (kind === 'sun-cloud') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="8" cy="9" r="3" fill="currentColor" stroke="none" />
        <line x1="8" y1="2" x2="8" y2="3.6" />
        <line x1="2" y1="9" x2="3.4" y2="9" />
        <line x1="3.5" y1="4.5" x2="4.5" y2="5.5" />
        <line x1="12.5" y1="4.5" x2="11.5" y2="5.5" />
        <path
          d="M10 18a3.5 3.5 0 0 1-.5-6.96 5 5 0 0 1 9.85.96A3 3 0 1 1 18.5 18H10Z"
          fill="none"
        />
      </svg>
    );
  }
  if (kind === 'rain') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M7 14a4 4 0 0 1-.6-7.95 5.5 5.5 0 0 1 10.85.95A3.5 3.5 0 1 1 17.5 14H7Z" />
        <line x1="9" y1="17" x2="8" y2="20" />
        <line x1="13" y1="17" x2="12" y2="20" />
        <line x1="17" y1="17" x2="16" y2="20" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 18a4 4 0 0 1-.6-7.95 5.5 5.5 0 0 1 10.85.95A3.5 3.5 0 1 1 17.5 18H7Z" />
    </svg>
  );
}

function pickIconKind(code: number | null): 'sun' | 'sun-cloud' | 'cloud' | 'rain' {
  if (code == null) return 'sun-cloud';
  if (code === 0 || code === 1) return 'sun';
  if (code === 2 || code === 3) return 'sun-cloud';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 99) || code === 95) return 'rain';
  return 'cloud';
}

// ---------------------------------------------------------------------------
//  TrueOmni isotipo (fallback cuando no hay logo custom)
// ---------------------------------------------------------------------------

function TrueOmniIsotipo({ height }: { height: number }) {
  // Aspect ratio del isotipo TrueOmni = 819 / 150 = 5.46.
  const width = Math.round(height * (819 / 150));
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 819 150"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M272.984,61.664a35.891,35.891,0,0,0-14.706,3.147,18.488,18.488,0,0,0-9.31,9.036v42.44h-18.08V46.133h16.6v15a31.96,31.96,0,0,1,4.452-6.493,34.141,34.141,0,0,1,5.531-5.02,25.663,25.663,0,0,1,6-3.28,16.682,16.682,0,0,1,5.869-1.138h2.226a7.413,7.413,0,0,1,1.417.133Z"
        transform="translate(41.006 7.617)"
      />
      <path
        d="M299.782,117.49q-10.929,0-16.6-6.962T277.52,89.911V46H295.6V86.028q0,16.2,11.738,16.2a18.667,18.667,0,0,0,10.186-3.147,22.658,22.658,0,0,0,8.028-9.572V46h18.081V95.534a6.266,6.266,0,0,0,1.012,4.016,4.438,4.438,0,0,0,3.306,1.339v15.262a38.8,38.8,0,0,1-4.52.67c-1.215.088-2.317.134-3.307.134a13.09,13.09,0,0,1-7.892-2.21,8.678,8.678,0,0,1-3.575-6.091l-.405-5.623a30.064,30.064,0,0,1-12.143,10.844,36.764,36.764,0,0,1-16.325,3.615"
        transform="translate(49.284 7.751)"
      />
      <path
        d="M385.221,117.664a39.519,39.519,0,0,1-15.38-2.878,35.275,35.275,0,0,1-11.738-7.832,34.705,34.705,0,0,1-7.488-11.513,36.678,36.678,0,0,1-2.631-13.789,38.794,38.794,0,0,1,2.564-14.125,34.429,34.429,0,0,1,7.42-11.646,35.425,35.425,0,0,1,11.805-7.966,39.577,39.577,0,0,1,15.584-2.946A38.594,38.594,0,0,1,400.8,47.914a35.588,35.588,0,0,1,11.6,7.9,33.6,33.6,0,0,1,7.286,11.513,38.12,38.12,0,0,1,2.5,13.656q0,1.742-.068,3.347a13.638,13.638,0,0,1-.338,2.678H367.141a20.673,20.673,0,0,0,2.024,7.363,18.118,18.118,0,0,0,9.984,8.971,19.2,19.2,0,0,0,6.746,1.2,20.986,20.986,0,0,0,10.187-2.61,13.869,13.869,0,0,0,6.543-6.9l15.516,4.285a31.393,31.393,0,0,1-12.48,13.187q-8.571,5.155-20.441,5.154M403.57,75.358A18.6,18.6,0,0,0,397.7,62.707a19.046,19.046,0,0,0-19.429-3.481,17.819,17.819,0,0,0-5.6,3.548,18.373,18.373,0,0,0-3.98,5.49,19.2,19.2,0,0,0-1.822,7.1Z"
        transform="translate(61.801 7.576)"
      />
      <path
        d="M466.1,120.507a39.86,39.86,0,0,1-18.214-4.149,46.978,46.978,0,0,1-14.168-10.845,48.364,48.364,0,0,1-9.175-15.4,50.669,50.669,0,0,1-3.237-17.806A49.082,49.082,0,0,1,424.75,54.1a50.851,50.851,0,0,1,9.444-15.4,45.161,45.161,0,0,1,14.235-10.643,40.619,40.619,0,0,1,17.809-3.95,39.762,39.762,0,0,1,18.282,4.217,45.872,45.872,0,0,1,14.168,11.045,50.959,50.959,0,0,1,9.106,15.463,49.683,49.683,0,0,1-.2,35.813,49.95,49.95,0,0,1-9.444,15.33,45.677,45.677,0,0,1-14.234,10.576,40.622,40.622,0,0,1-17.81,3.948m-37.913-48.2a45.416,45.416,0,0,0,2.766,15.732,42.357,42.357,0,0,0,7.825,13.388,38.464,38.464,0,0,0,12.075,9.3,34.1,34.1,0,0,0,15.381,3.481,33.269,33.269,0,0,0,15.583-3.615,37.98,37.98,0,0,0,11.875-9.572,45.1,45.1,0,0,0,7.487-44.447,43.489,43.489,0,0,0-7.892-13.389,39.015,39.015,0,0,0-11.942-9.3,32.994,32.994,0,0,0-15.111-3.481,33.663,33.663,0,0,0-15.65,3.614,38.5,38.5,0,0,0-12.008,9.572,43.892,43.892,0,0,0-7.69,13.455,44.707,44.707,0,0,0-2.7,15.262"
        transform="translate(74.824 4.062)"
      />
      <path
        d="M615.129,116.248h-6.745V77.422q0-13.253-4.116-19.546t-12.616-6.292a21.444,21.444,0,0,0-8.23,1.607,24.959,24.959,0,0,0-7.151,4.485,28.946,28.946,0,0,0-5.6,6.828,35.767,35.767,0,0,0-3.711,8.77v42.975h-6.746V77.422q0-13.384-4.046-19.612t-12.548-6.226a21.774,21.774,0,0,0-8.162,1.54,24.085,24.085,0,0,0-7.084,4.418,31.789,31.789,0,0,0-5.734,6.828,32.838,32.838,0,0,0-3.846,8.768v43.109H512.05V46.631h6.34v16.6a33.979,33.979,0,0,1,11.334-13.12,27.337,27.337,0,0,1,15.516-4.686q8.9,0,14.436,5.221A21.956,21.956,0,0,1,566.289,64.3q9.982-18.877,27.523-18.876,11.466,0,16.393,8.1t4.924,22.693Z"
        transform="translate(90.938 7.654)"
      />
      <path
        d="M674.8,116.248h-6.745V77.422q0-13.519-3.846-19.679T652,51.584a25.507,25.507,0,0,0-8.838,1.607A29.97,29.97,0,0,0,635,57.743a33.359,33.359,0,0,0-6.611,6.894,28.315,28.315,0,0,0-4.183,8.5v43.109h-6.745V46.631h6.34v16.6a32.731,32.731,0,0,1,5.33-7.3,33.556,33.556,0,0,1,7.152-5.623,36.183,36.183,0,0,1,8.431-3.615,33.266,33.266,0,0,1,9.175-1.271q11.465,0,16.191,7.966T674.8,76.218Z"
        transform="translate(109.659 7.654)"
      />
      <rect width="6.745" height="69.617" transform="translate(805.504 54.287)" />
      <path
        d="M78.238,87.845a27.073,27.073,0,0,1-13.467-3.581L43.631,105.24a56.637,56.637,0,0,0,69.7-.358L92.23,83.948a27.07,27.07,0,0,1-13.992,3.9"
        transform="translate(7.75 14.144)"
      />
      <path
        d="M78.23,16.305A56.473,56.473,0,0,0,43.678,28.076L64.823,49.058a27.093,27.093,0,0,1,27.338.315l21.1-20.94A56.5,56.5,0,0,0,78.23,16.305"
        transform="translate(7.757 2.746)"
      />
      <path
        d="M121.381,97.191a55.138,55.138,0,0,0-.014-44.165L155.785,0,114.169,40.9c-.029-.039-.055-.079-.085-.117L92.944,61.762a26.552,26.552,0,0,1,.038,26.666v0l-.039,0,4.475,4.4,16.707,16.578c.024-.029.044-.063.067-.092L155.785,150.2Z"
        transform="translate(16.507)"
      />
      <path d="M34.4,97.191a55.139,55.139,0,0,1,.014-44.165L0,0,41.616,40.9c.029-.039.055-.079.085-.117l21.14,20.977A26.552,26.552,0,0,0,62.8,88.429v0l.039,0-4.475,4.4L41.66,109.41c-.024-.029-.044-.063-.067-.092L0,150.2Z" />
      <path
        d="M187.714,33.439a9.7,9.7,0,1,1-9.7-9.623,9.66,9.66,0,0,1,9.7,9.623"
        transform="translate(29.892 4.015)"
        fill="#0088ce"
      />
      <path
        d="M698.41,34.376a9.7,9.7,0,1,1-9.7-9.623,9.66,9.66,0,0,1,9.7,9.623"
        transform="translate(120.59 4.172)"
        fill="#0088ce"
      />
      <path
        d="M239.441,40.887H208.814v78.855H190.329V40.887h.179v-16.2h48.933Z"
        transform="translate(33.801 4.16)"
      />
    </svg>
  );
}
