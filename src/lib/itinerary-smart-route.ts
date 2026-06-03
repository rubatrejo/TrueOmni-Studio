import type { ItineraryRailEntry } from './itinerary-favorites';

/**
 * Reordena los stops por nearest-neighbor (TSP greedy): empieza en el primer
 * stop y siempre toma el más cercano no visitado. Misma heurística que el
 * "Smart Route" del kiosk (`itinerary-builder-module.tsx`), extraída como
 * función pura para reusarse en la PWA.
 *
 * @returns el nuevo orden, o `null` si hay <3 stops con coords o el orden
 *          actual ya es el óptimo (para mostrar el modal "ya está ruteado").
 */
export function smartRouteOrder(
  stops: ItineraryRailEntry[],
  coordOf: (e: ItineraryRailEntry) => { lat: number; lng: number } | undefined,
): ItineraryRailEntry[] | null {
  const withCoords = stops
    .map((entry) => {
      const coords = coordOf(entry);
      return coords ? { entry, coords } : null;
    })
    .filter(
      (x): x is { entry: ItineraryRailEntry; coords: { lat: number; lng: number } } => x !== null,
    );
  if (withCoords.length < 3) return null;

  const visited = new Set<number>([0]);
  const order: number[] = [0];
  while (order.length < withCoords.length) {
    const last = withCoords[order[order.length - 1]!]!.coords;
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < withCoords.length; i++) {
      if (visited.has(i)) continue;
      const c = withCoords[i]!.coords;
      const d2 = (c.lat - last.lat) ** 2 + (c.lng - last.lng) ** 2;
      if (d2 < bestDist) {
        bestDist = d2;
        bestIdx = i;
      }
    }
    if (bestIdx < 0) break;
    visited.add(bestIdx);
    order.push(bestIdx);
  }

  const isOptimal = order.every((idx, pos) => idx === pos);
  if (isOptimal) return null;
  return order.map((i) => withCoords[i]!.entry);
}
