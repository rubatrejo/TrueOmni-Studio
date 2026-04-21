import type { Listing } from './config';

/** Orden disponibles en el overlay de sort. `popularity` = default. */
export type SortOrder = 'popularity' | 'alpha' | 'distance' | 'price';

export interface SortLabel {
  value: SortOrder;
  label: string;
}

export const SORT_OPTIONS: readonly SortLabel[] = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'alpha', label: 'Alphabetical A–Z' },
  { value: 'distance', label: 'Distance (closest)' },
  { value: 'price', label: 'Price (low to high)' },
];

/** Distancia Haversine en millas. */
export function haversineMi(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R_MI = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Ordena una lista de listings según `order`. No muta la entrada.
 * `origin` es obligatorio para `distance` (cliente sin coords → fallback a popularity).
 */
export function sortListings(
  listings: readonly Listing[],
  order: SortOrder,
  origin?: { lat: number; lng: number },
): Listing[] {
  const arr = [...listings];
  switch (order) {
    case 'alpha':
      arr.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
      break;
    case 'price':
      arr.sort((a, b) => a.priceRange - b.priceRange || b.popularity - a.popularity);
      break;
    case 'distance':
      if (!origin) {
        arr.sort((a, b) => b.popularity - a.popularity);
      } else {
        arr.sort((a, b) => haversineMi(origin, a.coords) - haversineMi(origin, b.coords));
      }
      break;
    case 'popularity':
    default:
      arr.sort((a, b) => b.popularity - a.popularity);
      break;
  }
  return arr;
}
