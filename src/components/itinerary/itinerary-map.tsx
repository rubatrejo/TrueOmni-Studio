'use client';

import { useMemo } from 'react';

import { MapCanvas } from '@/components/map/map-canvas';
import type { MapSource } from '@/lib/config';
import type { ItineraryCatalogItem } from '@/lib/itinerary-catalog';
import type { ItineraryRailEntry } from '@/lib/itinerary-favorites';
import type { MapItem } from '@/lib/map-item';

export interface ItineraryMapProps {
  token: string | undefined;
  center: { lat: number; lng: number };
  zoom?: number;
  /** Catálogo completo del cliente — pins por categoría con clustering. */
  catalog: ItineraryCatalogItem[];
  /** Stops del rail manual; se conectan con LineString azul. */
  stops: ItineraryRailEntry[];
  /** Si false, oculta los pins del catálogo (los stops mantienen su pin). */
  hideCatalogMarkers?: boolean;
  /** Si false, oculta la LineString de la ruta. */
  showRoute?: boolean;
  /** Callback cuando el usuario tap un pin. */
  onSelect?: (slug: string) => void;
  selectedSlug?: string | null;
  /** Posición proyectada del pin seleccionado, para anchor del bubble overlay. */
  onSelectedPosition?: (pos: { left: number; top: number } | null) => void;
  /** Padding pasado al easeTo del pin seleccionado (compensa sidebar/overlay). */
  flyToPadding?: { top?: number; bottom?: number; left?: number; right?: number };
  /** Si true, cuando cambian los stops del rail (≥2), el mapa hace fitBounds
   *  para que toda la ruta se vea encuadrada. */
  fitRouteBounds?: boolean;
  className?: string;
  style?: React.CSSProperties;
  unavailableLabel?: string;
}

const DEFAULT_FALLBACK_STOPS: never[] = [];

/**
 * Wrapper sobre `MapCanvas` (módulo Map). Reusa los pins teardrop con icono
 * por categoría (Eat / Play / Stay / Events) y el clustering azul oscuro
 * existente. Mapea `ItineraryCatalogItem` → `MapItem` y `kind:'trail'` se
 * trata como `things-to-do` (pin Play azul oscuro) para no extender
 * `MapSource` solo por el Trip Builder.
 */
function kindToMapSource(kind: ItineraryCatalogItem['kind'], moduleSlug: string): MapSource {
  if (kind === 'event') return 'events';
  if (kind === 'trail') return 'things-to-do';
  // listing — distinguir restaurants vs things-to-do vs stay según moduleSlug.
  if (moduleSlug === 'restaurants') return 'restaurants';
  if (moduleSlug === 'stay') return 'stay';
  return 'things-to-do';
}

function toMapItem(it: ItineraryCatalogItem): MapItem {
  const source = kindToMapSource(it.kind, it.moduleSlug);
  return {
    source,
    moduleSlug: it.moduleSlug,
    slug: it.slug,
    title: it.title,
    subcategory: it.subcategory,
    image: it.image,
    coords: it.coords,
    address: it.address,
    features: it.features,
    popularity: it.popularity,
    hours: it.hours,
    priceRange: it.priceRange,
    priceMode: it.priceMode,
  };
}

export function ItineraryMap(props: ItineraryMapProps) {
  const {
    token,
    center,
    zoom = 11,
    catalog,
    stops,
    hideCatalogMarkers = false,
    showRoute = true,
    onSelect,
    selectedSlug = null,
    onSelectedPosition,
    flyToPadding,
    fitRouteBounds,
    className,
    style,
    unavailableLabel,
  } = props;

  const items = useMemo<MapItem[]>(() => {
    if (hideCatalogMarkers) {
      // Aún así rendrizamos los stops como pins (importante para que la línea
      // tenga puntos visibles). Los duplicados se filtran abajo.
      const stopSet = new Set(stops.map((s) => `${s.kind}:${s.slug}`));
      return catalog
        .filter((it) => stopSet.has(`${it.kind}:${it.slug}`))
        .map(toMapItem);
    }
    return catalog.map(toMapItem);
  }, [catalog, stops, hideCatalogMarkers]);

  const routeStops = useMemo<{ lng: number; lat: number }[]>(() => {
    if (!showRoute || stops.length < 2) return DEFAULT_FALLBACK_STOPS;
    const idx = new Map(catalog.map((c) => [`${c.kind}:${c.slug}`, c]));
    const out: { lng: number; lat: number }[] = [];
    for (const s of stops) {
      const item = idx.get(`${s.kind}:${s.slug}`);
      if (item) out.push({ lng: item.coords.lng, lat: item.coords.lat });
    }
    return out;
  }, [stops, showRoute, catalog]);

  if (!token) {
    return (
      <div
        role="img"
        aria-label={unavailableLabel ?? 'Map unavailable'}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'hsl(var(--itinerary-map-fallback-bg))',
          color: 'hsl(var(--itinerary-map-fallback-fg))',
          fontSize: 14,
          ...style,
        }}
      >
        {unavailableLabel ?? 'Map unavailable'}
      </div>
    );
  }

  // Wrapper externo absolute necesario porque Mapbox sobrescribe position
  // del container a `relative`, lo que rompe top/bottom inset.
  return (
    <div className={className} style={style}>
      <MapCanvas
        token={token}
        items={items}
        center={center}
        zoom={zoom}
        selectedSlug={selectedSlug}
        onSelect={(slug) => onSelect?.(slug)}
        onSelectedPosition={onSelectedPosition}
        flyToPadding={flyToPadding}
        fitRouteBounds={fitRouteBounds}
        routeStops={routeStops.length >= 2 ? routeStops : undefined}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

/** Re-export para compatibilidad con el tipo previo. */
export type { ItineraryRailEntry as ItineraryMapStop } from '@/lib/itinerary-favorites';
