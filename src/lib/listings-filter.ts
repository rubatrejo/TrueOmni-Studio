import type { Listing } from './config';

/** Estado del overlay de filtro. Vacío (all false/empty) = sin filtro. */
export interface FilterState {
  /** Tags de features activos (multi-select). AND con el listing: debe tener TODOS. */
  features: readonly string[];
  /** Subcategorías activas (multi-select). OR: el listing debe estar en alguna. */
  subcategories: readonly string[];
  /** Rangos de precio 1-4 (multi-select, OR). */
  priceRanges: readonly (1 | 2 | 3 | 4)[];
  /** Solo abiertos ahora (cruza openHours con hora actual). */
  openNow: boolean;
  /**
   * Venues activos (multi-select, OR) — solo usado por el overlay de Events.
   * `applyFilters` (listings) lo ignora; la traducción a `EventsFilterState` la
   * hace la pantalla de Events.
   */
  venues?: readonly string[];
  /** Chip "Free" (solo Events) — gratis. `applyFilters` lo ignora. */
  free?: boolean;
  /**
   * Dificultades activas (multi-select, OR) — solo módulo Trails. `applyFilters`
   * filtra por `listing.difficulty` (poblado por `trailToPwaListing`); los listings
   * normales no tienen ese campo y nunca se ven afectados.
   */
  difficulties?: readonly string[];
  /** Tipos de trail activos (multi-select, OR) — solo módulo Trails. Ver `difficulties`. */
  trailTypes?: readonly string[];
}

/** Estado vacío por defecto. */
export const EMPTY_FILTER: FilterState = Object.freeze({
  features: [],
  subcategories: [],
  priceRanges: [],
  openNow: false,
});

export function isFilterEmpty(f: FilterState): boolean {
  return (
    f.features.length === 0 &&
    f.subcategories.length === 0 &&
    f.priceRanges.length === 0 &&
    !f.openNow &&
    (f.difficulties?.length ?? 0) === 0 &&
    (f.trailTypes?.length ?? 0) === 0
  );
}

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function isOpenNow(listing: Listing, now: Date): boolean {
  if (!listing.openHours) return true; // Sin horario = siempre abierto
  const dayKey = DAYS[now.getDay()];
  const range = listing.openHours[dayKey];
  if (!range) return false;
  const [open, close] = range;
  const hour = now.getHours() + now.getMinutes() / 60;
  // Soporta rangos que cruzan medianoche (close ≤ open).
  if (close <= open) {
    return hour >= open || hour < close;
  }
  return hour >= open && hour < close;
}

/**
 * Aplica el filtro a la lista. No muta.
 *
 * Semántica:
 *   - features: AND (listing debe tener TODAS las features activas).
 *   - subcategories: OR (listing debe estar en alguna).
 *   - priceRanges: OR (listing debe caer en alguno).
 *   - openNow: cruza hora actual.
 */
export function applyFilters(
  listings: readonly Listing[],
  filter: FilterState,
  now: Date = new Date(),
): Listing[] {
  if (isFilterEmpty(filter)) return [...listings];
  return listings.filter((listing) => {
    if (filter.features.length > 0 && !filter.features.every((f) => listing.features.includes(f))) {
      return false;
    }
    if (filter.subcategories.length > 0 && !filter.subcategories.includes(listing.subcategory)) {
      return false;
    }
    if (filter.priceRanges.length > 0 && !filter.priceRanges.includes(listing.priceRange)) {
      return false;
    }
    if (filter.openNow && !isOpenNow(listing, now)) {
      return false;
    }
    // Trails: dificultad y tipo (OR). Solo aplican si el listing trae esos campos.
    if (
      filter.difficulties &&
      filter.difficulties.length > 0 &&
      (listing.difficulty == null || !filter.difficulties.includes(listing.difficulty))
    ) {
      return false;
    }
    if (
      filter.trailTypes &&
      filter.trailTypes.length > 0 &&
      (listing.trailType == null || !filter.trailTypes.includes(listing.trailType))
    ) {
      return false;
    }
    return true;
  });
}
