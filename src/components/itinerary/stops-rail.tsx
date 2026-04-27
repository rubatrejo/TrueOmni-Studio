'use client';

import type { ItineraryCatalogItem } from '@/lib/itinerary-catalog';
import type { ItineraryRailEntry } from '@/lib/itinerary-favorites';

import { StopSlot } from './stop-slot';

export interface StopsRailProps {
  stops: ItineraryRailEntry[];
  /** Resolver el item completo desde el slug+kind (catálogo agregado del cliente). */
  resolveItem: (entry: ItineraryRailEntry) => ItineraryCatalogItem | null;
  onRemove: (entry: ItineraryRailEntry) => void;
  /** Total de slots visibles (incluye placeholders cuando hay menos stops). */
  visibleSlots?: number;
  caption: string;
  /** Plantilla "Stop {n}". */
  stopLabelTemplate: string;
  /** Plantilla "{n} mi away". */
  distanceTemplate: string;
  /** Callback de Haversine (distancia desde el cliente). */
  computeDistance?: (item: ItineraryCatalogItem) => number;
  /** Pointerdown en un slot ocupado → inicia drag para reorder. */
  onSlotDragStart?: (
    entry: ItineraryRailEntry,
    item: ItineraryCatalogItem,
    fromIndex: number,
    ev: React.PointerEvent<HTMLDivElement>,
  ) => void;
}

/**
 * Rail horizontal de stops del Itinerary Builder. Coords aproximadas del SVG.
 * Cuando el rail tiene menos stops que `visibleSlots`, muestra placeholders
 * con heart outline. Scrollable horizontalmente cuando hay más de N stops.
 */
export function StopsRail(props: StopsRailProps) {
  const visibleSlots = props.visibleSlots ?? Math.max(3, props.stops.length + 1);
  const slots = Array.from({ length: visibleSlots }, (_, i) => props.stops[i] ?? null);

  return (
    <div
      className="absolute left-0 right-0 flex"
      style={{
        bottom: 0,
        height: 310,
        backgroundColor: 'hsl(var(--itinerary-rail-bg))',
        zIndex: 25,
      }}
    >
      <div
        className="flex-1 overflow-x-auto px-5 py-5"
        data-itinerary-rail
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="flex items-start gap-4">
          {slots.map((entry, i) => {
            const item = entry ? props.resolveItem(entry) : null;
            const distance =
              item && props.computeDistance ? props.computeDistance(item) : null;
            return (
              <StopSlot
                key={entry ? `${entry.kind}:${entry.slug}` : `empty-${i}`}
                index={i + 1}
                item={item}
                onRemove={entry ? () => props.onRemove(entry) : undefined}
                stopLabelTemplate={props.stopLabelTemplate}
                distanceLabel={
                  distance != null
                    ? props.distanceTemplate.replace('{n}', distance.toFixed(1))
                    : undefined
                }
                onDragHandle={
                  entry && item && props.onSlotDragStart
                    ? (ev) => props.onSlotDragStart?.(entry, item, i, ev)
                    : undefined
                }
              />
            );
          })}
          {/* Caption a la derecha del último slot */}
          <div
            className="flex-shrink-0 text-[13px] leading-tight text-zinc-500"
            style={{ width: 220, paddingTop: 60 }}
          >
            {props.caption}
          </div>
        </div>
      </div>
    </div>
  );
}
