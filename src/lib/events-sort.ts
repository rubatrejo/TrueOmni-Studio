import type { EventItem } from './config';
import { haversineMi } from './listings-sort';

/** Orden disponibles para Events. `date` = default (asc). */
export type EventsSortOrder = 'date' | 'alpha' | 'popularity' | 'distance';

export interface EventsSortLabel {
  value: EventsSortOrder;
  label: string;
}

export const EVENTS_SORT_OPTIONS: readonly EventsSortLabel[] = [
  { value: 'date', label: 'Date (soonest)' },
  { value: 'alpha', label: 'Alphabetical A–Z' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'distance', label: 'Distance (closest)' },
];

function timestampOf(e: EventItem): number {
  // Construye un timestamp numérico comparable (day + time).
  // ISO concatenado es ordenable lexicográficamente, pero cast a number para
  // mantener paridad con otros sorts.
  return new Date(`${e.date}T${e.startTime}:00`).getTime();
}

export function sortEvents(
  events: readonly EventItem[],
  order: EventsSortOrder,
  origin?: { lat: number; lng: number },
): EventItem[] {
  const arr = [...events];
  switch (order) {
    case 'alpha':
      arr.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
      break;
    case 'popularity':
      arr.sort((a, b) => b.popularity - a.popularity);
      break;
    case 'distance':
      if (!origin) {
        arr.sort((a, b) => timestampOf(a) - timestampOf(b));
      } else {
        arr.sort((a, b) => haversineMi(origin, a.coords) - haversineMi(origin, b.coords));
      }
      break;
    case 'date':
    default:
      arr.sort((a, b) => timestampOf(a) - timestampOf(b));
      break;
  }
  return arr;
}
