'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import type { PwaConnectHoursDay, PwaConnectSocial } from '@/lib/config';

import { PwaBottomNav } from './bottom-nav';
import { ConnectMap } from './connect-map';
import { useDevice } from './device-context';
import { S } from './mobile-layer';
import { PwaSubHeader } from './pwa-sub-header';

/* Tokens (white-label): cero hex de branding en JSX; `#fff` (3 dígitos) es blanco puro
   y no lo caza el auditor. El rojo del pin vive en `connect-map.tsx` (marcador de mapa). */
const BRAND = 'hsl(var(--brand-primary))';
const PWA = 'hsl(var(--pwa-primary))';
const FG = 'hsl(var(--foreground))';
const FG_MUTED = 'hsl(var(--foreground) / 0.47)';
const HAIRLINE = 'hsl(var(--foreground) / 0.4)'; // ≈ #999 del XD
const CHEVRON = 'hsl(var(--foreground) / 0.72)'; // ≈ #444 del XD
const FOOTER_DIV = 'hsl(var(--foreground) / 0.07)';
const OPEN_SANS = 'var(--font-open-sans)';

/* Geometría del XD (canvas 375×921). El header (88) y el nav (56 @ y857) son fijos;
   el bloque central scrollea. Coords locales del centro = canvas_y − HEADER_H. */
const HEADER_H = 90;
const MIDDLE_H = 769; // 857 − 88
const MAP_TOP = 335; // canvas 423 − 88
const MAP_H = 182;

/* ---- Paths verbatim del SVG (Connect With Us.svg) ---- */

// Marca geométrica "omni" del logo (Logo_Image), tokenizada a brand-primary.
// Nota: es la marca del cliente default; el override por cliente llega con el Studio (Pz).
const OMNI_MARK: { d: string; t?: string }[] = [
  {
    d: 'M68.307,86.748a19.189,19.189,0,0,1-9.6-2.574L43.631,99.248a40.139,40.139,0,0,0,49.7-.257L78.284,83.948a19.19,19.19,0,0,1-9.977,2.8',
    t: 'translate(-6.996 -13.46)',
  },
  {
    d: 'M68.314,16.305a40.068,40.068,0,0,0-24.636,8.459L58.755,39.841a19.189,19.189,0,0,1,19.493.227L93.3,25.021a40.089,40.089,0,0,0-24.981-8.716',
    t: 'translate(-7.003 -2.614)',
  },
  {
    d: 'M113.22,69.84a39.9,39.9,0,0,0-.01-31.736L137.752,0,108.078,29.391c-.021-.028-.039-.057-.06-.084L92.944,44.381a19.208,19.208,0,0,1,.027,19.162v0l-.028,0,3.191,3.16L108.047,78.62c.017-.021.031-.045.048-.066l29.657,29.374Z',
    t: 'translate(-14.903 0)',
  },
  {
    d: 'M24.532,69.84a39.9,39.9,0,0,1,.01-31.736L0,0,29.674,29.391c.021-.028.039-.057.06-.084L44.808,44.381a19.208,19.208,0,0,0-.027,19.162v0l.028,0-3.191,3.16L29.7,78.62c-.017-.021-.031-.045-.048-.066L0,107.927Z',
  },
];

// Anillo circular común de los iconos sociales (Page_1_Copy / google_plus).
const SOCIAL_RING =
  'M21.743-.435a22.239,22.239,0,0,1,15.68,6.42,21.839,21.839,0,0,1,4.754,6.969,21.765,21.765,0,0,1,0,17.072A21.839,21.839,0,0,1,37.424,37a22.4,22.4,0,0,1-24.312,4.7A22.12,22.12,0,0,1,6.063,37a21.839,21.839,0,0,1-4.754-6.969,21.765,21.765,0,0,1,0-17.072A21.839,21.839,0,0,1,6.063,5.985a22.239,22.239,0,0,1,15.68-6.42Zm0,42.98a21.369,21.369,0,0,0,15.069-6.169,20.974,20.974,0,0,0,4.566-6.693,20.9,20.9,0,0,0,0-16.388A20.974,20.974,0,0,0,36.813,6.6,21.532,21.532,0,0,0,13.448,2.09,21.254,21.254,0,0,0,6.674,6.6,20.974,20.974,0,0,0,2.108,13.3a20.9,20.9,0,0,0,0,16.388,20.974,20.974,0,0,0,4.566,6.693,21.369,21.369,0,0,0,15.069,6.169Z';

const SOCIAL_GLYPH = {
  x: {
    d: 'M15.977,1.73h3.111L12.291,9.5l8,10.569h-6.26l-4.9-6.411L3.513,20.067H.4l7.27-8.309L0,1.73H6.419l4.432,5.86ZM14.886,18.205h1.724L5.483,3.494H3.633Z',
    t: 'translate(11.577 10.571)',
  },
  facebook: {
    d: 'M10.716,11.146H7.541V23.22H2.828V11.146H0V7.43H2.828V5.192C2.83,1.934,4.2,0,8.1,0h3.213V3.715H9.156c-1.517,0-1.615.557-1.615,1.6V7.43h3.771Z',
    t: 'translate(15.14 9.976)',
  },
  instagram: {
    d: 'M8.826,17.447c-1.746,0-2.972-.019-3.643-.057a5.457,5.457,0,0,1-3.7-1.409A5.322,5.322,0,0,1,.058,12.325C.019,11.657,0,10.479,0,8.724s.019-2.934.058-3.6A5.319,5.319,0,0,1,1.482,1.465,5.452,5.452,0,0,1,5.183.057C5.854.019,7.08,0,8.826,0S11.8.019,12.47.057a5.452,5.452,0,0,1,3.7,1.409A5.319,5.319,0,0,1,17.6,5.123c.039.667.058,1.845.058,3.6s-.019,2.933-.058,3.6a5.322,5.322,0,0,1-1.425,3.658,5.457,5.457,0,0,1-3.7,1.409C11.8,17.428,10.573,17.447,8.826,17.447Zm0-1.568.879.005.7,0c.2,0,.372,0,.51,0,.285,0,.658-.015,1.109-.033a9.437,9.437,0,0,0,1.184-.114,4.724,4.724,0,0,0,.822-.21,2.988,2.988,0,0,0,1.011-.659,2.951,2.951,0,0,0,.667-1,4.531,4.531,0,0,0,.212-.812,8.877,8.877,0,0,0,.115-1.17c.02-.473.031-.832.034-1.1s0-.675,0-1.2-.005-.815-.005-.868,0-.343.005-.869,0-.926,0-1.2-.015-.623-.034-1.1a8.877,8.877,0,0,0-.115-1.17,4.452,4.452,0,0,0-.212-.812,2.951,2.951,0,0,0-.667-1,2.988,2.988,0,0,0-1.011-.659,4.666,4.666,0,0,0-.822-.211A9.283,9.283,0,0,0,12.027,1.6c-.437-.018-.811-.029-1.109-.034q-.207,0-.51,0l-.7,0-.879.006-.879-.006-.7,0q-.3,0-.51,0c-.3,0-.679.017-1.109.034a9.284,9.284,0,0,0-1.184.113,4.665,4.665,0,0,0-.822.211,2.988,2.988,0,0,0-1.011.659,2.951,2.951,0,0,0-.667,1,4.452,4.452,0,0,0-.212.812,8.877,8.877,0,0,0-.115,1.17c-.02.473-.031.832-.034,1.1s0,.675,0,1.2.005.816.005.869,0,.343-.005.868,0,.927,0,1.2.015.623.034,1.1a8.877,8.877,0,0,0,.115,1.17,4.531,4.531,0,0,0,.212.812,2.951,2.951,0,0,0,.667,1,2.988,2.988,0,0,0,1.011.659,4.725,4.725,0,0,0,.822.21,9.437,9.437,0,0,0,1.184.114c.45.018.823.03,1.109.033.137,0,.309,0,.51,0l.7,0Zm0-2.68A4.411,4.411,0,0,1,5.62,11.893,4.306,4.306,0,0,1,4.3,8.724,4.306,4.306,0,0,1,5.62,5.555,4.411,4.411,0,0,1,8.826,4.248a4.411,4.411,0,0,1,3.207,1.307,4.306,4.306,0,0,1,1.321,3.169,4.306,4.306,0,0,1-1.321,3.169A4.411,4.411,0,0,1,8.826,13.2Zm0-7.384a2.862,2.862,0,0,0-2.08.851,2.883,2.883,0,0,0,0,4.112,2.964,2.964,0,0,0,4.16,0,2.883,2.883,0,0,0,0-4.112A2.862,2.862,0,0,0,8.826,5.816Zm4.712-.7a1.026,1.026,0,0,1-.747-.306,1.033,1.033,0,0,1,0-1.477,1.063,1.063,0,0,1,1.494,0,1.035,1.035,0,0,1,0,1.477A1.029,1.029,0,0,1,13.539,5.111Z',
    t: 'translate(12.988 12.758)',
  },
  pinterest: {
    d: 'M0,6.781A6.2,6.2,0,0,1,.431,4.47,5.919,5.919,0,0,1,1.62,2.578,8.14,8.14,0,0,1,5.493.3,9.2,9.2,0,0,1,7.815,0a7.662,7.662,0,0,1,3.379.755,6.358,6.358,0,0,1,2.54,2.2,5.68,5.68,0,0,1,.977,3.26,10.413,10.413,0,0,1-.218,2.135,8.558,8.558,0,0,1-.69,2.011,7,7,0,0,1-1.149,1.7,4.986,4.986,0,0,1-1.666,1.17,5.309,5.309,0,0,1-2.172.437A3.6,3.6,0,0,1,7.263,13.3a2.3,2.3,0,0,1-1.1-1q-.115.443-.322,1.278t-.27,1.079q-.063.244-.236.806a5.314,5.314,0,0,1-.3.806l-.368.71a8.029,8.029,0,0,1-.529.88q-.287.415-.713.983l-.161.057-.1-.114Q2.988,17,2.988,16.652a12.686,12.686,0,0,1,.247-2.346q.247-1.3.764-3.266t.6-2.306a4.316,4.316,0,0,1-.368-1.92,2.976,2.976,0,0,1,.6-1.772,1.8,1.8,0,0,1,1.517-.829,1.355,1.355,0,0,1,1.092.46,1.736,1.736,0,0,1,.391,1.164,7.119,7.119,0,0,1-.506,2.17,7.1,7.1,0,0,0-.506,2.124,1.538,1.538,0,0,0,.517,1.187,1.793,1.793,0,0,0,1.253.471,2.481,2.481,0,0,0,1.172-.284,2.635,2.635,0,0,0,.9-.772A6.512,6.512,0,0,0,11.3,9.655,6.164,6.164,0,0,0,11.74,8.4a12.268,12.268,0,0,0,.23-1.261,9.11,9.11,0,0,0,.075-1.13,3.844,3.844,0,0,0-1.258-3.061A4.815,4.815,0,0,0,7.5,1.851,5.34,5.34,0,0,0,3.666,3.322a4.938,4.938,0,0,0-1.54,3.731,3.257,3.257,0,0,0,.144.966,3.315,3.315,0,0,0,.31.738q.167.273.31.517a.854.854,0,0,1,.144.346,2.738,2.738,0,0,1-.172.829q-.172.511-.425.511-.023,0-.2-.034a2.355,2.355,0,0,1-1.04-.636A3.308,3.308,0,0,1,.5,9.218,6.938,6.938,0,0,1,.126,7.991,6.038,6.038,0,0,1,0,6.781Z',
    t: 'translate(14.459 11.304)',
  },
} as const;

// Iconos de acción (Material 24px), tokenizados a brand-primary.
const ICON_PHONE =
  'M14.978,12.947a1.117,1.117,0,0,0-1.138.006l-1.779,1.06a1.114,1.114,0,0,1-1.261-.076A28.948,28.948,0,0,1,8.268,11.73,28.947,28.947,0,0,1,6.061,9.2a1.114,1.114,0,0,1-.076-1.261l1.06-1.779a1.121,1.121,0,0,0,0-1.142L4.439.557A1.125,1.125,0,0,0,3.2.033,3.689,3.689,0,0,0,1.47,1.071C-.543,3.083-1.611,6.477,5.956,14.044s10.96,6.5,12.973,4.486A3.7,3.7,0,0,0,19.968,16.8a1.12,1.12,0,0,0-.522-1.237Z';
const ICON_WEBSITE =
  'M6.725,19H5.218a.444.444,0,0,1,0-.888H6.725a3.405,3.405,0,0,0,2.79-1.331H.435A.44.44,0,0,1,0,16.337V6.129H20V16.337a.44.44,0,0,1-.435.444h-9a6.087,6.087,0,0,0,.74-3.016V9.42l2.3,2.349a.429.429,0,0,0,.615,0,.45.45,0,0,0,0-.627L11.177,8.035a.427.427,0,0,0-.615,0L7.519,11.141a.449.449,0,0,0,0,.627.429.429,0,0,0,.615,0l2.3-2.349v4.345a4.862,4.862,0,0,1-.92,3.016h1.048A4.314,4.314,0,0,1,6.725,19ZM20,5.21H0V1.235A1.238,1.238,0,0,1,1.237,0H18.763A1.238,1.238,0,0,1,20,1.235V5.209ZM7.273,1.839V3.677h10.3V1.839Zm-2.121,0a.919.919,0,1,0,.909.919A.915.915,0,0,0,5.152,1.839Zm-2.425,0a.919.919,0,1,0,.909.919A.915.915,0,0,0,2.727,1.839Z';
const ICON_DIRECTIONS =
  'M5.274,20.286a.4.4,0,0,1-.178-.043L.229,17.81A.417.417,0,0,1,0,17.442V2.84A.4.4,0,0,1,.19,2.5a.448.448,0,0,1,.2-.064H.415a.357.357,0,0,1,.168.038l4.7,2.358L6.5,4.271c.129,3.684,3.542,7.819,3.93,8.278a1.212,1.212,0,0,0,1.864-.013c.38-.457,3.722-4.572,3.918-8.164L19.69,2.485a.424.424,0,0,1,.2-.053.373.373,0,0,1,.192.053.421.421,0,0,1,.2.355v14.6a.411.411,0,0,1-.216.355l-4.463,2.434a.389.389,0,0,1-.19.05.377.377,0,0,1-.165-.038l-5.1-2.345-4.7,2.345A.4.4,0,0,1,5.274,20.286Zm6.086-8.117a.393.393,0,0,1-.3-.14C11.019,11.986,7.3,7.6,7.3,4.056a4.057,4.057,0,0,1,8.114,0c0,3.407-3.588,7.776-3.74,7.96A.422.422,0,0,1,11.361,12.169Zm0-9.329a1.623,1.623,0,1,0,1.623,1.623A1.625,1.625,0,0,0,11.361,2.84Z';
const ICON_CLOCK =
  'M9.158,18.333a9.167,9.167,0,1,1,9.176-9.167A9.172,9.172,0,0,1,9.158,18.333Zm.009-16.5A7.333,7.333,0,1,0,16.5,9.167,7.342,7.342,0,0,0,9.167,1.833Zm3.9,11.138h0L8.25,10.083v-5.5H9.625V9.4l4.125,2.448-.688,1.126Z';
const ICON_CHEVRON_RIGHT = 'M0,1.421,1.458,0l6.25,6.088-6.25,6.088L0,10.756,4.792,6.088Z';

interface ConnectWithUsScreenProps {
  title: string;
  orgName: string;
  social?: PwaConnectSocial;
  phone?: string;
  website?: string;
  actions: { call: string; website: string; directions: string };
  address?: string;
  statusText?: string;
  modalTitle: string;
  schedule: PwaConnectHoursDay[];
  copyright?: string;
  coords: { lat: number; lng: number };
  mapboxToken?: string;
}

/**
 * Connect With Us (`/pwa/connect-with-us`) — sub-pantalla abierta desde el More.
 *
 * El bloque central se renderiza como SVG inline en el espacio del XD (375-space):
 * paths y baselines verbatim → exactitud sin recalcular coords. El mapa Mapbox vive
 * como overlay HTML (fuera del `scale` del SVG para no romper la interacción pan/zoom).
 * Header + bottom nav siguen el patrón de las demás pantallas PWA.
 */
export function ConnectWithUsScreen({
  title,
  orgName,
  social,
  phone,
  website,
  actions,
  address,
  statusText,
  modalTitle,
  schedule,
  copyright,
  coords,
  mapboxToken,
}: ConnectWithUsScreenProps) {
  const router = useRouter();
  const { isTablet, isLandscape } = useDevice();
  const [hoursOpen, setHoursOpen] = useState(false);
  useEscapeToClose(hoursOpen, () => setHoursOpen(false));

  // En tablet el mapa va más alto; el bloque inferior (dirección + footer) se
  // empuja hacia abajo por el delta vía un <g transform> (phone = pixel-perfect,
  // delta 0). MIDDLE_H crece para reservar el alto extra del SVG.
  const mapH = isTablet ? 360 : MAP_H;
  const belowDelta = mapH - MAP_H;
  const middleH = MIDDLE_H + belowDelta;

  const open = (url?: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;

  // Slots fijos de los 4 sociales (x del XD); solo se pinta el que tiene URL.
  const socialSlots: {
    key: keyof PwaConnectSocial;
    x: number;
    glyph: keyof typeof SOCIAL_GLYPH;
  }[] = [
    { key: 'x', x: 20, glyph: 'x' },
    { key: 'facebook', x: 78, glyph: 'facebook' },
    { key: 'instagram', x: 253, glyph: 'instagram' },
    { key: 'pinterest', x: 311, glyph: 'pinterest' },
  ];

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header fijo (brand): PwaSubHeader estándar (back + título). En phone va en
          la caja 375-space escalada; en tablet se renderiza full-width vía portal. */}
      <div className="relative z-10 shrink-0" style={{ height: HEADER_H * S }}>
        <div
          className="absolute left-0 top-0"
          style={{
            width: 375,
            height: HEADER_H,
            transform: `scale(${S})`,
            transformOrigin: 'top left',
          }}
        >
          <PwaSubHeader title={title} onBack={() => router.push('/pwa/more')} />
        </div>
      </div>

      {/* Centro scrollable: SVG estático + overlay del mapa (fuera del scale). */}
      <div className="scrollbar-hide relative flex-1 overflow-y-auto bg-background">
        <div className="relative" style={{ height: middleH * S }}>
          <svg
            className="absolute left-0 top-0"
            width="100%"
            height={middleH * S}
            viewBox={`0 0 375 ${middleH}`}
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Marca omni (brand) */}
            <g transform="translate(126.729 41.305)">
              {OMNI_MARK.map((p, i) => (
                <path key={i} d={p.d} transform={p.t} fill={BRAND} />
              ))}
            </g>

            {/* Iconos sociales (pwa-primary) */}
            {socialSlots.map((s) => {
              const url = social?.[s.key];
              if (!url) return null;
              const g = SOCIAL_GLYPH[s.glyph];
              return (
                <g
                  key={s.key}
                  transform={`translate(${s.x} 74)`}
                  role="button"
                  aria-label={s.key}
                  style={{ cursor: 'pointer' }}
                  onClick={() => open(url)}
                >
                  <path d={SOCIAL_RING} fill={PWA} />
                  <path d={g.d} transform={g.t} fill={PWA} />
                </g>
              );
            })}

            {/* Nombre de la organización (brand) */}
            <text
              x={187.5}
              y={180}
              textAnchor="middle"
              fill={BRAND}
              style={{ fontFamily: OPEN_SANS, fontWeight: 600, fontSize: 14 }}
            >
              {orgName}
            </text>

            {/* Acciones: Call / Website / Directions */}
            <g
              role="button"
              aria-label={actions.call}
              style={{ cursor: 'pointer' }}
              onClick={() => phone && (window.location.href = `tel:${phone}`)}
            >
              <path d={ICON_PHONE} transform="translate(55 210)" fill={BRAND} />
              <text
                x={65}
                y={248}
                textAnchor="middle"
                fill={BRAND}
                style={{ fontFamily: OPEN_SANS, fontWeight: 600, fontSize: 14 }}
              >
                {actions.call}
              </text>
            </g>
            <g
              role="button"
              aria-label={actions.website}
              style={{ cursor: 'pointer' }}
              onClick={() => open(website)}
            >
              <path d={ICON_WEBSITE} transform="translate(173 210)" fill={BRAND} />
              <text
                x={183}
                y={248}
                textAnchor="middle"
                fill={BRAND}
                style={{ fontFamily: OPEN_SANS, fontWeight: 600, fontSize: 14 }}
              >
                {actions.website}
              </text>
            </g>
            <g
              role="button"
              aria-label={actions.directions}
              style={{ cursor: 'pointer' }}
              onClick={() => open(directionsUrl)}
            >
              <path d={ICON_DIRECTIONS} transform="translate(295.5 209)" fill={BRAND} />
              <text
                x={306}
                y={248}
                textAnchor="middle"
                fill={BRAND}
                style={{ fontFamily: OPEN_SANS, fontWeight: 600, fontSize: 14 }}
              >
                {actions.directions}
              </text>
            </g>

            {/* Hairline sobre la fila de horario */}
            <rect x={0} y={265} width={375} height={1} fill={HAIRLINE} />

            {/* Fila de horario (abre modal) */}
            <g
              role="button"
              aria-label={statusText}
              style={{ cursor: 'pointer' }}
              onClick={() => setHoursOpen(true)}
            >
              <rect x={0} y={266} width={375} height={69} fill="transparent" />
              <g transform="translate(23 291)">
                <path d={ICON_CLOCK} transform="translate(1.833 1.833)" fill={FG} />
              </g>
              <text
                x={62}
                y={306.338}
                fill={FG}
                style={{ fontFamily: OPEN_SANS, fontWeight: 400, fontSize: 16 }}
              >
                {statusText}
              </text>
              <g transform="translate(328 289.338)">
                <path d={ICON_CHEVRON_RIGHT} transform="translate(8.958 6.088)" fill={CHEVRON} />
              </g>
            </g>

            {/* Hairline bajo la fila de horario (sobre el mapa) */}
            <rect x={0} y={333.985} width={375} height={1.015} fill={HAIRLINE} />

            {/* Bloque inferior (dirección + footer): se empuja hacia abajo en tablet
                por `belowDelta` (= mapa más alto). En phone belowDelta=0 → idéntico. */}
            <g transform={belowDelta ? `translate(0 ${belowDelta})` : undefined}>
              {/* Dirección */}
              <text
                x={18}
                y={543}
                fill={FG}
                style={{ fontFamily: OPEN_SANS, fontWeight: 400, fontSize: 12 }}
              >
                {address}
              </text>

              {/* Copyright (auto-wrap, centrado) */}
              <foreignObject x={12} y={560} width={351} height={64}>
                <div
                  style={{
                    fontFamily: OPEN_SANS,
                    fontSize: 12,
                    lineHeight: '17px',
                    textAlign: 'center',
                    color: FG,
                  }}
                >
                  {copyright}
                </div>
              </foreignObject>

              {/* Divider del footer */}
              <rect x={13} y={633} width={350} height={2} rx={1} fill={FOOTER_DIV} />

              {/* Footer del producto (fijo, no white-label) */}
              <text
                x={187.5}
                y={674}
                textAnchor="middle"
                fill={FG_MUTED}
                style={{ fontFamily: OPEN_SANS, fontWeight: 400, fontSize: 10 }}
              >
                Designed and built by
              </text>
              <foreignObject x={0} y={685} width={375} height={24}>
                <div style={{ display: 'flex', justifyContent: 'center', color: FG }}>
                  {/* slot="brand" → marca propia TrueOmni, nunca la sobrescribe el Studio */}
                  <TrueOmniLogo className="h-[18px] w-auto" slot="brand" />
                </div>
              </foreignObject>
              <text
                x={187.5}
                y={738}
                textAnchor="middle"
                fill={FG}
                style={{ fontFamily: OPEN_SANS, fontWeight: 400, fontSize: 10 }}
              >
                trueomni.com
              </text>
            </g>
          </svg>

          {/* Mapa interactivo (overlay HTML, fuera del scale del SVG). Más alto en
              tablet (mapH). El SVG se centra (meet) a 390px; alineamos el mapa a ese
              mismo ancho y centro. En landscape el mapa va FULL-WIDTH (rompe la
              columna centrada del contenido). */}
          <div
            className="absolute overflow-hidden"
            style={{
              top: MAP_TOP * S,
              left: isLandscape ? 0 : '50%',
              transform: isLandscape ? 'none' : 'translateX(-50%)',
              width: isLandscape ? '100%' : 375 * S,
              height: mapH * S,
            }}
          >
            <ConnectMap token={mapboxToken} coords={coords} className="h-full w-full" />
          </div>
        </div>
      </div>

      {/* Bottom nav (sin celda activa: sub-pantalla) */}
      <PwaBottomNav />

      {/* Modal de horarios (scrim = botón a pantalla completa, patrón del kiosk) */}
      {hoursOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cwu-hours-title"
          className="absolute inset-0 z-20 flex items-end justify-center"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setHoursOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50 focus:outline-none"
            tabIndex={-1}
          />
          <div className="relative w-full rounded-t-3xl bg-background p-6 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="cwu-hours-title"
                className="font-bold text-foreground"
                style={{ fontFamily: OPEN_SANS, fontSize: 18 }}
              >
                {modalTitle}
              </h2>
              <button
                type="button"
                aria-label="Close"
                className="text-2xl leading-none text-foreground/60"
                onClick={() => setHoursOpen(false)}
              >
                ×
              </button>
            </div>
            <ul className="space-y-2">
              {schedule.map((d) => (
                <li
                  key={d.day}
                  className="flex items-center justify-between text-foreground"
                  style={{ fontFamily: OPEN_SANS, fontSize: 14 }}
                >
                  <span>{d.day}</span>
                  <span className="text-foreground/70">
                    {d.closed || !d.open ? 'Closed' : `${d.open} – ${d.close}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
