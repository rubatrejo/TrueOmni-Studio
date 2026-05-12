'use client';

import type { CSSProperties } from 'react';

import { useSignageBridgeStore } from '@/components/signage/runtime/signage-bridge-store';
import type {
  SignageBranding,
  SignageClientResolved,
  SignageHeader as SignageHeaderConfig,
  SignageHeaderBackground,
  SignageOrientation,
} from '@/lib/signage/schema';
import type { SignageHeaderWeather } from '@/lib/signage/weather-adapter';

import { useSignageClock, type SignageClockState } from './use-signage-clock';

/**
 * `<SignageHeader>` — header universal de los Digital Displays.
 *
 * Layout HTML + flex + SVG icons (no SVG monolítico). 3 zonas absolutamente
 * posicionadas dentro del header, cada una con su propio placement
 * (`logo-left/center/right`, `weatherPlacement`, `clockPlacement`).
 *
 *  - **Logo**: TrueOmni isotipo SVG inline o logo custom uploaded por el cliente.
 *  - **Weather**: temp actual grande + N forecast cards (1/3/5). Cada card es
 *    auto-contenida con dayLabel + ícono + high/low. Las cards se layoutean
 *    horizontalmente con gap; tamaños escalan con `header.height` y con la
 *    cantidad de días para que 5 cards quepan sin colisionar con el clock.
 *  - **Clock**: hora grande + fecha. Right-aligned por default; se mueve y
 *    ancla con `clockPlacement`.
 *
 * Bridge: `clientPatch.header` y `clientPatch.branding.logos` se mergean live
 * desde `useSignageBridgeStore` para preview del editor.
 *
 * Tokens: `--signage-header-text` (color del foreground). Background del
 * header vive como CSS en el wrapper div para que ocupe el ancho completo
 * sin importar el valor de `header.height`.
 *
 * Nota: el isotipo TrueOmni mantiene 2 puntos cyan `#0088ce` (Path_12 y
 * Path_13 originales) hardcoded — son brand identity del producto, no del
 * cliente.
 */
export interface SignageHeaderProps {
  client: SignageClientResolved;
  weather: SignageHeaderWeather;
  initialClock: SignageClockState;
  /** Orientación del display. En portrait (1080 ancho) los elementos del
   *  header se escalan a ~0.62 para que logo/clock/weather no aprieten
   *  unos contra otros y los forecasts queden legibles. */
  orientation?: SignageOrientation;
}

const PADDING_X_LANDSCAPE = 40;
const PADDING_X_PORTRAIT = 28;
/** Portrait añade respiro vertical (top/bottom) para que los textos del
 *  weather/clock con lineHeight:1 no queden pegados al borde superior del
 *  header rect. Landscape no necesita — el header es 1920 ancho con espacio
 *  sobrado horizontal. */
const PADDING_Y_PORTRAIT = 16;
/** Altura fija del header signage. Coincide con el viewBox original de los
 *  SVGs de Adobe XD (1920×1080 → header band 1920×155). El editor ya no
 *  permite cambiarla. */
const HEADER_HEIGHT = 155;

export function SignageHeader({
  client: serverClient,
  weather,
  initialClock,
  orientation: initialOrientation = 'landscape',
}: SignageHeaderProps) {
  const clientPatch = useSignageBridgeStore((s) => s.clientPatch);
  // Bridge override de orientation — igual que SignageStage y SignagePlayer.
  // Cuando el editor togglea landscape/portrait, el header debe re-escalar
  // sus elementos (logo height, weather scale, clock fontSize) en vivo.
  const bridgeOrientation = useSignageBridgeStore(
    (s) => s.displayPatch?.settings?.defaultOrientation,
  );
  const orientation: SignageOrientation =
    bridgeOrientation && (bridgeOrientation === 'landscape' || bridgeOrientation === 'portrait')
      ? bridgeOrientation
      : initialOrientation;
  const header: SignageHeaderConfig = clientPatch?.header
    ? { ...serverClient.header, ...clientPatch.header }
    : serverClient.header;
  const branding: SignageBranding = clientPatch?.branding
    ? {
        ...serverClient.branding,
        ...clientPatch.branding,
        logos: clientPatch.branding.logos
          ? { ...serverClient.branding.logos, ...clientPatch.branding.logos }
          : serverClient.branding.logos,
      }
    : serverClient.branding;

  const { clockText, dateText } = useSignageClock(
    initialClock,
    serverClient.locale,
    serverClient.timezone,
    header.clockFormat,
  );

  const rawForecastDays = header.forecastDays as 1 | 2 | 3 | 5 | 0;
  // Portrait (1080) no cabe 3 ni 5 forecasts cómodos al lado del clock.
  // Cap a 2 max y mapeamos 3/5 → 2; 1/2 se mantienen. Landscape acepta los 4.
  const forecastDays: 1 | 2 | 3 | 5 =
    orientation === 'portrait'
      ? rawForecastDays === 0 || rawForecastDays === 1
        ? 1
        : 2
      : rawForecastDays === 0
        ? 1
        : rawForecastDays;

  const logoRel = branding.logos?.default ?? '';
  const isExternalLogo =
    logoRel.startsWith('http') || logoRel.startsWith('/') || logoRel.startsWith('data:');
  const hasCustomLogo = !!logoRel && (isExternalLogo || logoRel !== 'assets/logo.svg');
  const resolvedLogoSrc = hasCustomLogo
    ? isExternalLogo
      ? logoRel
      : `/signage-assets/${serverClient.slug}/${logoRel}`
    : null;

  const paddingX = orientation === 'portrait' ? PADDING_X_PORTRAIT : PADDING_X_LANDSCAPE;
  const paddingY = orientation === 'portrait' ? PADDING_Y_PORTRAIT : 0;
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: HEADER_HEIGHT,
        flexShrink: 0,
        ...resolveBackgroundCss(header.background),
      }}
      data-signage-header-position={header.position}
      data-signage-header-orientation={orientation}
    >
      {header.showLogo ? (
        <LogoZone
          placement={header.layout}
          customSrc={resolvedLogoSrc}
          height={HEADER_HEIGHT}
          orientation={orientation}
          paddingX={paddingX}
          paddingY={paddingY}
        />
      ) : null}

      {header.showWeather ? (
        <WeatherZone
          placement={header.weatherPlacement ?? 'center'}
          weather={weather}
          forecastDays={forecastDays}
          orientation={orientation}
          paddingX={paddingX}
          paddingY={paddingY}
        />
      ) : null}

      {header.showClock ? (
        <ClockZone
          placement={header.clockPlacement ?? 'right'}
          clockText={clockText}
          dateText={dateText}
          orientation={orientation}
          paddingX={paddingX}
          paddingY={paddingY}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Zonas
// ---------------------------------------------------------------------------

function placementToCss(
  placement: 'left' | 'center' | 'right',
  paddingX: number,
  paddingY: number = 0,
): CSSProperties {
  // Full-height zones + flex centering interno. Garantiza que las 3 zonas
  // (logo / weather / clock) compartan el mismo eje vertical y los
  // baselines visuales queden alineados, independientemente de cuántas
  // líneas de texto traiga cada zona. paddingY portrait añade respiro
  // contra los bordes superior/inferior del rect del header (los textos
  // grandes con lineHeight:1 quedaban pegados al edge).
  const base: CSSProperties = {
    position: 'absolute',
    top: paddingY,
    bottom: paddingY,
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
  height,
  orientation,
  paddingX,
  paddingY,
}: {
  placement: 'logo-left' | 'logo-center' | 'logo-right';
  customSrc: string | null;
  height: number;
  orientation: SignageOrientation;
  paddingX: number;
  paddingY: number;
}) {
  const simple: 'left' | 'center' | 'right' =
    placement === 'logo-center' ? 'center' : placement === 'logo-right' ? 'right' : 'left';
  // Landscape: 50% del header. Portrait: 36% para no apretar al weather y
  // dejar respiro lateral (canvas 1080 vs 1920).
  const heightFactor = orientation === 'portrait' ? 0.36 : 0.5;
  const logoHeight = Math.round(height * heightFactor);
  return (
    <div
      style={{
        ...placementToCss(simple, paddingX, paddingY),
      }}
    >
      <div style={{ height: logoHeight, display: 'flex', alignItems: 'center' }}>
        {customSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={customSrc}
            alt=""
            style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
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
  orientation,
  paddingX,
  paddingY,
}: {
  placement: 'left' | 'center' | 'right';
  weather: SignageHeaderWeather;
  forecastDays: 1 | 2 | 3 | 5;
  orientation: SignageOrientation;
  paddingX: number;
  paddingY: number;
}) {
  // Landscape: 5 días encogen el bloque a 0.65 para caber junto al clock.
  // Portrait: max 2 días, escala base 0.62 para que todo el header quepa
  // cómodo en 1080.
  const portraitScale = orientation === 'portrait' ? 0.62 : 1;
  const forecastBlockScale = forecastDays === 5 ? 0.65 : 1;
  const totalScale = portraitScale * forecastBlockScale;
  const cardScale = totalScale;
  const tempFontSize = Math.round(64 * totalScale);
  const gap = Math.round(28 * totalScale);
  const dividerH = Math.round(88 * totalScale);

  return (
    <div
      style={{
        gap,
        color: 'hsl(var(--signage-header-text))',
        whiteSpace: 'nowrap',
        ...placementToCss(placement, paddingX, paddingY),
      }}
    >
      <span
        className="signage-font-body"
        style={{ fontSize: tempFontSize, fontWeight: 700, lineHeight: 1 }}
      >
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
            cardScale={cardScale}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Forecast card layout (matches mockup `Screenshot 2026-05-08 at 10.35.26`):
 *
 *   [DAY LABEL]  [icon]
 *      [high   low]
 *
 * Day label en bold grande arriba, icon a su derecha en la misma línea, y
 * high/low pequeñas en la línea de abajo (high bold, low semi-transparente).
 */
function ForecastCard({
  dayLabel,
  highText,
  lowText,
  weatherCode,
  cardScale,
}: {
  dayLabel: string;
  highText: string;
  lowText: string;
  weatherCode: number | null;
  cardScale: number;
}) {
  // Tamaños base para HEADER_HEIGHT=155 (sin escalar por height).
  const dayFs = Math.round(40 * cardScale);
  const tempFs = Math.round(22 * cardScale);
  const iconSize = Math.round(44 * cardScale);
  const rowGap = Math.round(4 * cardScale);
  const inlineGap = Math.round(14 * cardScale);

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
        <span
          className="signage-font-display"
          style={{ fontSize: dayFs, fontWeight: 800, letterSpacing: 0.5 }}
        >
          {dayLabel}
        </span>
        <WeatherIcon code={weatherCode} size={iconSize} />
      </div>
      <div
        className="signage-font-display"
        style={{
          fontSize: tempFs,
          display: 'flex',
          gap: Math.round(10 * cardScale),
        }}
      >
        <span style={{ fontWeight: 700 }}>{highText}</span>
        <span style={{ fontWeight: 400, opacity: 0.7 }}>{lowText}</span>
      </div>
    </div>
  );
}

/** Divider vertical entre el current temp y cada forecast card. */
function Divider({ height }: { height: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 2,
        height,
        borderRadius: 1,
        backgroundColor: 'hsl(var(--signage-header-text))',
        opacity: 0.55,
      }}
    />
  );
}

function ClockZone({
  placement,
  clockText,
  dateText,
  orientation,
  paddingX,
  paddingY,
}: {
  placement: 'left' | 'center' | 'right';
  clockText: string;
  dateText: string;
  orientation: SignageOrientation;
  paddingX: number;
  paddingY: number;
}) {
  // Landscape (1920) usa los tamaños del SVG XD. Portrait (1080) escala a
  // 0.62 para que clock + weather + logo quepan sin colisión, +2pt sobre
  // el escalado base para que la hora/fecha se lean cómodos a distancia
  // (feedback Rubén 2026-05-12).
  const scale = orientation === 'portrait' ? 0.62 : 1;
  const portraitBump = orientation === 'portrait' ? 2 : 0;
  const clockFs = Math.round(42 * scale) + portraitBump;
  const dateFs = Math.round(28 * scale) + portraitBump;
  const textAlign = placement === 'left' ? 'left' : placement === 'right' ? 'right' : 'center';
  return (
    <div
      style={{
        textAlign,
        color: 'hsl(var(--signage-header-text))',
        lineHeight: 1.15,
        ...placementToCss(placement, paddingX, paddingY),
      }}
    >
      <div>
        <div className="signage-font-display" style={{ fontSize: clockFs, fontWeight: 700 }}>
          {clockText}
        </div>
        <div
          className="signage-font-display"
          style={{ fontSize: dateFs, fontWeight: 500, opacity: 0.95 }}
        >
          {dateText}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Iconos
// ---------------------------------------------------------------------------

/**
 * Mapea un WMO weather code (Open-Meteo) a uno de los 4 iconos disponibles.
 * Cubre los rangos comunes; cualquier code desconocido cae a `cloud`.
 */
function WeatherIcon({ code, size }: { code: number | null; size: number }) {
  const kind = pickIconKind(code);
  if (kind === 'sun') return <SunIcon size={size} />;
  if (kind === 'sun-cloud') return <SunCloudIcon size={size} />;
  if (kind === 'rain') return <RainIcon size={size} />;
  return <CloudIcon size={size} />;
}

function pickIconKind(code: number | null): 'sun' | 'sun-cloud' | 'cloud' | 'rain' {
  if (code == null) return 'sun-cloud';
  if (code === 0 || code === 1) return 'sun';
  if (code === 2 || code === 3) return 'sun-cloud';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 99) || code === 95) return 'rain';
  return 'cloud';
}

function SunIcon({ size }: { size: number }) {
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

function CloudIcon({ size }: { size: number }) {
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

function SunCloudIcon({ size }: { size: number }) {
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
      <path d="M10 18a3.5 3.5 0 0 1-.5-6.96 5 5 0 0 1 9.85.96A3 3 0 1 1 18.5 18H10Z" fill="none" />
    </svg>
  );
}

function RainIcon({ size }: { size: number }) {
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

// ---------------------------------------------------------------------------
//  TrueOmni isotipo (fallback cuando no hay logo custom)
// ---------------------------------------------------------------------------

function TrueOmniIsotipo({ height }: { height: number }) {
  // Aspect ratio del isotipo original: 316 × 58
  const width = Math.round(height * (316 / 58));
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 316 58"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g>
        <path
          d="M209.257,30.981h-11.8V61.61h-7.124V30.981h.069V24.688h18.86Z"
          transform="translate(-103.941 -13.483)"
          fill="hsl(var(--signage-header-text))"
        />
        <path
          d="M247.114,51.593a13.748,13.748,0,0,0-5.672,1.224,7.152,7.152,0,0,0-3.584,3.508V72.81H230.89V45.56h6.4v5.825A12.422,12.422,0,0,1,239,48.863a13.2,13.2,0,0,1,2.132-1.949,9.868,9.868,0,0,1,2.314-1.274,6.386,6.386,0,0,1,2.262-.442h.857a2.836,2.836,0,0,1,.545.051Z"
          transform="translate(-126.092 -24.683)"
          fill="hsl(var(--signage-header-text))"
        />
        <path
          d="M286.1,73.768a7.735,7.735,0,0,1-6.4-2.7q-2.183-2.7-2.184-8.008V46h6.968V61.549q0,6.293,4.524,6.293a7.156,7.156,0,0,0,3.927-1.222,8.783,8.783,0,0,0,3.094-3.718V46H303V65.239a2.448,2.448,0,0,0,.393,1.56,1.7,1.7,0,0,0,1.274.524v5.928a14.853,14.853,0,0,1-1.742.262c-.468.034-.893.052-1.274.052a5.017,5.017,0,0,1-3.042-.859,3.376,3.376,0,0,1-1.378-2.36l-.156-2.184a11.619,11.619,0,0,1-4.68,4.212,14.079,14.079,0,0,1-6.293,1.4"
          transform="translate(-151.559 -25.121)"
          fill="hsl(var(--signage-header-text))"
        />
        <path
          d="M362.336,73.206a15.13,15.13,0,0,1-5.928-1.118A13.372,13.372,0,0,1,349,64.573a14.342,14.342,0,0,1-1.014-5.357,15.172,15.172,0,0,1,.989-5.487,13.385,13.385,0,0,1,2.859-4.524,13.647,13.647,0,0,1,4.551-3.094,15.152,15.152,0,0,1,6.007-1.145,14.775,14.775,0,0,1,5.955,1.145,13.711,13.711,0,0,1,4.472,3.068,13.068,13.068,0,0,1,2.808,4.472,14.91,14.91,0,0,1,.962,5.3q0,.676-.026,1.3a5.344,5.344,0,0,1-.131,1.04H355.366a8.077,8.077,0,0,0,.787,2.859A7,7,0,0,0,360,67.639a7.35,7.35,0,0,0,2.6.468,8.041,8.041,0,0,0,3.933-1.013,5.375,5.375,0,0,0,2.521-2.678l5.981,1.665a12.155,12.155,0,0,1-4.81,5.122,14.91,14.91,0,0,1-7.878,2m7.073-16.432a7.25,7.25,0,0,0-2.261-4.914,7.028,7.028,0,0,0-11.18,2.158,7.5,7.5,0,0,0-.7,2.753Z"
          transform="translate(-190.04 -24.559)"
          fill="hsl(var(--signage-header-text))"
        />
        <path
          d="M438.576,61.557a15.265,15.265,0,0,1-7.021-1.611,18.121,18.121,0,0,1-5.461-4.212,18.815,18.815,0,0,1-3.54-5.981,19.82,19.82,0,0,1-1.248-6.916,19.193,19.193,0,0,1,1.33-7.073,19.779,19.779,0,0,1,3.641-5.981,17.418,17.418,0,0,1,5.487-4.134,15.556,15.556,0,0,1,6.865-1.534,15.229,15.229,0,0,1,7.047,1.637,17.7,17.7,0,0,1,5.46,4.29,19.829,19.829,0,0,1,3.51,6.006,19.554,19.554,0,0,1-3.718,19.867,17.617,17.617,0,0,1-5.487,4.107,15.555,15.555,0,0,1-6.865,1.534M423.963,42.835a17.763,17.763,0,0,0,1.066,6.111,16.482,16.482,0,0,0,3.015,5.2,14.842,14.842,0,0,0,4.659,3.616,13.058,13.058,0,0,0,5.928,1.352,12.742,12.742,0,0,0,6.006-1.4,14.662,14.662,0,0,0,4.577-3.718A17.629,17.629,0,0,0,452.1,36.726a16.912,16.912,0,0,0-3.042-5.2,15.053,15.053,0,0,0-4.6-3.613,12.636,12.636,0,0,0-5.825-1.352,12.893,12.893,0,0,0-6.031,1.4,14.858,14.858,0,0,0-4.628,3.718,17.081,17.081,0,0,0-2.964,5.227,17.481,17.481,0,0,0-1.041,5.928"
          transform="translate(-230.086 -13.169)"
          fill="hsl(var(--signage-header-text))"
        />
        <path
          d="M551.781,72.941h-2.6V57.864q0-5.147-1.586-7.592a5.393,5.393,0,0,0-4.863-2.444,8.21,8.21,0,0,0-3.173.624,9.609,9.609,0,0,0-2.753,1.742,11.229,11.229,0,0,0-2.158,2.652,13.952,13.952,0,0,0-1.43,3.409V72.941h-2.6V57.864q0-5.2-1.56-7.618a5.348,5.348,0,0,0-4.836-2.419,8.334,8.334,0,0,0-3.147.6,9.272,9.272,0,0,0-2.731,1.716,12.323,12.323,0,0,0-2.21,2.652,12.807,12.807,0,0,0-1.483,3.409V72.941h-2.6V45.9h2.444v6.446a13.167,13.167,0,0,1,4.368-5.1,10.478,10.478,0,0,1,5.981-1.82,7.735,7.735,0,0,1,5.564,2.028,8.553,8.553,0,0,1,2.554,5.306q3.848-7.333,10.609-7.333a6.8,6.8,0,0,1,6.319,3.146,17.121,17.121,0,0,1,1.9,8.815Z"
          transform="translate(-279.64 -24.813)"
          fill="hsl(var(--signage-header-text))"
        />
        <path
          d="M639.56,72.936h-2.6V57.859q0-5.251-1.483-7.643a5.128,5.128,0,0,0-4.705-2.393,9.763,9.763,0,0,0-3.409.624,11.525,11.525,0,0,0-3.147,1.769,12.908,12.908,0,0,0-2.549,2.678,11.03,11.03,0,0,0-1.612,3.3V72.936h-2.6V45.895H619.9v6.446a12.707,12.707,0,0,1,2.054-2.834,12.948,12.948,0,0,1,2.753-2.184,13.9,13.9,0,0,1,3.255-1.405,12.729,12.729,0,0,1,3.54-.494q4.419,0,6.24,3.094a17.673,17.673,0,0,1,1.82,8.866Z"
          transform="translate(-337.206 -24.808)"
          fill="hsl(var(--signage-header-text))"
        />
        <rect
          width="2.6"
          height="27.041"
          transform="translate(310.466 21.087)"
          fill="hsl(var(--signage-header-text))"
        />
        <path
          d="M56.969,85.458a10.374,10.374,0,0,1-5.192-1.392l-8.146,8.15a21.7,21.7,0,0,0,26.863-.139l-8.128-8.128a10.373,10.373,0,0,1-5.4,1.51"
          transform="translate(-23.828 -45.846)"
          fill="hsl(var(--signage-header-text))"
        />
        <path
          d="M57,16.305a21.658,21.658,0,0,0-13.317,4.573l8.149,8.149a10.373,10.373,0,0,1,10.537.122l8.128-8.128a21.67,21.67,0,0,0-13.5-4.712"
          transform="translate(-23.854 -8.904)"
          fill="hsl(var(--signage-header-text))"
        />
        <path
          d="M103.9,37.758a21.57,21.57,0,0,0,0-17.155L117.165,0l-16.04,15.888-.033-.046-8.148,8.149a10.383,10.383,0,0,1,.014,10.357h-.014l1.725,1.7,6.44,6.44.026-.035,16.03,15.883Z"
          transform="translate(-50.758)"
          fill="hsl(var(--signage-header-text))"
        />
        <path
          d="M13.261,37.758a21.57,21.57,0,0,1,0-17.155L0,0,16.04,15.888l.033-.046,8.148,8.149a10.383,10.383,0,0,0-.014,10.357h.014l-1.725,1.7-6.44,6.44-.026-.035L0,58.341Z"
          fill="hsl(var(--signage-header-text))"
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

// ---------------------------------------------------------------------------
//  Background CSS resolver
// ---------------------------------------------------------------------------

function resolveBackgroundCss(bg: SignageHeaderBackground): CSSProperties {
  if (bg.kind === 'color' && bg.color) {
    return { backgroundColor: bg.color };
  }
  if (bg.kind === 'gradient' && bg.from && bg.to) {
    return {
      backgroundImage: `linear-gradient(${bg.angle ?? 90}deg, ${bg.from}, ${bg.to})`,
    };
  }
  if (bg.kind === 'image' && bg.src) {
    return {
      backgroundImage: `url(${bg.src})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  return { backgroundColor: 'hsl(var(--signage-header-bg))' };
}
