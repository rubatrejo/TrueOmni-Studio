import type { MapSource } from '@/lib/config';

/**
 * SVG data URIs para los pins del MapCanvas. Teardrop `Combined_Shape` del
 * SVG `designs/Map/Map.svg` escalado ×2 (140×188) + icono distinto por
 * categoría centrado en el círculo blanco.
 *
 * Cada categoría tiene:
 *   - Color de teardrop único.
 *   - Icono semántico único (cubiertos / ferris wheel / cama / calendario).
 *
 * El pin seleccionado (`selectedPinSvg`) conserva el color y el icono de
 * su categoría — sólo crece en tamaño y añade un halo blanco para indicar
 * selección, sin volverse "estrella genérica".
 */

/**
 * Colores de pin por categoría — MISMOS que las tabs correspondientes en
 * `map-module.tsx` para que el usuario asocie el chip con su pin.
 */
export const MAP_PIN_COLORS: Record<MapSource, string> = {
  restaurants: '#1796d6', // Eat (tab #1796d6)
  'things-to-do': 'hsl(var(--brand-primary))', // Play (tab hsl(var(--brand-primary)))
  stay: 'hsl(var(--brand-tertiary))', // Stay (tab hsl(var(--brand-tertiary)))
  events: '#f16651', // Events (tab #f16651)
};

/** Path verbatim del teardrop `Combined_Shape` (viewBox 70×94). */
const TEARDROP_PATH =
  'M9.586,58.734h0A34.762,34.762,0,0,1,35,0,34.762,34.762,0,0,1,60.411,58.734h.043L34.394,94Z';

interface IconSpec {
  /** Element tags que se insertan tal cual (path + shapes internos). */
  body: string;
  /** viewBox del icono. El renderer lo escala al círculo blanco del pin. */
  viewBox: string;
}

/**
 * Iconos por categoría. El renderer los centra en el círculo blanco del
 * pin escalando al tamaño interior (~48×48 dentro de un círculo de r=58).
 */
const ICONS: Record<MapSource, IconSpec> = {
  // Cubiertos verbatim (Mask-4 del SVG).
  restaurants: {
    viewBox: '0 0 20 30',
    body: `<path d="M14.666,29.334c0-2.934,2-5.2,2-9.334,0-2.266-3.334-4.666-3.334-4.666C13.333,8,17.333,0,20,0V29.334a2.667,2.667,0,1,1-5.333,0Zm-12,0C2.667,25.333,4,17.083,4,15.75c0-1.6-4-1.625-4-5.625C0,6.525.542.417.542.417a16.967,16.967,0,0,1,2-.292v7.75a.845.845,0,0,0,.792.792.845.845,0,0,0,.791-.792V0H6.542V8a.755.755,0,0,0,.791.792A.845.845,0,0,0,8.125,8V.125A16.766,16.766,0,0,1,10.25.417s.417,7.441.417,9.708c0,4-4,3.991-4,5.458S8,25.333,8,29.334a2.667,2.667,0,1,1-5.333,0Z"/>`,
  },
  // Ferris wheel / rueda de la fortuna (Things to Do = fun).
  'things-to-do': {
    viewBox: '0 0 48 48',
    body: `
      <circle cx="24" cy="20" r="3.5"/>
      <circle cx="24" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <circle cx="24" cy="8.5" r="2.2"/>
      <circle cx="35.5" cy="20" r="2.2"/>
      <circle cx="24" cy="31.5" r="2.2"/>
      <circle cx="12.5" cy="20" r="2.2"/>
      <circle cx="32.5" cy="11.5" r="2.2"/>
      <circle cx="32.5" cy="28.5" r="2.2"/>
      <circle cx="15.5" cy="11.5" r="2.2"/>
      <circle cx="15.5" cy="28.5" r="2.2"/>
      <path d="M24 36 L14 46 H34 Z"/>
      <rect x="23" y="32" width="2" height="10"/>
    `,
  },
  // Cama de hotel (Mask-8 del SVG).
  stay: {
    viewBox: '0 0 31 25',
    body: `<path d="M27,25v-2.48a1.492,1.492,0,0,0-1.568-1.515H5.589C4.7,21.01,4,21.428,4,22.32V25H0V18H31v7ZM0,16.984c-.009-5.871,3.662-8.3,15.5-8.3s15.509,2.4,15.5,8.3ZM26.66,8.7V6.2c0-1.649-2.816-1.86-5.27-1.86S16,4.551,16,6.2V7.44c-.208,0-.287,0-.5,0s-.292,0-.5,0V6.2c0-1.649-2.938-1.86-5.391-1.86S4.34,4.551,4.34,6.2V8.718a9.293,9.293,0,0,0-3.1,1.706V1.86A1.862,1.862,0,0,1,3.1,0H27.9a1.863,1.863,0,0,1,1.86,1.86v8.564A9.212,9.212,0,0,0,26.66,8.7Z"/>`,
  },
  // Calendario con marker de evento (más semántico que estrella).
  events: {
    viewBox: '0 0 40 40',
    body: `
      <rect x="4" y="8" width="32" height="28" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <rect x="4" y="8" width="32" height="8" rx="3"/>
      <rect x="10" y="3" width="3" height="8" rx="1"/>
      <rect x="27" y="3" width="3" height="8" rx="1"/>
      <circle cx="14" cy="24" r="2.5"/>
      <circle cx="20" cy="24" r="2.5"/>
      <circle cx="26" cy="24" r="2.5"/>
      <circle cx="14" cy="30" r="2.5"/>
      <circle cx="20" cy="30" r="2.5"/>
    `,
  },
};

/** Tamaño del pin (doblado del SVG original: 70×94 → 140×188). */
const PIN_W = 140;
const PIN_H = 188;
const CIRCLE_CX_IN_SCALED = 70; // center x del círculo blanco en el pin 140×188
const CIRCLE_CY_IN_SCALED = 70; // center y del círculo blanco en el pin 140×188
const ICON_BOX = 56; // tamaño interior donde cabe el icono (dentro de r=58)

function renderPinIcon(source: MapSource): string {
  const icon = ICONS[source];
  const fill = MAP_PIN_COLORS[source];
  const x = CIRCLE_CX_IN_SCALED - ICON_BOX / 2;
  const y = CIRCLE_CY_IN_SCALED - ICON_BOX / 2;
  return `<svg x="${x}" y="${y}" width="${ICON_BOX}" height="${ICON_BOX}" viewBox="${icon.viewBox}" fill="${fill}" color="${fill}">${icon.body}</svg>`;
}

function buildPinSvg(source: MapSource): string {
  const fill = MAP_PIN_COLORS[source];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_W}" height="${PIN_H}" viewBox="0 0 ${PIN_W} ${PIN_H}">
    <g transform="scale(2)">
      <path d="${TEARDROP_PATH}" fill="${fill}"/>
      <g transform="translate(5 5)">
        <ellipse cx="29.988" cy="29.865" rx="28.988" ry="28.865" fill="#ffffff"/>
      </g>
    </g>
    ${renderPinIcon(source)}
  </svg>`;
}

export function pinDataUri(source: MapSource): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(buildPinSvg(source))}`;
}

/**
 * Pin seleccionado — mantiene color + icono de la categoría pero con un
 * crecimiento SUTIL (×1.12) y halo + shadow para notar la selección sin
 * taparle el sitio a la burbuja tooltip que se ancla encima.
 */
const SELECTED_W = 156;
const SELECTED_H = 210;

export function selectedPinSvg(source: MapSource): string {
  const fill = MAP_PIN_COLORS[source];
  const icon = ICONS[source];
  const scale = SELECTED_W / PIN_W; // ≈ 1.286 vs pin normal (140→180)
  // Teardrop original 70×94; tras scale ×2 = 140×188; con scale extra = 180×241.
  const teardropScale = 2 * scale;
  const circleCx = 35 * teardropScale; // center x del teardrop original
  const circleCy = 35 * teardropScale; // center y (aprox) del círculo interior
  const iconBox = ICON_BOX * scale;
  const iconX = circleCx - iconBox / 2;
  const iconY = circleCy - iconBox / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SELECTED_W}" height="${SELECTED_H}" viewBox="0 0 ${SELECTED_W} ${SELECTED_H}">
    <defs>
      <filter id="sel-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity="0.35"/>
      </filter>
    </defs>
    <g filter="url(#sel-shadow)">
      <g transform="scale(${teardropScale})">
        <path d="${TEARDROP_PATH}" fill="${fill}" stroke="#ffffff" stroke-width="3" vector-effect="non-scaling-stroke"/>
        <g transform="translate(5 5)">
          <ellipse cx="29.988" cy="29.865" rx="28.988" ry="28.865" fill="#ffffff"/>
        </g>
      </g>
      <svg x="${iconX}" y="${iconY}" width="${iconBox}" height="${iconBox}" viewBox="${icon.viewBox}" fill="${fill}" color="${fill}">${icon.body}</svg>
    </g>
  </svg>`;
}

/** Cluster — azul oscuro (primary del kiosk) 90×90 con número blanco bold. */
export function clusterSvg(count: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90">
    <circle cx="45" cy="45" r="38" fill="hsl(var(--brand-primary))" stroke="#ffffff" stroke-width="4"/>
    <text x="45" y="55" text-anchor="middle" fill="#ffffff" font-family="Helvetica, Arial, sans-serif" font-size="32" font-weight="700">${count}</text>
  </svg>`;
}
