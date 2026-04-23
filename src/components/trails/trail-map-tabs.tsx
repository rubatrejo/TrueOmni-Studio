'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

import type { Trail } from '@/lib/config';

/**
 * Bloque de mapa del detail de Trails. Reemplaza el `MapSection` clásico
 * del `ListingDetail` vía la prop `mapSlot`. Contiene:
 *
 *   - Tab bar horizontal: [Default Map | Trail Map] con underline del activo.
 *   - Mapa Mapbox único (un solo container). Al activar "Trail Map" se
 *     añade una source/layer con el GeoJSON LineString del trail y se
 *     ajusta el bbox; al volver a "Default Map" la layer se oculta.
 *   - Address + GET DIRECTIONS botón (replica el chrome del MapSection
 *     clásico para mantener consistencia visual).
 */
export function TrailMapTabs({
  trail,
  token,
  defaultTabLabel,
  trailTabLabel,
  onGetDirections,
}: {
  trail: Trail;
  token: string | undefined;
  defaultTabLabel: string;
  trailTabLabel: string;
  onGetDirections: () => void;
}) {
  const [tab, setTab] = useState<'default' | 'trail'>('default');
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sourceId = 'kiosk-trail-source';
  const layerId = 'kiosk-trail-layer';

  // Inicializa el mapa una sola vez.
  useEffect(() => {
    if (!token || !containerRef.current) return;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [trail.coords.lng, trail.coords.lat],
      zoom: 14,
      interactive: false,
      attributionControl: false,
    });
    mapRef.current = map;

    // Marker del trailhead.
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.style.width = '48px';
    el.style.height = '68px';
    el.style.backgroundImage =
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 46'><path d='M16 0C7.2 0 0 7.2 0 16c0 10.7 13.2 27.5 15 29.4.6.7 1.4.7 2 0 1.8-1.9 15-18.7 15-29.4C32 7.2 24.8 0 16 0z' fill='%23004f8b'/><circle cx='16' cy='16' r='6' fill='%23fff'/></svg>\")";
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundSize = 'contain';
    new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([trail.coords.lng, trail.coords.lat])
      .addTo(map);

    // Cuando el estilo está listo, añadimos la source + layer inicialmente oculta.
    map.on('load', () => {
      if (!mapRef.current) return;
      mapRef.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: trail.trailMap.geojson,
          properties: {},
        },
      });
      mapRef.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          visibility: 'none',
        },
        paint: {
          'line-color': '#1796d6',
          'line-width': 6,
          'line-opacity': 0.92,
        },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token, trail.coords.lat, trail.coords.lng, trail.trailMap.geojson]);

  // Al cambiar de tab: toggle visibility del layer + fit al bbox del trail.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      if (tab === 'trail') {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
        const coords = trail.trailMap.geojson.coordinates;
        if (coords.length > 0) {
          const lngs = coords.map((c) => c[0]);
          const lats = coords.map((c) => c[1]);
          const bounds: [[number, number], [number, number]] = [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ];
          map.fitBounds(bounds, { padding: 48, duration: 600 });
        }
      } else {
        map.setLayoutProperty(layerId, 'visibility', 'none');
        map.flyTo({
          center: [
            trail.trailMap.defaultCenter?.lng ?? trail.coords.lng,
            trail.trailMap.defaultCenter?.lat ?? trail.coords.lat,
          ],
          zoom: trail.trailMap.defaultZoom ?? 14,
          duration: 600,
        });
      }
    };

    if (map.isStyleLoaded() && map.getLayer(layerId)) {
      apply();
    } else {
      map.once('idle', apply);
    }
  }, [tab, trail.coords.lat, trail.coords.lng, trail.trailMap]);

  return (
    <div className="relative h-full w-full">
      {/* Tab bar */}
      <div
        className="flex"
        style={{
          height: '46px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
        }}
      >
        <Tab label={defaultTabLabel} active={tab === 'default'} onClick={() => setTab('default')} />
        <Tab label={trailTabLabel} active={tab === 'trail'} onClick={() => setTab('trail')} />
      </div>

      {/* Mapa — altura = 312 - 46 - 72 (address row) = 194 */}
      <div className="relative" style={{ height: '266px', width: '899px' }}>
        {token ? (
          <div
            ref={containerRef}
            role="img"
            aria-label={`Mapa de ${trail.title}`}
            className="h-full w-full"
          />
        ) : (
          <div
            role="img"
            aria-label={`Mapa de ${trail.title}`}
            className="flex h-full w-full items-center justify-center"
            style={{
              backgroundColor: '#d8d8d8',
              color: '#4a4a4a',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: '16px',
            }}
          >
            Map unavailable
          </div>
        )}
      </div>

      {/* Divider + address + GET DIRECTIONS: coords relativas al slot (384px total) */}
      <div
        aria-hidden
        style={{
          height: '1px',
          backgroundColor: '#e0e0e0',
          marginLeft: '2px',
          marginRight: '3px',
        }}
      />
      <div className="relative" style={{ height: '70px', width: '899px' }}>
        <span
          className="absolute"
          style={{
            left: '36px',
            top: '24px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: '22px',
            lineHeight: '24px',
            color: 'rgba(74,74,74,0.9)',
          }}
        >
          {trail.address}
        </span>

        <button
          type="button"
          aria-label={`Obtener direcciones a ${trail.title}`}
          onClick={onGetDirections}
          className="absolute flex items-center gap-3 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          style={{ left: '634px', top: '14px', height: '44px' }}
        >
          <DirectionsIcon />
          <span
            style={{
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 700,
              fontSize: '18px',
              lineHeight: '18px',
              color: '#6e6e6e',
              letterSpacing: '0.02em',
            }}
          >
            GET DIRECTIONS
          </span>
        </button>
      </div>
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="relative flex-1 font-sans focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-300"
      style={{
        height: '46px',
        backgroundColor: '#ffffff',
        color: active ? '#004f8b' : '#6e6e6e',
        fontSize: '16px',
        lineHeight: '16px',
        fontWeight: active ? 700 : 500,
        letterSpacing: '0.04em',
      }}
    >
      {label}
      {active ? (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0"
          style={{ height: '3px', backgroundColor: '#004f8b' }}
        />
      ) : null}
    </button>
  );
}

function DirectionsIcon() {
  return (
    <svg width="40" height="32" viewBox="0 0 46 36" aria-hidden>
      <g transform="translate(8.498, 26.109)">
        <path
          transform="translate(-60.814, -373.412)"
          d="M87.3,381l-14.08-7.455a1.129,1.129,0,0,0-1.161.067L61.3,381.064a1.119,1.119,0,0,0,.635,2.038H86.777A1.119,1.119,0,0,0,87.3,381Z"
          fill="#004f8b"
        />
      </g>
      <g transform="translate(23.409, 15.784)">
        <path
          transform="translate(-274.069, -225.744)"
          d="M290.36,241.527l-3.311-14.908a1.12,1.12,0,0,0-1.73-.678L274.55,233.4a1.118,1.118,0,0,0,.114,1.906l14.078,7.455a1.122,1.122,0,0,0,.524.132,1.1,1.1,0,0,0,.678-.23A1.12,1.12,0,0,0,290.36,241.527Z"
          fill="#004f8b"
        />
      </g>
      <g transform="translate(5.28, 13.425)">
        <path
          transform="translate(-14.784, -192)"
          d="M41.413,192.785A1.121,1.121,0,0,0,40.344,192H30.132a46.7,46.7,0,0,1-5.734,7.835,3.355,3.355,0,0,1-4.994,0c-.436-.486-1.112-1.262-1.886-2.224L14.81,209.8a1.118,1.118,0,0,0,1.092,1.36,1.108,1.108,0,0,0,.638-.2l24.439-16.922A1.115,1.115,0,0,0,41.413,192.785Z"
          fill="#004f8b"
        />
      </g>
      <g transform="translate(4.565, 0)">
        <path
          transform="translate(-4.565, 0)"
          d="M12.4,0A7.84,7.84,0,0,0,4.565,7.831c0,4.018,6.283,11.136,7,11.934a1.118,1.118,0,0,0,1.665,0c.716-.8,7-7.916,7-11.934A7.84,7.84,0,0,0,12.4,0Zm0,11.187a3.356,3.356,0,1,1,3.356-3.356A3.357,3.357,0,0,1,12.4,11.187Z"
          fill="#004f8b"
        />
      </g>
    </svg>
  );
}
