'use client';

import { ListingDetail } from '@/components/listings/listing-detail';
import type { Trail } from '@/lib/config';
import { trailToListing } from '@/lib/trails';

import { ConsiderationsPanel } from './considerations-panel';
import { TrailMapTabs } from './trail-map-tabs';

/**
 * Detail del módulo Trails. Wrapper de `ListingDetail` que inyecta:
 *   - `mapSlot`: <TrailMapTabs> (reemplaza el bloque Map clásico).
 *   - `extraDetails`: <ConsiderationsPanel> (debajo de DESCRIPTION).
 *   - `favoritesKind: 'trail'` (bucket propio `kiosk_trail_favorites`).
 */
export function TrailDetail({
  moduleKey,
  trail,
  mapboxToken,
  clientCoords,
  textos,
}: {
  moduleKey: string;
  trail: Trail;
  mapboxToken: string | undefined;
  clientCoords?: { lat: number; lng: number };
  textos: Record<string, string>;
}) {
  const listing = trailToListing(trail);
  // GET DIRECTIONS del `TrailMapTabs` dispara el Directions modal del
  // `ListingDetail` vía un evento global. Para evitar acoplar, delegamos a
  // `setDirectionsOpen` del padre no es posible porque el state vive dentro
  // del `ListingDetail`. Workaround simple: click en un botón invisible
  // dentro del ListingDetail. En v1 del módulo Trails mantenemos el botón
  // pero el handler es un noop — el Directions modal puede accederse desde
  // el propio MapboxMap en v2. TODO registrado.
  const onGetDirections = () => {
    /* v1: el Directions modal está encapsulado en ListingDetail; para no
       duplicar la lógica (fetch de route, turn-by-turn, send to phone/email),
       este botón abre `window.open(mapsUrl)` como fallback directo. */
    const q = encodeURIComponent(`${trail.title}, ${trail.address}`);
    if (typeof window !== 'undefined') {
      window.open(`https://maps.google.com/?q=${q}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <ListingDetail
      moduleKey={moduleKey}
      listing={listing}
      mapboxToken={mapboxToken}
      clientCoords={clientCoords}
      favoritesKind="trail"
      contentHeight={1800}
      mapSlot={
        <TrailMapTabs
          trail={trail}
          token={mapboxToken}
          defaultTabLabel={textos.trails_map_tab_default ?? 'Default Map'}
          trailTabLabel={textos.trails_map_tab_trail ?? 'Trail Map'}
          onGetDirections={onGetDirections}
        />
      }
      extraDetails={
        <ConsiderationsPanel
          considerations={trail.considerations}
          title={textos.trails_considerations_title ?? 'CONSIDERATIONS'}
          labels={{
            distance: textos.trails_consideration_distance ?? 'Distance',
            difficulty: textos.trails_consideration_difficulty ?? 'Difficulty',
            duration: textos.trails_consideration_duration ?? 'Duration',
            elevation: textos.trails_consideration_elevation ?? 'Elevation Gain',
            type: textos.trails_consideration_type ?? 'Trail Type',
            dogFriendly: textos.trails_consideration_dog_friendly ?? 'Dog Friendly',
          }}
          dogFriendlyYes={textos.trails_dog_friendly_yes ?? 'Yes'}
          dogFriendlyNo={textos.trails_dog_friendly_no ?? 'No'}
        />
      }
    />
  );
}
