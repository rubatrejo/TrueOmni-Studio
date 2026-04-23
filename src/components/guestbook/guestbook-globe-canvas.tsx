'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';

export interface GlobeHandle {
  flyToZip: (coords: { lat: number; lng: number }) => Promise<void>;
  getMap: () => mapboxgl.Map | null;
  resize: () => void;
  setSpinning: (enabled: boolean) => void;
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
export interface GlobeOverlayPin {
  id: string;
  coords: { lat: number; lng: number };
  image: string;
}

export const GuestbookGlobeCanvas = forwardRef<
  GlobeHandle,
  {
    token: string | undefined;
    earthStart?: { center: { lat: number; lng: number }; zoom: number };
    overlayPins?: readonly GlobeOverlayPin[];
    className?: string;
    style?: React.CSSProperties;
  }
>(function GuestbookGlobeCanvas({ token, earthStart, overlayPins, className, style }, ref) {
  const overlayMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onStreetsRef = useRef(false);
  const spinningRef = useRef(true);

  useEffect(() => {
    if (!token || !containerRef.current) return;
    mapboxgl.accessToken = token;

    const center = earthStart?.center ?? { lat: 20, lng: -60 };
    const zoom = earthStart?.zoom ?? 1.6;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [center.lng, center.lat],
      zoom,
      interactive: false,
      attributionControl: false,
    });
    // Standard style tiene config properties para ocultar etiquetas.
    // Se aplica tras style.load para garantizar que el basemap está listo.
    map.on('style.load', () => {
      try {
        map.setConfigProperty('basemap', 'showPlaceLabels', false);
        map.setConfigProperty('basemap', 'showRoadLabels', false);
        map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
        map.setConfigProperty('basemap', 'showTransitLabels', false);
      } catch {
        /* estilo sin soporte de config */
      }
    });

    // Rotación continua del globo — efecto Framer/Globe interactivo.
    // Cada 'moveend' añade una pequeña rotación en lng si spinning está on
    // y el zoom es suficientemente out (solo en Start / Form).
    const SECONDS_PER_REVOLUTION = 120;
    const MAX_SPIN_ZOOM = 5;
    const spin = () => {
      if (!spinningRef.current) return;
      if (map.getZoom() > MAX_SPIN_ZOOM) return;
      const c = map.getCenter();
      const distancePerSec = 360 / SECONDS_PER_REVOLUTION;
      c.lng -= distancePerSec;
      map.easeTo({ center: c, duration: 1000, easing: (n) => n });
    };
    map.on('moveend', spin);
    map.on('load', () => spin());
    map.on('style.load', () => {
      try {
        map.setProjection('globe');
        // Fog sin galaxia: space-color match con el fondo claro de la
        // página (para que el planeta se vea flotando sobre blanco) y
        // star-intensity 0 (sin estrellas). Solo mantiene el halo
        // atmosférico azul alrededor del planeta.
        map.setFog({
          color: 'rgb(220, 230, 245)',
          'high-color': 'rgb(180, 210, 240)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(248, 248, 248)',
          'star-intensity': 0,
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

  // Renderea los overlayPins como markers que giran con el globo.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !overlayPins) return;

    for (const m of overlayMarkersRef.current) m.remove();
    overlayMarkersRef.current = [];

    void import('mapbox-gl').then((mod) => {
      const Marker = mod.Marker;
      if (!Marker) return;
      for (const p of overlayPins) {
        const el = document.createElement('div');
        el.style.width = '46px';
        el.style.height = '58px';
        el.style.pointerEvents = 'none';
        el.innerHTML = `<img src="${p.image}" alt="" style="width:46px;height:58px;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.4));" />`;
        const m = new Marker({ element: el, anchor: 'bottom' })
          .setLngLat([p.coords.lng, p.coords.lat])
          .addTo(map);
        overlayMarkersRef.current.push(m);
      }
    });

    return () => {
      for (const m of overlayMarkersRef.current) m.remove();
      overlayMarkersRef.current = [];
    };
  }, [overlayPins]);

  useImperativeHandle(
    ref,
    (): GlobeHandle => ({
      getMap: () => mapRef.current,
      resize: () => mapRef.current?.resize(),
      setSpinning: (enabled) => {
        spinningRef.current = enabled;
      },
      flyToZip: (coords) =>
        new Promise<void>((resolve) => {
          const map = mapRef.current;
          if (!map) {
            resolve();
            return;
          }
          // Stop spinning antes del flyTo para que no compita con la animación.
          spinningRef.current = false;
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
        background: '#f8f8f8',
        ...style,
      }}
    />
  );
});
