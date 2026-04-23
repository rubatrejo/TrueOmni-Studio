'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';

export interface GlobeHandle {
  flyToZip: (coords: { lat: number; lng: number }) => Promise<void>;
  getMap: () => mapboxgl.Map | null;
  resize: () => void;
}

/**
 * Mapbox único del módulo Guestbook. Se monta una vez y persiste entre
 * las phases start/form/transition/map.
 *
 * - Phases `start` y `form`: `projection: 'globe'` + `satellite-streets-v12`
 *   + centrado en el world-view (earthStart). Visible en el crop inferior.
 * - Phase `transition`/`map`: después de `flyToZip`, el mapa queda centrado
 *   en la coord del zip con zoom 14 y (a partir de ese momento) usa el
 *   estilo `streets-v12` para el detalle urbano.
 *
 * API imperativa vía ref: `flyToZip({ lat, lng })` — resuelve cuando
 * termina la animación (`moveend`).
 */
export const GuestbookGlobeCanvas = forwardRef<
  GlobeHandle,
  {
    token: string | undefined;
    earthStart?: { center: { lat: number; lng: number }; zoom: number };
    className?: string;
    style?: React.CSSProperties;
  }
>(function GuestbookGlobeCanvas({ token, earthStart, className, style }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onStreetsRef = useRef(false);

  useEffect(() => {
    if (!token || !containerRef.current) return;
    mapboxgl.accessToken = token;

    const center = earthStart?.center ?? { lat: 20, lng: -60 };
    const zoom = earthStart?.zoom ?? 1.6;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [center.lng, center.lat],
      zoom,
      interactive: false,
      attributionControl: false,
    });
    map.on('style.load', () => {
      try {
        map.setProjection('globe');
        // "Atmosphere" blue halo around the globe.
        map.setFog({
          color: 'rgb(220, 230, 245)',
          'high-color': 'rgb(30, 55, 100)',
          'horizon-blend': 0.04,
          'space-color': 'rgb(10, 15, 30)',
          'star-intensity': 0.6,
        });
      } catch {
        /* proyección no soportada en esta versión */
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token, earthStart?.center.lat, earthStart?.center.lng, earthStart?.zoom]);

  useImperativeHandle(
    ref,
    (): GlobeHandle => ({
      getMap: () => mapRef.current,
      resize: () => mapRef.current?.resize(),
      flyToZip: (coords) =>
        new Promise<void>((resolve) => {
          const map = mapRef.current;
          if (!map) {
            resolve();
            return;
          }
          const done = () => {
            map.off('moveend', done);
            // Al llegar al zoom de calle, pasar a street-level style para
            // ver calles con nombres.
            if (!onStreetsRef.current) {
              onStreetsRef.current = true;
              map.setStyle('mapbox://styles/mapbox/streets-v12');
            }
            resolve();
          };
          map.once('moveend', done);
          map.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 14,
            curve: 1.6,
            speed: 0.55,
            essential: true,
          });
        }),
    }),
    [],
  );

  if (!token) {
    return (
      <div
        role="img"
        aria-label="Globe"
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 50%, #0b3a66 0%, #020912 80%)',
          color: '#ffffff',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '14px',
          ...style,
        }}
      >
        Globe unavailable
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Globe"
      className={className}
      style={{
        background: '#000',
        ...style,
      }}
    />
  );
});
