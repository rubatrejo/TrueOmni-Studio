import type { EventItem } from './config';

/**
 * Estado de filtros para Events.
 *  - features: AND  (todos deben estar presentes)
 *  - categories: OR (al menos una)
 *  - venues: OR
 *  - prices: OR — 'free' o banda 1..4 (si paid)
 */
export interface EventsFilterState {
  features: string[];
  categories: string[];
  venues: string[];
  prices: ('free' | 1 | 2 | 3 | 4)[];
}

export const EMPTY_EVENTS_FILTER: EventsFilterState = {
  features: [],
  categories: [],
  venues: [],
  prices: [],
};

export function isEventsFilterEmpty(f: EventsFilterState): boolean {
  return (
    f.features.length === 0 &&
    f.categories.length === 0 &&
    f.venues.length === 0 &&
    f.prices.length === 0
  );
}

export function applyEventsFilters(
  events: readonly EventItem[],
  filter: EventsFilterState,
): EventItem[] {
  if (isEventsFilterEmpty(filter)) return [...events];

  return events.filter((e) => {
    if (filter.features.length > 0 && !filter.features.every((f) => e.features.includes(f))) {
      return false;
    }
    if (filter.categories.length > 0 && !filter.categories.includes(e.category)) return false;
    if (filter.venues.length > 0 && !filter.venues.includes(e.venue)) return false;
    if (filter.prices.length > 0) {
      const matched = filter.prices.some((p) => {
        if (p === 'free') return e.priceMode === 'free';
        return e.priceMode === 'paid' && e.priceBand === p;
      });
      if (!matched) return false;
    }
    return true;
  });
}
