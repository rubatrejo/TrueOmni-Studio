'use client';

import type { ItineraryCatalogItem } from '@/lib/itinerary-catalog';

import { EmptySearchState } from './empty-search-state';
import { ItineraryListingCard } from './itinerary-listing-card';

export interface ListingsColumnProps {
  items: ItineraryCatalogItem[];
  isInRail: (slug: string, kind: ItineraryCatalogItem['kind']) => boolean;
  onToggle: (item: ItineraryCatalogItem) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Coords del cliente para calcular distancias. */
  clientCoords?: { lat: number; lng: number };
  emptyLabel: string;
  /** Si la búsqueda está activa y no hay resultados, mostrar empty state visual. */
  isSearching?: boolean;
  emptySearchTitle?: string;
  emptySearchBody?: string;
  /** Plantilla del label de distancia, ej. "{n} mi away". */
  distanceTemplate: string;
  onCardDragStart?: (item: ItineraryCatalogItem, ev: React.PointerEvent<HTMLDivElement>) => void;
  /** Tap en card → abre bubble del mapa en su coord. */
  onCardTap?: (item: ItineraryCatalogItem) => void;
  /** Y inicial del sidebar (default 340). En tab Events se baja a 470 para
   *  que la week strip no se solape con el sidebar. */
  topY?: number;
}

const COLUMN_LEFT_PAD = 30;
const COLUMN_TOP = 340;
const COLUMN_WIDTH = 360; // ancho del card (ItineraryListingCard) — calza exacto con padding 30/30
const COLUMN_TOTAL_WIDTH = COLUMN_LEFT_PAD * 2 + COLUMN_WIDTH;
const COLUMN_BOTTOM = 310; // queda contra la base del map toolbar

const TOGGLE_W = 44;
const TOGGLE_H = 437;

const haversineMi = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Botón close/open del sidebar — verbatim del SVG `Close-Open-Sidebar.svg`.
 *  Tab semicircular azul claro hsl(var(--brand-secondary)) con chevron blanco al centro. */
function SidebarToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  // Cuando expandido (visible) → chevron LEFT (colapsa al click).
  // Cuando colapsado → chevron RIGHT (expande al click).
  const chevronD = collapsed
    ? 'M3.5 0l7.5 7.32-7.5 7.43L2 13.32l5.86-6L2 1.5z' // right
    : 'M11 14.75L3.5 7.32 11 0l1.5 1.5-5.86 5.82L12.5 13.32z'; // left

  // El SVG verbatim del cliente: rect 87×437 con corners derecha rx=80,
  // posicionado con left=-43 para que sólo se vea la mitad izquierda
  // (44×437) que sobresale del sidebar.
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? 'Expand listings' : 'Collapse listings'}
      className="absolute z-40 flex items-center justify-center text-white shadow-md transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      style={{
        left: collapsed ? 0 : COLUMN_TOTAL_WIDTH - 6,
        top: 'calc(50% - ' + TOGGLE_H / 2 + 'px)',
        width: TOGGLE_W,
        height: TOGGLE_H,
        backgroundColor: 'hsl(var(--itinerary-tab-active))',
        borderTopRightRadius: 80,
        borderBottomRightRadius: 80,
      }}
    >
      <svg width="14" height="15" viewBox="0 0 14 15" fill="white" aria-hidden="true">
        <path d={chevronD} />
      </svg>
    </button>
  );
}

/**
 * Columna izquierda con cards scrollables y tab toggle estilo SVG cliente.
 * Fondo blanco con gradient azul oscuro (con alpha) en la base que crea
 * fade-out de las cards al hacer scroll.
 */
export function ListingsColumn(props: ListingsColumnProps) {
  const { items, isInRail, onToggle, collapsed, onToggleCollapsed, clientCoords, emptyLabel } =
    props;

  if (collapsed) {
    return <SidebarToggle collapsed onToggle={onToggleCollapsed} />;
  }

  return (
    <div
      className="absolute z-20"
      style={{
        left: 0,
        top: props.topY ?? COLUMN_TOP,
        width: COLUMN_TOTAL_WIDTH,
        bottom: COLUMN_BOTTOM,
        backgroundColor: '#ffffff',
      }}
    >
      <div
        className="flex h-full flex-col gap-3 overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{
          scrollbarWidth: 'none',
          paddingLeft: COLUMN_LEFT_PAD,
          paddingRight: COLUMN_LEFT_PAD,
          paddingTop: 12,
          paddingBottom: 80,
        }}
      >
        {items.length === 0 ? (
          props.isSearching && props.emptySearchTitle && props.emptySearchBody ? (
            <EmptySearchState title={props.emptySearchTitle} body={props.emptySearchBody} />
          ) : (
            <div className="mt-8 text-center text-[15px] text-muted-foreground">{emptyLabel}</div>
          )
        ) : (
          items.map((item) => (
            <ItineraryListingCard
              key={`${item.kind}:${item.slug}`}
              item={item}
              isInRail={isInRail(item.slug, item.kind)}
              onToggle={onToggle}
              distanceMi={clientCoords ? haversineMi(item.coords, clientCoords) : undefined}
              distanceTemplate={props.distanceTemplate}
              onDragStart={props.onCardDragStart}
              onTap={props.onCardTap}
            />
          ))
        )}
      </div>
      {/* Gradient azul oscuro → transparente al final (fade-out de cards).
       *  Limitado al ancho de las cards (left=right=COLUMN_LEFT_PAD) para no
       *  cubrir el padding laterial blanco del sidebar. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0"
        style={{
          left: COLUMN_LEFT_PAD,
          right: COLUMN_LEFT_PAD,
          height: 160,
          background:
            'linear-gradient(to top, hsl(var(--itinerary-toolbar-bg) / 0.95) 0%, hsl(var(--itinerary-toolbar-bg) / 0) 100%)',
        }}
      />
      <SidebarToggle collapsed={false} onToggle={onToggleCollapsed} />
    </div>
  );
}
