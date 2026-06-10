'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';

interface Coords {
  lat: number;
  lng: number;
}

/**
 * Mapbox map que dibuja la ruta origen→destino. Recibe `geometry` ya
 * resuelta por el parent (hace fetch de Directions API en el modal).
 * Markers: teardrop azul en destino + dot azul con halo en origen.
 *
 * Sin token o sin geometry, cae a placeholder "Map unavailable".
 */
export function DirectionsMapWithRoute({
  token,
  origin,
  destination,
  geometry,
  className,
  style,
}: {
  token: string | undefined;
  origin: Coords | undefined;
  destination: Coords;
  /** Polyline GeoJSON de la ruta. Null = aún no hay ruta. */
  geometry: GeoJSON.LineString | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Inicializa el mapa una sola vez.
  useEffect(() => {
    if (!token || !containerRef.current) return;
    mapboxgl.accessToken = token;

    const center = origin
      ? {
          lat: (origin.lat + destination.lat) / 2,
          lng: (origin.lng + destination.lng) / 2,
        }
      : destination;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom: 13,
      interactive: false,
      attributionControl: false,
    });
    mapRef.current = map;

    const destEl = document.createElement('div');
    destEl.setAttribute('aria-hidden', 'true');
    destEl.style.width = '32px';
    destEl.style.height = '46px';
    destEl.style.backgroundImage =
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 46'><path d='M16 0C7.2 0 0 7.2 0 16c0 10.7 13.2 27.5 15 29.4.6.7 1.4.7 2 0 1.8-1.9 15-18.7 15-29.4C32 7.2 24.8 0 16 0z' fill='%23004f8b'/><circle cx='16' cy='16' r='6' fill='%23fff'/></svg>\")";
    destEl.style.backgroundRepeat = 'no-repeat';
    destEl.style.backgroundSize = 'contain';
    new mapboxgl.Marker({ element: destEl, anchor: 'bottom' })
      .setLngLat([destination.lng, destination.lat])
      .addTo(map);

    if (origin) {
      const originEl = document.createElement('div');
      originEl.setAttribute('aria-hidden', 'true');
      originEl.style.width = '22px';
      originEl.style.height = '22px';
      originEl.style.borderRadius = '50%';
      originEl.style.backgroundColor = 'hsl(var(--brand-secondary))';
      originEl.style.border = '3px solid #fff';
      originEl.style.boxShadow = '0 0 0 4px rgba(23,150,214,0.25)';
      new mapboxgl.Marker({ element: originEl }).setLngLat([origin.lng, origin.lat]).addTo(map);
    }

    if (origin) {
      const bounds = new mapboxgl.LngLatBounds(
        [Math.min(origin.lng, destination.lng), Math.min(origin.lat, destination.lat)],
        [Math.max(origin.lng, destination.lng), Math.max(origin.lat, destination.lat)],
      );
      map.fitBounds(bounds, { padding: 70, duration: 0 });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se usan los campos primitivos (.lat/.lng) de origin y destination para evitar re-init del mapa por nueva referencia de objeto con las mismas coordenadas
  }, [token, origin?.lat, origin?.lng, destination.lat, destination.lng]);

  // Pinta/actualiza la polyline cuando cambia `geometry`.
  useEffect(() => {
    if (!mapRef.current || !geometry) return;
    const mapInstance: mapboxgl.Map = mapRef.current;

    const apply = () => {
      const sourceId = 'kiosk-route';
      const layerId = 'kiosk-route-line';
      const featureData: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        geometry,
        properties: {},
      };
      const source = mapInstance.getSource(sourceId);
      if (source) {
        (source as mapboxgl.GeoJSONSource).setData(featureData);
      } else {
        mapInstance.addSource(sourceId, { type: 'geojson', data: featureData });
        mapInstance.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': 'hsl(var(--brand-secondary))',
            'line-width': 6,
            'line-opacity': 0.9,
          },
        });
      }
    };

    if (mapInstance.isStyleLoaded()) {
      apply();
    } else {
      mapInstance.once('load', apply);
    }
  }, [geometry]);

  if (!token) {
    return (
      <div
        role="img"
        aria-label="Mapa de ruta"
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#d8d8d8',
          color: '#4a4a4a',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '16px',
          ...style,
        }}
      >
        Map unavailable
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Mapa de ruta"
      className={className}
      style={style}
    />
  );
}
