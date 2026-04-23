import type { EventItem } from './config';

/** Event con campo `ticket` garantizado no-null (type guard output). */
export type TicketableEvent = EventItem & { ticket: NonNullable<EventItem['ticket']> };

/**
 * Filtra la lista de events dejando solo los que tienen el campo `ticket`
 * presente (eventos con venta de boletos activa).
 *
 * Usado por `TicketsModule` — Tickets ⊂ Events.
 */
export function filterTicketableEvents(events: readonly EventItem[]): TicketableEvent[] {
  return events.filter((e): e is TicketableEvent => e.ticket != null);
}

/** Deriva catálogo de categorías visibles del pool de tickets. */
export function deriveTicketCategories(events: readonly EventItem[]): string[] {
  const set = new Set<string>();
  for (const e of events) set.add(e.category);
  return [...set].sort();
}

/** Deriva catálogo de venues visibles del pool de tickets. */
export function deriveTicketVenues(events: readonly EventItem[]): string[] {
  const set = new Set<string>();
  for (const e of events) set.add(e.venue);
  return [...set].sort();
}

/** Deriva catálogo de features (unión) del pool de tickets. */
export function deriveTicketFeatures(events: readonly EventItem[]): string[] {
  const set = new Set<string>();
  for (const e of events) for (const f of e.features) set.add(f);
  return [...set].sort();
}
