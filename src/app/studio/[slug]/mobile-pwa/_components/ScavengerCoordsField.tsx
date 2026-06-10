'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useMemo, useRef } from 'react';

import { PwaNumberField } from './pwa-ui';

interface Coords {
  lat: number;
  lng: number;
}

/**
 * Picker de un punto geográfico (lat/lng) para una task de Scavenger Hunt.
 * Adaptado de TrailGeoJsonField: marker arrastrable + click-to-place. Sin token
 * Mapbox cae a inputs numéricos (graceful degradation). El token llega por prop
 * desde `config.integraciones.mapbox_token` (nunca process.env en client).
 */
export function ScavengerCoordsField({
  coords,
  mapboxToken,
  onChange,
}: {
  coords: Coords;
  mapboxToken: string;
  onChange: (next: Coords) => void;
}) {
  if (!mapboxToken) {
    return (
      <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Map disabled — set <code>integrations.mapbox.token</code> in Integrations to place the
          point visually.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <PwaNumberField
            label="Latitude"
            value={coords.lat}
            step={0.0001}
            onChange={(lat) => onChange({ ...coords, lat })}
          />
          <PwaNumberField
            label="Longitude"
            value={coords.lng}
            step={0.0001}
            onChange={(lng) => onChange({ ...coords, lng })}
          />
        </div>
      </div>
    );
  }
  return <ScavengerMap coords={coords} mapboxToken={mapboxToken} onChange={onChange} />;
}

function ScavengerMap({
  coords,
  mapboxToken,
  onChange,
}: {
  coords: Coords;
  mapboxToken: string;
  onChange: (n: Coords) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const hasPoint =
    Number.isFinite(coords.lat) &&
    Number.isFinite(coords.lng) &&
    !(coords.lat === 0 && coords.lng === 0);
  const initialCenter = useMemo<[number, number]>(
    () => (hasPoint ? [coords.lng, coords.lat] : [-98.5, 39.5]),
    // solo el centro inicial; cambios posteriores via efecto de sync
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: hasPoint ? 14 : 3,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const marker = new mapboxgl.Marker({ color: '#0ea5e9', draggable: true });
    markerRef.current = marker;
    if (hasPoint) marker.setLngLat([coords.lng, coords.lat]).addTo(map);

    marker.on('dragend', () => {
      const { lng, lat } = marker.getLngLat();
      onChangeRef.current({ lat, lng });
    });

    map.on('click', (e) => {
      marker.setLngLat(e.lngLat).addTo(map);
      onChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]);

  // Sync externo (e.g. inputs numéricos) → marker.
  useEffect(() => {
    const marker = markerRef.current;
    const map = mapRef.current;
    if (!marker || !map) return;
    if (hasPoint) {
      marker.setLngLat([coords.lng, coords.lat]).addTo(map);
    }
  }, [coords.lat, coords.lng, hasPoint]);

  return (
    <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div
        ref={containerRef}
        className="h-[240px] w-full overflow-hidden rounded-md ring-1 ring-zinc-200 dark:ring-zinc-800"
      />
      <p className="text-[11px] leading-snug text-zinc-500">
        Click on the map to place the point, or drag the marker. Coordinates:{' '}
        {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}.
      </p>
    </div>
  );
}
