import { isCanonicalMapSource, type CanonicalMapSource, type MapSource } from '@/lib/map-source';

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
 *
 * Estos valores se inyectan en CSS (chips, badges) — el browser resuelve la
 * `var()`. NO se pueden pasar directos a Mapbox `paint.*-color` ni a SVG
 * cargado como `<img>` (Mapbox parsea sin acceso al `:root` style). Para
 * esos casos usa `resolveMapPinColor()`.
 */
export const MAP_PIN_COLORS: Record<CanonicalMapSource, string> = {
  restaurants: 'hsl(var(--brand-secondary))', // Eat (tab hsl(var(--brand-secondary)))
  'things-to-do': 'hsl(var(--brand-primary))', // Play (tab hsl(var(--brand-primary)))
  stay: 'hsl(var(--brand-tertiary))', // Stay (tab hsl(var(--brand-tertiary)))
  events: '#f16651', // Events (tab #f16651)
  trails: '#7a8b3a', // Verde olivo — outdoor/naturaleza, distinto del azul brand
};

/** Definición resoluble del color por categoría: literal hex o nombre de CSS var. */
const MAP_PIN_CSS: Record<
  CanonicalMapSource,
  { kind: 'cssVar'; name: string } | { kind: 'literal'; value: string }
> = {
  restaurants: { kind: 'cssVar', name: '--brand-secondary' },
  'things-to-do': { kind: 'cssVar', name: '--brand-primary' },
  stay: { kind: 'cssVar', name: '--brand-tertiary' },
  events: { kind: 'literal', value: '#f16651' },
  trails: { kind: 'literal', value: '#7a8b3a' },
};

/**
 * Paleta de colores HSL para sources no canónicos (listings dinámicos:
 * Shopping, Wellness, etc). Se asigna por hash determinístico del key
 * para que cada categoría tenga un color estable a través de sesiones.
 * Evitamos los hue ranges de los 4 canónicos (azules ≈200, rojo coral ≈10,
 * olivo ≈60) y usamos verdes/morados/cian/magenta/naranja.
 */
const DYNAMIC_PIN_COLORS = [
  'hsl(280, 65%, 50%)', // morado
  'hsl(155, 60%, 42%)', // verde
  'hsl(330, 70%, 52%)', // magenta
  'hsl(180, 55%, 40%)', // cian
  'hsl(28, 80%, 55%)', // naranja
  'hsl(220, 65%, 55%)', // azul violeta
  'hsl(95, 45%, 45%)', // verde oliva claro
  'hsl(345, 60%, 55%)', // rosa
] as const;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Color estable para un source dinámico. */
export function dynamicPinColor(source: string): string {
  return DYNAMIC_PIN_COLORS[hashString(source) % DYNAMIC_PIN_COLORS.length];
}

/**
 * Resuelve el color de la categoría a un string que Mapbox y SVG-as-image
 * pueden parsear. Para canónicos lee la CSS var del `:root` en runtime y la
 * convierte al formato `hsl(H, S%, L%)`. Para no canónicos (listings
 * dinámicos como Shopping) deriva un color de la paleta vía hash
 * determinístico del key.
 */
export function resolveMapPinColor(source: MapSource): string {
  if (!isCanonicalMapSource(source)) return dynamicPinColor(source);
  const def = MAP_PIN_CSS[source as CanonicalMapSource];
  if (def.kind === 'literal') return def.value;
  if (typeof window === 'undefined') return '#000';
  const raw = getComputedStyle(document.documentElement).getPropertyValue(def.name).trim();
  if (!raw) return '#000';
  return `hsl(${raw.split(/\s+/).join(', ')})`;
}

/** Variante de `resolveMapPinColor` para una CSS var arbitraria (ej. brand-primary del cluster). */
export function resolveBrandColor(varName: string, fallback = '#000'): string {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!raw) return fallback;
  return `hsl(${raw.split(/\s+/).join(', ')})`;
}

/** Path verbatim del teardrop `Combined_Shape` (viewBox 70×94). */
const TEARDROP_PATH =
  'M9.586,58.734h0A34.762,34.762,0,0,1,35,0,34.762,34.762,0,0,1,60.411,58.734h.043L34.394,94Z';

export interface IconSpec {
  /** Element tags que se insertan tal cual (path + shapes internos). */
  body: string;
  /** viewBox del icono. El renderer lo escala al círculo blanco del pin. */
  viewBox: string;
}

/**
 * Catálogo de iconos disponibles para custom pins del MapEditor (más allá
 * de los 4 sources canónicos). El operador escoge desde el editor de pins
 * fijos para representar shopping, salud, transporte, etc. en el mapa.
 *
 * Cada icono se renderiza dentro del círculo blanco del teardrop con el
 * color de la categoría que tenga asignada (props `source` del custom pin).
 */
export const EXTENDED_ICONS: Record<string, IconSpec> = {
  shopping: {
    viewBox: '0 0 48 48',
    body: `
      <path d="M12 14h24l-3 24a3 3 0 0 1-3 2.7H18a3 3 0 0 1-3-2.7L12 14z" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M18 18v-4a6 6 0 0 1 12 0v4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    `,
  },
  coffee: {
    viewBox: '0 0 48 48',
    body: `
      <path d="M8 14h26v18a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8V14z" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M34 18h4a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4h-4" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M14 6c0 2 2 2 2 4s-2 2-2 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M22 6c0 2 2 2 2 4s-2 2-2 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `,
  },
  bar: {
    viewBox: '0 0 48 48',
    body: `
      <path d="M8 8h32l-12 16v14h6v4H14v-4h6V24L8 8z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="20" cy="18" r="2"/>
    `,
  },
  hospital: {
    viewBox: '0 0 48 48',
    body: `
      <rect x="8" y="8" width="32" height="32" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M24 16v16M16 24h16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    `,
  },
  museum: {
    viewBox: '0 0 48 48',
    body: `
      <path d="M4 18 24 6l20 12v4H4v-4z" fill="currentColor"/>
      <rect x="8" y="22" width="4" height="16"/>
      <rect x="16" y="22" width="4" height="16"/>
      <rect x="28" y="22" width="4" height="16"/>
      <rect x="36" y="22" width="4" height="16"/>
      <rect x="4" y="38" width="40" height="4"/>
    `,
  },
  bus: {
    viewBox: '0 0 48 48',
    body: `
      <rect x="8" y="8" width="32" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>
      <line x1="8" y1="22" x2="40" y2="22" stroke="currentColor" stroke-width="3"/>
      <circle cx="14" cy="38" r="3"/>
      <circle cx="34" cy="38" r="3"/>
      <rect x="12" y="12" width="8" height="6"/>
      <rect x="28" y="12" width="8" height="6"/>
    `,
  },
  beach: {
    viewBox: '0 0 48 48',
    body: `
      <circle cx="24" cy="14" r="5"/>
      <path d="M24 19v22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <path d="M4 41h40" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <path d="M14 14c-4 4-8 4-10 6 4 0 6-2 10-2zM34 14c4 4 8 4 10 6-4 0-6-2-10-2z" fill="currentColor"/>
    `,
  },
  info: {
    viewBox: '0 0 48 48',
    body: `
      <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" stroke-width="3"/>
      <circle cx="24" cy="14" r="2.5"/>
      <rect x="22" y="20" width="4" height="16" rx="1"/>
    `,
  },
  parking: {
    viewBox: '0 0 48 48',
    body: `
      <rect x="6" y="6" width="36" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M18 36V12h8a6 6 0 0 1 0 12h-8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
  star: {
    viewBox: '0 0 48 48',
    body: `<path d="M24 4l5.7 13.7 14.7 1.2-11.2 9.7 3.4 14.4L24 35.5 11.4 43l3.4-14.4L3.6 18.9l14.7-1.2L24 4z"/>`,
  },
};

/** Iconos disponibles ordenados para el picker del editor. */
export const EXTENDED_ICON_KEYS = Object.keys(EXTENDED_ICONS) as ReadonlyArray<
  keyof typeof EXTENDED_ICONS
>;

/**
 * Iconos por categoría. El renderer los centra en el círculo blanco del
 * pin escalando al tamaño interior (~48×48 dentro de un círculo de r=58).
 */
const ICONS: Record<CanonicalMapSource, IconSpec> = {
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
  // Montaña/sendero — semánticamente trail/outdoor.
  trails: {
    viewBox: '0 0 40 40',
    body: `
      <path d="M4 32 L14 16 L20 24 L28 10 L36 32 Z"/>
      <circle cx="28" cy="10" r="2" fill="#fff"/>
      <path d="M14 16 L18 22" stroke="#fff" stroke-width="1.5" fill="none"/>
    `,
  },
};

/** Tamaño del pin (doblado del SVG original: 70×94 → 140×188). */
const PIN_W = 140;
const PIN_H = 188;
const CIRCLE_CX_IN_SCALED = 70; // center x del círculo blanco en el pin 140×188
const CIRCLE_CY_IN_SCALED = 70; // center y del círculo blanco en el pin 140×188
const ICON_BOX = 56; // tamaño interior donde cabe el icono (dentro de r=58)

/**
 * Caja del icono por categoría. El teardrop es idéntico para todas, pero cada glifo
 * tiene distinto "peso visual" dentro del círculo: los cubiertos de Restaurants
 * (referencia) llenan bien, mientras la cama de Stay y, sobre todo, la rueda de
 * Things to Do se ven más pequeños a la misma caja. Agrandamos su caja para que
 * todos los iconos se vean del mismo tamaño que Restaurants. El resto usa 56.
 */
const ICON_BOX_BY_SOURCE: Partial<Record<CanonicalMapSource, number>> = {
  stay: 66,
  'things-to-do': 100,
};

function iconBoxFor(source: MapSource): number {
  return (
    (isCanonicalMapSource(source) && ICON_BOX_BY_SOURCE[source as CanonicalMapSource]) || ICON_BOX
  );
}

function renderPinIcon(source: MapSource, iconKeyOverride?: string): string {
  const icon =
    (iconKeyOverride && EXTENDED_ICONS[iconKeyOverride]) ||
    (isCanonicalMapSource(source) ? ICONS[source as CanonicalMapSource] : EXTENDED_ICONS.info);
  const fill = resolveMapPinColor(source);
  const box = iconBoxFor(source);
  const x = CIRCLE_CX_IN_SCALED - box / 2;
  const y = CIRCLE_CY_IN_SCALED - box / 2;
  return `<svg x="${x}" y="${y}" width="${box}" height="${box}" viewBox="${icon.viewBox}" fill="${fill}" color="${fill}">${icon.body}</svg>`;
}

function buildPinSvg(source: MapSource, iconKeyOverride?: string): string {
  const fill = resolveMapPinColor(source);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_W}" height="${PIN_H}" viewBox="0 0 ${PIN_W} ${PIN_H}">
    <g transform="scale(2)">
      <path d="${TEARDROP_PATH}" fill="${fill}"/>
      <g transform="translate(5 5)">
        <ellipse cx="29.988" cy="29.865" rx="28.988" ry="28.865" fill="#ffffff"/>
      </g>
    </g>
    ${renderPinIcon(source, iconKeyOverride)}
  </svg>`;
}

/**
 * Devuelve un data URI con el pin de la categoría. Si `iconKeyOverride` está
 * presente y existe en el catálogo extendido, sustituye el icono canónico.
 */
export function pinDataUri(source: MapSource, iconKeyOverride?: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(buildPinSvg(source, iconKeyOverride))}`;
}

/** Sources canónicos del Map, para enumerar/materializar pins (export standalone). */
export const CANONICAL_MAP_SOURCES = [
  'restaurants',
  'things-to-do',
  'stay',
  'events',
  'trails',
] as const;

/**
 * Construye el SVG completo de un pin con un COLOR LITERAL (sin depender del
 * browser / `getComputedStyle`). Lo usa el export standalone para materializar
 * los pins del Map y del Trip Planner como ARCHIVOS `.svg` (no inline), igual
 * que `buildPinSvg` pero recibiendo el color ya resuelto.
 */
export function pinSvgWithColor(
  source: MapSource,
  color: string,
  iconKeyOverride?: string,
): string {
  const icon =
    (iconKeyOverride && EXTENDED_ICONS[iconKeyOverride]) ||
    (isCanonicalMapSource(source) ? ICONS[source as CanonicalMapSource] : EXTENDED_ICONS.info);
  const box = iconBoxFor(source);
  const x = CIRCLE_CX_IN_SCALED - box / 2;
  const y = CIRCLE_CY_IN_SCALED - box / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_W}" height="${PIN_H}" viewBox="0 0 ${PIN_W} ${PIN_H}">
    <g transform="scale(2)">
      <path d="${TEARDROP_PATH}" fill="${color}"/>
      <g transform="translate(5 5)">
        <ellipse cx="29.988" cy="29.865" rx="28.988" ry="28.865" fill="#ffffff"/>
      </g>
    </g>
    <svg x="${x}" y="${y}" width="${box}" height="${box}" viewBox="${icon.viewBox}" fill="${color}" color="${color}">${icon.body}</svg>
  </svg>`;
}

/**
 * Resuelve el color de un pin canónico para el export, sin browser: los
 * literales (events/trails) van directos; los basados en CSS var se resuelven
 * contra los `--brand-*` HSL extraídos del `tokens.css` del cliente. Mantiene
 * el mapeo source→var como única fuente de verdad aquí (no se duplica fuera).
 */
export function pinColorForExport(
  source: CanonicalMapSource,
  brandVars: Record<string, string>,
): string {
  const def = MAP_PIN_CSS[source];
  if (def.kind === 'literal') return def.value;
  const raw = (brandVars[def.name] ?? '').trim();
  return raw ? `hsl(${raw.split(/\s+/).join(', ')})` : '#000';
}

/**
 * Pin seleccionado — mantiene color + icono de la categoría pero con un
 * crecimiento SUTIL (×1.12) y halo + shadow para notar la selección sin
 * taparle el sitio a la burbuja tooltip que se ancla encima.
 */
const SELECTED_W = 156;
const SELECTED_H = 210;

export function selectedPinSvg(source: MapSource, iconKeyOverride?: string): string {
  const fill = resolveMapPinColor(source);
  const icon =
    (iconKeyOverride && EXTENDED_ICONS[iconKeyOverride]) ||
    (isCanonicalMapSource(source) ? ICONS[source as CanonicalMapSource] : EXTENDED_ICONS.info);
  const scale = SELECTED_W / PIN_W; // ≈ 1.286 vs pin normal (140→180)
  // Teardrop original 70×94; tras scale ×2 = 140×188; con scale extra = 180×241.
  const teardropScale = 2 * scale;
  const circleCx = 35 * teardropScale; // center x del teardrop original
  const circleCy = 35 * teardropScale; // center y (aprox) del círculo interior
  const iconBox = iconBoxFor(source) * scale;
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

/**
 * SVG de un custom pin: teardrop con un icono arbitrario del catálogo
 * extendido y un color literal (no CSS var). Lo usan los pins fijos del
 * MapEditor que el operador añade manualmente.
 */
export function customPinSvg(iconKey: string, color: string): string {
  const icon = EXTENDED_ICONS[iconKey] ?? EXTENDED_ICONS.info;
  const x = CIRCLE_CX_IN_SCALED - ICON_BOX / 2;
  const y = CIRCLE_CY_IN_SCALED - ICON_BOX / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_W}" height="${PIN_H}" viewBox="0 0 ${PIN_W} ${PIN_H}">
    <g transform="scale(2)">
      <path d="${TEARDROP_PATH}" fill="${color}"/>
      <g transform="translate(5 5)">
        <ellipse cx="29.988" cy="29.865" rx="28.988" ry="28.865" fill="#ffffff"/>
      </g>
    </g>
    <svg x="${x}" y="${y}" width="${ICON_BOX}" height="${ICON_BOX}" viewBox="${icon.viewBox}" fill="${color}" color="${color}">${icon.body}</svg>
  </svg>`;
}

/** Cluster — azul oscuro (primary del kiosk) 90×90 con número blanco bold. */
export function clusterSvg(count: number): string {
  const fill = resolveBrandColor('--brand-primary', '#0066cc');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 90 90">
    <circle cx="45" cy="45" r="38" fill="${fill}" stroke="#ffffff" stroke-width="4"/>
    <text x="45" y="55" text-anchor="middle" fill="#ffffff" font-family="Helvetica, Arial, sans-serif" font-size="32" font-weight="700">${count}</text>
  </svg>`;
}
