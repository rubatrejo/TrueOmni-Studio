'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';

interface Coords {
  lat: number;
  lng: number;
}

/**
 * Mapa Mapbox interactivo (pan/zoom) de la pantalla Connect With Us, centrado en
 * las coordenadas del cliente. El pin es el **mismo marcador del mapa de listings del
 * kiosk** (`listings/mapbox-map.tsx`): teardrop azul + círculo blanco, para consistencia
 * entre productos. El logo de Mapbox se oculta a petición.
 *
 * Sin token (`integraciones.mapbox_token`) cae a un placeholder neutro, igual que
 * `directions-map-with-route.tsx`.
 */
export function ConnectMap({
  token,
  coords,
  className,
  style,
}: {
  token: string | undefined;
  coords: Coords;
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!token || !containerRef.current) return;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [coords.lng, coords.lat],
      zoom: 14,
      attributionControl: false,
    });
    mapRef.current = map;

    // Oculta el logo de Mapbox (a petición). El control de atribución ya va off arriba.
    map.on('load', () => {
      containerRef.current?.querySelector('.mapboxgl-ctrl-logo')?.parentElement?.remove();
    });

    // Mismo marcador que el mapa de listings del kiosk: teardrop azul + círculo blanco.
    const pinEl = document.createElement('div');
    pinEl.setAttribute('aria-hidden', 'true');
    pinEl.style.width = '34px';
    pinEl.style.height = '49px';
    pinEl.style.backgroundRepeat = 'no-repeat';
    pinEl.style.backgroundSize = 'contain';
    pinEl.style.backgroundImage =
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 46'><path d='M16 0C7.2 0 0 7.2 0 16c0 10.7 13.2 27.5 15 29.4.6.7 1.4.7 2 0 1.8-1.9 15-18.7 15-29.4C32 7.2 24.8 0 16 0z' fill='%23004f8b'/><circle cx='16' cy='16' r='6' fill='%23fff'/></svg>\")";
    new mapboxgl.Marker({ element: pinEl, anchor: 'bottom' })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map);

    // El canvas de Mapbox fija su tamaño en el init; si el contenedor cambia de
    // ancho después (p. ej. el mapa de Connect pasa a full-width en landscape tras
    // el switch de device), hay que re-encajarlo o queda angosto a la izquierda.
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [token, coords.lat, coords.lng]);

  if (!token) {
    return (
      <div
        className={className}
        style={style}
        aria-label="Map unavailable"
        // Placeholder neutro cuando no hay token de Mapbox configurado.
      >
        <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          Map unavailable
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={className} style={style} />;
}
