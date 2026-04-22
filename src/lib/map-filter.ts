import type { MapSource } from './config';
import type { MapItem } from './map-item';

export interface MapFilterState {
  /** Chips activos (categorías visibles). */
  activeChips: ReadonlySet<MapSource>;
  /** Features a exigir (AND). */
  features: ReadonlySet<string>;
  /** Subcategorías permitidas (OR). Vacío = todas. */
  subcategories: ReadonlySet<string>;
}

export const ALL_CHIPS: ReadonlySet<MapSource> = new Set([
  'things-to-do',
  'restaurants',
  'stay',
  'events',
]);

export const EMPTY_MAP_FILTER: MapFilterState = {
  activeChips: ALL_CHIPS,
  features: new Set<string>(),
  subcategories: new Set<string>(),
};

export function applyMapFilters(items: readonly MapItem[], s: MapFilterState): MapItem[] {
  const needFeatures = s.features.size > 0;
  const needSubcats = s.subcategories.size > 0;
  const result: MapItem[] = [];
  for (const it of items) {
    if (!s.activeChips.has(it.source)) continue;
    if (needSubcats && !s.subcategories.has(it.subcategory)) continue;
    if (needFeatures) {
      let ok = true;
      for (const f of s.features) {
        if (!it.features.includes(f)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
    }
    result.push(it);
  }
  return result;
}

/** Helper immutable para togglear un chip. */
export function toggleChip(state: MapFilterState, chip: MapSource): MapFilterState {
  const next = new Set(state.activeChips);
  if (next.has(chip)) next.delete(chip);
  else next.add(chip);
  return { ...state, activeChips: next };
}
