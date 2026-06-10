/**
 * Paletas preset del Studio — fuente única.
 *
 * Antes vivían dentro de `EditorPanel.tsx` (Client Component), así que el server
 * (p. ej. el POST de creación de cliente al aplicar un starter) no podía
 * resolver `paletteId → colores`. Extraídas aquí como datos puros (sin
 * `'use client'` ni `server-only`) para consumirlas desde ambos lados:
 *   - el picker de paletas del editor kiosk (EditorPanel),
 *   - el override de starter en `api/studio/clients` (server),
 *   - los swatches del selector de starters (NewClientModal).
 *
 * Los `name` coinciden con `Starter.paletteId` en `starters.ts`.
 */

export interface PresetPalette {
  name: string;
  tagline: string;
  /** Hex `#RRGGBB`. */
  primary: string;
  secondary: string;
  tertiary: string;
}

export const PRESET_PALETTES: readonly PresetPalette[] = [
  {
    name: 'TrueOmni',
    tagline: 'Tech Blue',
    primary: '#004F8B',
    secondary: '#0088CE',
    tertiary: '#B9BD39',
  },
  {
    name: 'Arizona',
    tagline: 'Desert',
    primary: '#5C2317',
    secondary: '#D2691E',
    tertiary: '#F4A460',
  },
  {
    name: 'Hotel Beach',
    tagline: 'Calm',
    primary: '#1E5F74',
    secondary: '#42B5D9',
    tertiary: '#FCD581',
  },
  {
    name: 'Forest',
    tagline: 'Nature',
    primary: '#173B30',
    secondary: '#3E885B',
    tertiary: '#E0C879',
  },
  {
    name: 'Mono',
    tagline: 'Editorial',
    primary: '#0A0A0A',
    secondary: '#404040',
    tertiary: '#FACC15',
  },
  {
    name: 'Sunset',
    tagline: 'Warm',
    primary: '#7C2D12',
    secondary: '#EA580C',
    tertiary: '#FCD34D',
  },
];

/** Resuelve una paleta por su `name` (== `Starter.paletteId`). */
export function findPalette(name: string): PresetPalette | undefined {
  return PRESET_PALETTES.find((p) => p.name === name);
}
