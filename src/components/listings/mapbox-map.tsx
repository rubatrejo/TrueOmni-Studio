'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';

/**
 * Wrapper de Mapbox GL JS — renderiza un mapa estático centrado en `coords`
 * con un marker azul (igual que el pin del SVG Food & Drink – Detail).
 *
 * Sin token → placeholder "Map unavailable". Esto permite que el cliente
 * configure `integraciones.mapbox_token` cuando lo necesite sin bloquear
 * desarrollo.
 */
export function MapboxMap({
  token,
  coords,
  zoom = 13,
  interactive = false,
  className,
  style,
  ariaLabel = 'Map',
}: {
  token: string | undefined;
  coords: { lat: number; lng: number };
  zoom?: number;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [coords.lng, coords.lat],
      zoom,
      interactive,
      attributionControl: false,
    });

    // Marker pin en el estilo del SVG (teardrop azul #004f8b).
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.style.width = '32px';
    el.style.height = '46px';
    el.style.backgroundImage =
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 46'><path d='M16 0C7.2 0 0 7.2 0 16c0 10.7 13.2 27.5 15 29.4.6.7 1.4.7 2 0 1.8-1.9 15-18.7 15-29.4C32 7.2 24.8 0 16 0z' fill='%23004f8b'/><circle cx='16' cy='16' r='6' fill='%23fff'/></svg>\")";
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundSize = 'contain';

    new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map);

    return () => {
      map.remove();
    };
  }, [token, coords.lat, coords.lng, zoom, interactive]);

  if (!token) {
    return (
      <div
        role="img"
        aria-label={ariaLabel}
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
    <div ref={containerRef} role="img" aria-label={ariaLabel} className={className} style={style} />
  );
}
