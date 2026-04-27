'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl, { type GeoJSONSource } from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

import type { ItineraryStopKind } from '@/lib/config';
import type { ItineraryCatalogItem } from '@/lib/itinerary-catalog';

export interface ItineraryMapStop {
  slug: string;
  kind: ItineraryStopKind;
  coords: { lat: number; lng: number };
  /** Número 1-based del stop en el rail. */
  index: number;
}

export interface ItineraryMapProps {
  token: string | undefined;
  /** Centro inicial del mapa. */
  center: { lat: number; lng: number };
  zoom?: number;
  /** Pins de catálogo a mostrar (toggleados por `Hide Markers`). */
  catalog: ItineraryCatalogItem[];
  /** Stops del rail (numerados, conectados con línea). */
  stops: ItineraryMapStop[];
  /** Mostrar la línea de ruta entre stops. */
  showRoute: boolean;
  /** Ocultar markers del catálogo (los stops siempre visibles). */
  hideCatalogMarkers: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** Color del pin según el kind del item (alineado con tokens). */
function pinColorForKind(kind: ItineraryStopKind): string {
  if (kind === 'event') return '#f5a623';
  if (kind === 'trail') return '#0e8c7e';
  return '#0088ce';
}

/** SVG inline de un pin teardrop con relleno por kind. */
function pinSvg(kind: ItineraryStopKind, scale = 1) {
  const color = pinColorForKind(kind);
  const w = 28 * scale;
  const h = 36 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 28 36">
    <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="14" r="5" fill="#ffffff"/>
  </svg>`;
}

/** Stop marker con número grande. */
function stopMarkerSvg(index: number) {
  return `<div style="position:relative;width:48px;height:60px;">
    <svg width="48" height="60" viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;">
      <path d="M24 0C10.7 0 0 10.7 0 24c0 17 24 36 24 36s24-19 24-36C48 10.7 37.3 0 24 0z" fill="hsl(201 100% 40%)"/>
      <circle cx="24" cy="24" r="14" fill="#ffffff"/>
    </svg>
    <div style="position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;padding-top:14px;color:hsl(201 100% 40%);font-weight:700;font-size:18px;font-family:system-ui,sans-serif;">${index}</div>
  </div>`;
}

export function ItineraryMap(props: ItineraryMapProps) {
  const {
    token,
    center,
    zoom = 12,
    catalog,
    stops,
    showRoute,
    hideCatalogMarkers,
    className,
    style,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const catalogMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const stopMarkersRef = useRef<mapboxgl.Marker[]>([]);

  // Init del mapa una sola vez.
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom,
      interactive: true,
      attributionControl: false,
      cooperativeGestures: false,
    });
    mapRef.current = map;
    map.on('load', () => {
      map.addSource('itinerary-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'itinerary-route-line',
        type: 'line',
        source: 'itinerary-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': 'hsl(201, 100%, 40%)',
          'line-width': 5,
          'line-opacity': 0.85,
        },
      });
      setReady(true);
    });
    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Sync markers del catálogo (visibles según hideCatalogMarkers).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    catalogMarkersRef.current.forEach((m) => m.remove());
    catalogMarkersRef.current = [];
    if (hideCatalogMarkers) return;
    const stopKey = new Set(stops.map((s) => `${s.kind}:${s.slug}`));
    catalog.forEach((item) => {
      // No duplicar markers de items que ya son stops (los rendero abajo grandes).
      if (stopKey.has(`${item.kind}:${item.slug}`)) return;
      const el = document.createElement('div');
      el.style.cursor = 'pointer';
      el.innerHTML = pinSvg(item.kind, 1);
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([item.coords.lng, item.coords.lat])
        .addTo(map);
      catalogMarkersRef.current.push(marker);
    });
  }, [catalog, stops, hideCatalogMarkers, ready]);

  // Sync stop markers (numerados, siempre visibles).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];
    stops.forEach((s) => {
      const el = document.createElement('div');
      el.innerHTML = stopMarkerSvg(s.index);
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([s.coords.lng, s.coords.lat])
        .addTo(map);
      stopMarkersRef.current.push(marker);
    });
  }, [stops, ready]);

  // Sync route line.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const src = map.getSource('itinerary-route') as GeoJSONSource | undefined;
    if (!src) return;
    if (!showRoute || stops.length < 2) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    src.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: stops.map((s) => [s.coords.lng, s.coords.lat]),
          },
        },
      ],
    });
  }, [stops, showRoute, ready]);

  if (!token) {
    return (
      <div
        role="img"
        aria-label="Map unavailable"
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#d8d8d8',
          color: '#4a4a4a',
          fontSize: '14px',
          ...style,
        }}
      >
        Map unavailable (missing Mapbox token)
      </div>
    );
  }

  // Wrapper absolute fuera del container de Mapbox: Mapbox GL sobrescribe
  // `position` del container a `relative`, lo que rompe top/bottom inset; el
  // wrapper absorbe los insets y el container interno queda 100%×100%.
  return (
    <div className={className} style={style}>
      <div
        ref={containerRef}
        role="application"
        aria-label="Itinerary map"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
