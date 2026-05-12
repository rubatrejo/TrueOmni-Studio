'use client';

import { useEffect, useState } from 'react';

import { formatSignageClock, formatSignageDate } from '@/lib/signage/dates';
import type { SignageHeaderWeather } from '@/lib/signage/weather-adapter';
import { canvasDimensionsOf, HEADER_H, type GridConfig } from '@/lib/video-walls/dimensions';
import type { VideoWallClientResolved } from '@/lib/video-walls/schema';

/**
 * <VideoWallHeader> — header pixel-perfect contra el SVG Adobe XD del
 * catálogo 3×2.
 *
 * El componente es un SVG inline que reproduce el `Display_Info_Header`
 * del XD verbatim:
 *   - Background `#004f8b` rect 5760×335 con stroke `#707070` 1px.
 *   - Logo TrueOmni en (80, 92.402) — paths verbatim del XD.
 *   - Weather block en (2198, 38) — 3 forecast cards (FRI/SAT/SUN) con
 *     coords exactas: Group_1 translate(-633 59), Group_8 translate
 *     (-223.309 59), Group_9 translate(167.191 18). Cada card tiene su
 *     dayLabel (fontSize 96), high/low (fontSize 48) y separator
 *     vertical (rect 2×161/158/186 rotate 90).
 *   - Icono sol en (225.514, 24) rotate(11) — path "icon" verbatim.
 *   - Iconos weather adicionales (cloud rain Group_4 + cloud ic_weather).
 *   - Clock + date en (5277, 61) — "3:08 PM" fontSize 92, "Mon Apr 15"
 *     fontSize 72. Texto dinámico del cliente.
 *
 * Para grids distintos del 3×2: el ancho del rect bg escala a
 * `cols × 1920`; las coords absolutas de logo/weather/clock se
 * preservan (anclados al margen izquierdo / derecho según
 * corresponda).
 */
export interface VideoWallHeaderProps {
  client: VideoWallClientResolved;
  weather: SignageHeaderWeather;
  grid: GridConfig;
}

const HEADER_TEXT_FILL = 'hsl(var(--signage-header-text, 0 0% 100%))';
const HEADER_BG_FILL = 'hsl(var(--signage-header-bg, 210 100% 27%))';

export function VideoWallHeader({ client, weather, grid }: VideoWallHeaderProps) {
  const { width: canvasW } = canvasDimensionsOf(grid);

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

  // Logo custom del cliente (override). Si no, usar el SVG TrueOmni verbatim.
  const logoRel = client.branding.logos?.default ?? '';
  const isExternalLogo =
    logoRel.startsWith('http') || logoRel.startsWith('/') || logoRel.startsWith('data:');
  const hasCustomLogo = !!logoRel && (isExternalLogo || logoRel !== 'assets/logo.svg');
  const resolvedLogoSrc = hasCustomLogo
    ? isExternalLogo
      ? logoRel
      : `/signage-assets/${client.slug}/${logoRel}`
    : null;

  // El clock va anclado a la derecha. En 3×2 el XD lo tiene en x=5277
  // (canvas=5760 → offset desde la derecha = 483). Mantener ese offset
  // para grids más anchos/angostos.
  const clockX = canvasW - 483;

  // Weather block: HTML overlay centrado en el header con formato DD
  // (current temp big + dividers + N forecast cards con day+icon+high/low).
  // Posicionado entre el logo (left) y el clock (right).
  const forecastDays = ((): 1 | 3 | 5 => {
    const raw = (client.header.forecastDays as unknown as number) ?? 3;
    if (raw <= 1) return 1;
    if (raw >= 5) return 5;
    return 3;
  })();

  return (
    <>
      <svg
        className="pointer-events-none absolute left-0 top-0"
        width={canvasW}
        height={HEADER_H}
        viewBox={`0 0 ${canvasW} ${HEADER_H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ zIndex: 20 }}
        aria-hidden="true"
      >
        {/* Background band */}
        <g>
          <rect width={canvasW} height={HEADER_H} fill={HEADER_BG_FILL} />
          <rect
            x={0.5}
            y={0.5}
            width={canvasW - 1}
            height={HEADER_H - 1}
            fill="none"
            stroke="#707070"
            strokeWidth="1"
          />
        </g>

        {/* Display_Weather_Info — el bloque se renderea como HTML overlay
          (ver `<WeatherZone>` debajo del SVG) con el formato DD. Aquí
          dejamos solo un placeholder vacío para mantener la estructura
          XD. */}
        <g transform="translate(2198 38)" opacity="0" style={{ display: 'none' }}>
          <g transform="translate(-633 59)">
            <text
              transform="translate(711.5 78)"
              fill={HEADER_TEXT_FILL}
              fontSize="96"
              fontFamily="'Open Sans', system-ui, sans-serif"
              fontWeight="600"
            >
              <tspan x="-70.875" y="0">
                FRI
              </tspan>
            </text>
            <text
              transform="translate(633 146)"
              fill={HEADER_TEXT_FILL}
              fontSize="48"
              fontFamily="'Open Sans', system-ui, sans-serif"
              fontWeight="600"
            >
              <tspan x="0" y="0">
                --°
              </tspan>
            </text>
            <text
              transform="translate(720 146)"
              fill={HEADER_TEXT_FILL}
              fontSize="48"
              fontFamily="'Open Sans', system-ui, sans-serif"
              fontWeight="300"
            >
              <tspan x="0" y="0">
                --°
              </tspan>
            </text>
            <rect
              width="2"
              height="161.5"
              rx="1"
              transform="translate(794.5 93.5) rotate(90)"
              fill={HEADER_TEXT_FILL}
            />
          </g>

          {/* Group_8 — SAT card translate(-223.309 59) */}
          <g transform="translate(-223.309 59)">
            <text
              transform="translate(781.5 78)"
              fill={HEADER_TEXT_FILL}
              fontSize="96"
              fontFamily="'Open Sans', system-ui, sans-serif"
              fontWeight="600"
            >
              <tspan x="-81.938" y="0">
                SAT
              </tspan>
            </text>
            <text
              transform="translate(704 146)"
              fill={HEADER_TEXT_FILL}
              fontSize="48"
              fontFamily="'Open Sans', system-ui, sans-serif"
              fontWeight="600"
            >
              <tspan x="0" y="0">
                --°
              </tspan>
            </text>
            <text
              transform="translate(787 146)"
              fill={HEADER_TEXT_FILL}
              fontSize="48"
              fontFamily="'Open Sans', system-ui, sans-serif"
              fontWeight="300"
            >
              <tspan x="0" y="0">
                --°
              </tspan>
            </text>
            <rect
              width="2"
              height="158.063"
              rx="1"
              transform="translate(861.563 94) rotate(90)"
              fill={HEADER_TEXT_FILL}
            />
          </g>

          {/* Group_9 — SUN card translate(167.191 18) */}
          <g transform="translate(167.191 18)">
            <text
              transform="translate(882 119)"
              fill={HEADER_TEXT_FILL}
              fontSize="96"
              fontFamily="'Open Sans', system-ui, sans-serif"
              fontWeight="600"
            >
              <tspan x="-99.609" y="0">
                SUN
              </tspan>
            </text>
            <text
              transform="translate(790 187)"
              fill={HEADER_TEXT_FILL}
              fontSize="48"
              fontFamily="'Open Sans', system-ui, sans-serif"
              fontWeight="600"
            >
              <tspan x="0" y="0">
                --°
              </tspan>
            </text>
            <text
              transform="translate(899 187)"
              fill={HEADER_TEXT_FILL}
              fontSize="48"
              fontFamily="'Open Sans', system-ui, sans-serif"
              fontWeight="300"
            >
              <tspan x="0" y="0">
                --°
              </tspan>
            </text>
            <rect
              width="2"
              height="186.646"
              rx="1"
              transform="translate(973 135) rotate(90)"
              fill={HEADER_TEXT_FILL}
            />
          </g>

          {/* Sun icon verbatim — translate(225.514 24) rotate(11) */}
          <path
            d="M87.445,175.8a6.752,6.752,0,0,1-6.726-6.762V155.518a6.727,6.727,0,1,1,13.453,0v13.524A6.752,6.752,0,0,1,87.445,175.8Zm57.078-23.764a6.653,6.653,0,0,1-4.755-1.981l-9.515-9.564a6.794,6.794,0,0,1,0-9.561,6.7,6.7,0,0,1,9.512,0l9.515,9.564a6.794,6.794,0,0,1,0,9.561A6.669,6.669,0,0,1,144.524,152.04Zm-114.157,0a6.653,6.653,0,0,1-4.755-1.981,6.792,6.792,0,0,1,0-9.561l9.514-9.564a6.7,6.7,0,0,1,9.512,0,6.792,6.792,0,0,1,0,9.561l-9.514,9.564A6.657,6.657,0,0,1,30.367,152.04Zm57.078-16.807A47.332,47.332,0,1,1,134.532,87.9,47.262,47.262,0,0,1,87.445,135.233Zm0-81.14A33.809,33.809,0,1,0,121.078,87.9,33.759,33.759,0,0,0,87.445,54.093Zm80.719,40.57H154.712a6.762,6.762,0,0,1,0-13.524h13.453a6.762,6.762,0,0,1,0,13.524Zm-147.985,0H6.727a6.762,6.762,0,0,1,0-13.524H20.18a6.762,6.762,0,0,1,0,13.524Zm114.83-47.811a6.657,6.657,0,0,1-4.756-1.981,6.794,6.794,0,0,1,0-9.561l9.515-9.564a6.7,6.7,0,0,1,9.512,0,6.794,6.794,0,0,1,0,9.561l-9.515,9.564A6.653,6.653,0,0,1,135.009,46.852Zm-95.127,0a6.657,6.657,0,0,1-4.756-1.981l-9.514-9.564a6.792,6.792,0,0,1,0-9.561,6.7,6.7,0,0,1,9.512,0l9.514,9.564a6.792,6.792,0,0,1,0,9.561A6.653,6.653,0,0,1,39.882,46.852ZM87.445,27.046a6.751,6.751,0,0,1-6.726-6.761V6.761a6.727,6.727,0,1,1,13.453,0V20.285A6.752,6.752,0,0,1,87.445,27.046Z"
            transform="translate(225.514 24) rotate(11)"
            fill={HEADER_TEXT_FILL}
          />

          {/* Separator vertical 1 — Rectangle_Copy translate(893.191) */}
          <rect
            width="6"
            height="254"
            rx="3"
            transform="translate(893.191 0)"
            fill={HEADER_TEXT_FILL}
          />

          {/* Group_4 — cloud rain icon translate(680.191 52) */}
          <g transform="translate(680.191 52)">
            <g>
              <path
                d="M137.226,10.295c0-1.744.066-3.491-.014-5.231A5.1,5.1,0,0,0,131.986,0a5.01,5.01,0,0,0-4.872,5.2c-.041,3.262-.035,6.526,0,9.788a5,5,0,0,0,4.934,5.3,5.085,5.085,0,0,0,5.179-5.272c.046-1.574.008-3.15,0-4.725m57.259,27.93a4.989,4.989,0,0,0-7.519-4.437c-2.965,1.6-5.869,3.324-8.766,5.052a5.044,5.044,0,1,0,5.013,8.753c2.957-1.62,5.861-3.339,8.765-5.054a4.862,4.862,0,0,0,2.507-4.314"
                transform="translate(-69.742 0)"
                fill={HEADER_TEXT_FILL}
              />
              <path
                d="M0,217.621a8.765,8.765,0,0,1,4.112-3.982c2.331-1.23,4.573-2.625,6.866-3.927,2.853-1.62,5.847-.934,7.308,1.651,1.431,2.532.568,5.421-2.159,7.049-2.359,1.41-4.75,2.768-7.13,4.144-4.264,2.467-6.536,1.9-9-2.233Z"
                transform="translate(0 -114.607)"
                fill={HEADER_TEXT_FILL}
              />
              <path
                d="M0,77.069c2.414-4.135,4.726-4.715,8.988-2.256,2.332,1.346,4.676,2.671,7,4.037,2.831,1.666,3.756,4.577,2.308,7.15-1.479,2.627-4.5,3.274-7.45,1.586C8.6,86.3,6.4,84.946,4.123,83.742A8.908,8.908,0,0,1,0,79.77Z"
                transform="translate(0 -40.254)"
                fill={HEADER_TEXT_FILL}
              />
              <path
                d="M67.222,142.843a43.241,43.241,0,0,1-10.338-9.5c-18.522-23.677-4.639-59.545,24.988-64.531,18.175-3.058,35.207,5.585,43.551,22.143a1.916,1.916,0,0,0,1.881,1.228Q150.36,93.6,160.64,114.324a2.193,2.193,0,0,0,2.363,1.5c18.136-.291,32.779,11.748,36.074,29.591,3.4,18.44-9.62,37.292-28.141,40.58a50.754,50.754,0,0,1-8.711.689q-35.2.081-70.407.018c-14.381-.03-25.7-9.339-28.521-23.426-1.447-7.222.042-13.96,3.926-20.43m60.847,33.733v-.056c12.21,0,24.421.043,36.632-.012,12.93-.058,24.111-10.932,24.689-23.91a25.318,25.318,0,0,0-29-26.395c-4.82.675-6.373-.233-7.747-4.528a27.832,27.832,0,0,0-53.432,1.3,27.169,27.169,0,0,0-.733,10.531c.5,3.893-1.727,6.334-5.565,6.269-.731-.012-1.463-.041-2.194-.029a18.413,18.413,0,0,0,.721,36.816c12.21.074,24.421.017,36.632.017M115.3,93.545c-.285-.495-.525-1-.842-1.447C107.3,81.926,97.56,77.166,85.149,78.6a30.139,30.139,0,0,0-25.678,22.87,30.638,30.638,0,0,0,12.085,32.11c1.825,1.285,3.333,1.872,5.091.1a3.644,3.644,0,0,1,1.311-.747c3.289-1.231,6.589-2.434,10.023-3.7C89.3,111.758,98.327,99.71,115.3,93.545"
                transform="translate(-26.618 -37.426)"
                fill={HEADER_TEXT_FILL}
              />
              <path
                d="M137.228,10.295c0,1.575.04,3.151-.005,4.725a5.085,5.085,0,0,1-5.179,5.272,5,5,0,0,1-4.934-5.3c-.031-3.262-.037-6.526,0-9.788A5.01,5.01,0,0,1,131.985,0a5.1,5.1,0,0,1,5.226,5.062c.08,1.74.015,3.487.017,5.231"
                transform="translate(-69.741 0)"
                fill={HEADER_TEXT_FILL}
              />
              <path
                d="M253.449,78.505a4.866,4.866,0,0,1-2.508,4.313c-2.9,1.715-5.808,3.433-8.765,5.054a5.044,5.044,0,1,1-5.013-8.753c2.9-1.728,5.8-3.448,8.766-5.052a4.991,4.991,0,0,1,7.521,4.438"
                transform="translate(-128.703 -40.28)"
                fill={HEADER_TEXT_FILL}
              />
            </g>
          </g>

          {/* Separator vertical 2 — Rectangle_Copy-2 translate(424.829) */}
          <rect
            width="6"
            height="254"
            rx="3"
            transform="translate(424.829 0)"
            fill={HEADER_TEXT_FILL}
          />

          {/* ic_weather — cloud icon translate(1189.191 71.5) */}
          <path
            d="M147.5,45.986A46,46,0,0,0,60.245,25.639,24.549,24.549,0,0,0,22.271,44.433,33.8,33.8,0,0,0,33.845,110h110a31.129,31.129,0,0,0,3.6-62.052C147.483,47.276,147.5,46.626,147.5,45.986Z"
            transform="translate(1189.191 71.5)"
            fill="none"
            stroke={HEADER_TEXT_FILL}
            strokeMiterlimit="10"
            strokeWidth="5"
          />
        </g>

        {/* Display_Time_Info — clock + date, anclado a la derecha */}
        <g transform={`translate(${clockX} 61)`}>
          <text
            transform="translate(383 98)"
            fill={HEADER_TEXT_FILL}
            fontSize="92"
            fontFamily="'Open Sans', system-ui, sans-serif"
            fontWeight="600"
          >
            <tspan x="-348.234" y="0">
              {clockText}
            </tspan>
          </text>
          <text
            transform="translate(381 187)"
            fill={HEADER_TEXT_FILL}
            fontSize="72"
            fontFamily="'Open Sans', system-ui, sans-serif"
            fontWeight="300"
          >
            <tspan x="-380.602" y="0">
              {dateText}
            </tspan>
          </text>
        </g>

        {/* Logo — translate(80 92.402). Si el cliente tiene logo custom,
          se usa <image>. Si no, paths TrueOmni verbatim del XD. */}
        <g transform="translate(80 92.402)">
          {resolvedLogoSrc ? (
            <image
              href={resolvedLogoSrc}
              width="819"
              height="150"
              preserveAspectRatio="xMidYMid meet"
            />
          ) : (
            <TrueOmniLogoPaths />
          )}
        </g>
      </svg>

      {/* Weather block — HTML overlay con formato DD (current temp +
        dividers + forecast cards con day label + icon + high/low). */}
      <WeatherZone weather={weather} forecastDays={forecastDays} clockX={clockX} />
    </>
  );
}

const FONT_BODY = "'Open Sans', system-ui, sans-serif";

/** Bloque weather del VW header — HTML overlay sobre el SVG. Replica el
 *  layout del DD `<WeatherZone>` adaptado al header de 335px de alto. */
function WeatherZone({
  weather,
  forecastDays,
  clockX,
}: {
  weather: SignageHeaderWeather;
  forecastDays: 1 | 3 | 5;
  clockX: number;
}) {
  // Zona disponible: entre el final del logo (~x=900) y el inicio del
  // clock (x=clockX). Centramos el bloque en esa zona.
  const left = 950;
  const width = clockX - left - 40;
  const tempFontSize = 144;
  const dividerH = 200;
  const gap = 56;

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left,
        top: 0,
        width,
        height: HEADER_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap,
        color: HEADER_TEXT_FILL,
        whiteSpace: 'nowrap',
        zIndex: 21,
        fontFamily: FONT_BODY,
      }}
    >
      <span
        style={{
          fontSize: tempFontSize,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {weather.currentTempText}
      </span>
      {weather.forecast.slice(0, forecastDays).map((f, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap }}>
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 4,
              height: dividerH,
              borderRadius: 2,
              backgroundColor: HEADER_TEXT_FILL,
              opacity: 0.55,
            }}
          />
          <ForecastCard
            dayLabel={f.dayLabel}
            highText={f.highText}
            lowText={f.lowText}
            weatherCode={f.weatherCode}
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
}: {
  dayLabel: string;
  highText: string;
  lowText: string;
  weatherCode: number | null;
}) {
  const dayFs = 80;
  const tempFs = 50;
  const iconSize = 90;
  const rowGap = 8;
  const inlineGap = 24;

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
        <span style={{ fontSize: dayFs, fontWeight: 800, letterSpacing: 1 }}>{dayLabel}</span>
        <WeatherIcon code={weatherCode} size={iconSize} />
      </div>
      <div
        style={{
          fontSize: tempFs,
          display: 'flex',
          gap: 16,
        }}
      >
        <span style={{ fontWeight: 700 }}>{highText}</span>
        <span style={{ fontWeight: 400, opacity: 0.7 }}>{lowText}</span>
      </div>
    </div>
  );
}

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

/** Paths verbatim del logo "Logo-White-Footer" del SVG XD (group dim
 *  818.999 × 150.196). Texto + isotipo del producto TrueOmni. */
function TrueOmniLogoPaths() {
  const F = HEADER_TEXT_FILL;
  return (
    <g>
      <path
        d="M272.984,61.664a35.891,35.891,0,0,0-14.706,3.147,18.488,18.488,0,0,0-9.31,9.036v42.44h-18.08V46.133h16.6v15a31.96,31.96,0,0,1,4.452-6.493,34.141,34.141,0,0,1,5.531-5.02,25.663,25.663,0,0,1,6-3.28,16.682,16.682,0,0,1,5.869-1.138h2.226a7.413,7.413,0,0,1,1.417.133Z"
        transform="translate(41.006 7.617)"
        fill={F}
      />
      <path
        d="M299.782,117.49q-10.929,0-16.6-6.962T277.52,89.911V46H295.6V86.028q0,16.2,11.738,16.2a18.667,18.667,0,0,0,10.186-3.147,22.658,22.658,0,0,0,8.028-9.572V46h18.081V95.534a6.266,6.266,0,0,0,1.012,4.016,4.438,4.438,0,0,0,3.306,1.339v15.262a38.8,38.8,0,0,1-4.52.67c-1.215.088-2.317.134-3.307.134a13.09,13.09,0,0,1-7.892-2.21,8.678,8.678,0,0,1-3.575-6.091l-.405-5.623a30.064,30.064,0,0,1-12.143,10.844,36.764,36.764,0,0,1-16.325,3.615"
        transform="translate(49.284 7.751)"
        fill={F}
      />
      <path
        d="M385.221,117.664a39.519,39.519,0,0,1-15.38-2.878,35.275,35.275,0,0,1-11.738-7.832,34.705,34.705,0,0,1-7.488-11.513,36.678,36.678,0,0,1-2.631-13.789,38.794,38.794,0,0,1,2.564-14.125,34.429,34.429,0,0,1,7.42-11.646,35.425,35.425,0,0,1,11.805-7.966,39.577,39.577,0,0,1,15.584-2.946A38.594,38.594,0,0,1,400.8,47.914a35.588,35.588,0,0,1,11.6,7.9,33.6,33.6,0,0,1,7.286,11.513,38.12,38.12,0,0,1,2.5,13.656q0,1.742-.068,3.347a13.638,13.638,0,0,1-.338,2.678H367.141a20.673,20.673,0,0,0,2.024,7.363,18.118,18.118,0,0,0,9.984,8.971,19.2,19.2,0,0,0,6.746,1.2,20.986,20.986,0,0,0,10.187-2.61,13.869,13.869,0,0,0,6.543-6.9l15.516,4.285a31.393,31.393,0,0,1-12.48,13.187q-8.571,5.155-20.441,5.154M403.57,75.358A18.6,18.6,0,0,0,397.7,62.707a19.046,19.046,0,0,0-19.429-3.481,17.819,17.819,0,0,0-5.6,3.548,18.373,18.373,0,0,0-3.98,5.49,19.2,19.2,0,0,0-1.822,7.1Z"
        transform="translate(61.801 7.576)"
        fill={F}
      />
      <path
        d="M466.1,120.507a39.86,39.86,0,0,1-18.214-4.149,46.978,46.978,0,0,1-14.168-10.845,48.364,48.364,0,0,1-9.175-15.4,50.669,50.669,0,0,1-3.237-17.806A49.082,49.082,0,0,1,424.75,54.1a50.851,50.851,0,0,1,9.444-15.4,45.161,45.161,0,0,1,14.235-10.643,40.619,40.619,0,0,1,17.809-3.95,39.762,39.762,0,0,1,18.282,4.217,45.872,45.872,0,0,1,14.168,11.045,50.959,50.959,0,0,1,9.106,15.463,49.683,49.683,0,0,1-.2,35.813,49.95,49.95,0,0,1-9.444,15.33,45.677,45.677,0,0,1-14.234,10.576,40.622,40.622,0,0,1-17.81,3.948m-37.913-48.2a45.416,45.416,0,0,0,2.766,15.732,42.357,42.357,0,0,0,7.825,13.388,38.464,38.464,0,0,0,12.075,9.3,34.1,34.1,0,0,0,15.381,3.481,33.269,33.269,0,0,0,15.583-3.615,37.98,37.98,0,0,0,11.875-9.572,45.1,45.1,0,0,0,7.487-44.447,43.489,43.489,0,0,0-7.892-13.389,39.015,39.015,0,0,0-11.942-9.3,32.994,32.994,0,0,0-15.111-3.481,33.663,33.663,0,0,0-15.65,3.614,38.5,38.5,0,0,0-12.008,9.572,43.892,43.892,0,0,0-7.69,13.455,44.707,44.707,0,0,0-2.7,15.262"
        transform="translate(74.824 4.062)"
        fill={F}
      />
      <path
        d="M615.129,116.248h-6.745V77.422q0-13.253-4.116-19.546t-12.616-6.292a21.444,21.444,0,0,0-8.23,1.607,24.959,24.959,0,0,0-7.151,4.485,28.946,28.946,0,0,0-5.6,6.828,35.767,35.767,0,0,0-3.711,8.77v42.975h-6.746V77.422q0-13.384-4.046-19.612t-12.548-6.226a21.774,21.774,0,0,0-8.162,1.54,24.085,24.085,0,0,0-7.084,4.418,31.789,31.789,0,0,0-5.734,6.828,32.838,32.838,0,0,0-3.846,8.768v43.109H512.05V46.631h6.34v16.6a33.979,33.979,0,0,1,11.334-13.12,27.337,27.337,0,0,1,15.516-4.686q8.9,0,14.436,5.221A21.956,21.956,0,0,1,566.289,64.3q9.982-18.877,27.523-18.876,11.466,0,16.393,8.1t4.924,22.693Z"
        transform="translate(90.938 7.654)"
        fill={F}
      />
      <path
        d="M674.8,116.248h-6.745V77.422q0-13.519-3.846-19.679T652,51.584a25.507,25.507,0,0,0-8.838,1.607A29.97,29.97,0,0,0,635,57.743a33.359,33.359,0,0,0-6.611,6.894,28.315,28.315,0,0,0-4.183,8.5v43.109h-6.745V46.631h6.34v16.6a32.731,32.731,0,0,1,5.33-7.3,33.556,33.556,0,0,1,7.152-5.623,36.183,36.183,0,0,1,8.431-3.615,33.266,33.266,0,0,1,9.175-1.271q11.465,0,16.191,7.966T674.8,76.218Z"
        transform="translate(109.659 7.654)"
        fill={F}
      />
      <rect width="6.745" height="69.617" transform="translate(805.504 54.287)" fill={F} />
      <path
        d="M78.238,87.845a27.073,27.073,0,0,1-13.467-3.581L43.631,105.24a56.637,56.637,0,0,0,69.7-.358L92.23,83.948a27.07,27.07,0,0,1-13.992,3.9"
        transform="translate(7.75 14.144)"
        fill={F}
      />
      <path
        d="M78.23,16.305A56.473,56.473,0,0,0,43.678,28.076L64.823,49.058a27.093,27.093,0,0,1,27.338.315l21.1-20.94A56.5,56.5,0,0,0,78.23,16.305"
        transform="translate(7.757 2.746)"
        fill={F}
      />
      <path
        d="M121.381,97.191a55.138,55.138,0,0,0-.014-44.165L155.785,0,114.169,40.9c-.029-.039-.055-.079-.085-.117L92.944,61.762a26.552,26.552,0,0,1,.038,26.666v0l-.039,0,4.475,4.4,16.707,16.578c.024-.029.044-.063.067-.092L155.785,150.2Z"
        transform="translate(16.507)"
        fill={F}
      />
      <path
        d="M34.4,97.191a55.139,55.139,0,0,1,.014-44.165L0,0,41.616,40.9c.029-.039.055-.079.085-.117l21.14,20.977A26.552,26.552,0,0,0,62.8,88.429v0l.039,0-4.475,4.4L41.66,109.41c-.024-.029-.044-.063-.067-.092L0,150.2Z"
        fill={F}
      />
      <path
        d="M187.714,33.439a9.7,9.7,0,1,1-9.7-9.623,9.66,9.66,0,0,1,9.7,9.623"
        transform="translate(29.892 4.015)"
        fill={F}
      />
      <path
        d="M698.41,34.376a9.7,9.7,0,1,1-9.7-9.623,9.66,9.66,0,0,1,9.7,9.623"
        transform="translate(120.59 4.172)"
        fill={F}
      />
      <path
        d="M239.441,40.887H208.814v78.855H190.329V40.887h.179v-16.2h48.933Z"
        transform="translate(33.801 4.16)"
        fill={F}
      />
    </g>
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
