'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

import { resolveBrandColor, resolveMapPinColor } from '@/components/map/map-pin-icons';

const BRAND = 'hsl(var(--brand-primary))';
const BRAND_TINT = 'hsl(var(--brand-primary) / 0.08)';
const OPEN_SANS = 'var(--font-open-sans)';

export interface PwaTrailMapData {
  coords: { lat: number; lng: number };
  geojson: { type: 'LineString'; coordinates: [number, number][] };
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
}

/**
 * Bloque de mapa del detalle de Trails (PWA mobile). Réplica a escala mobile del
 * `TrailMapTabs` del kiosk: tab bar [Default Map | Trail Map] + un único mapa
 * Mapbox. En "Trail Map" se muestra la `source/layer` con el GeoJSON LineString
 * del trail y se ajusta el bbox; en "Default Map" la layer se oculta. La fila de
 * dirección + GET DIRECTIONS la sigue aportando `ListingsDetailScreen` (no se
 * duplica aquí). Los colores se resuelven a literal (Mapbox no acepta CSS vars).
 */
export function PwaTrailMap({
  data,
  token,
  defaultLabel,
  trailLabel,
  title,
}: {
  data: PwaTrailMapData;
  token: string | undefined;
  defaultLabel: string;
  trailLabel: string;
  title: string;
}) {
  const [tab, setTab] = useState<'default' | 'trail'>('default');
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sourceId = 'pwa-trail-source';
  const layerId = 'pwa-trail-layer';

  // Inicializa el mapa una sola vez.
  useEffect(() => {
    if (!token || !containerRef.current) return;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [data.coords.lng, data.coords.lat],
      zoom: 13,
      interactive: false,
      attributionControl: false,
    });
    mapRef.current = map;

    const pinColor = resolveMapPinColor('trails');
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.style.width = '30px';
    el.style.height = '42px';
    el.style.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 46'><path d='M16 0C7.2 0 0 7.2 0 16c0 10.7 13.2 27.5 15 29.4.6.7 1.4.7 2 0 1.8-1.9 15-18.7 15-29.4C32 7.2 24.8 0 16 0z' fill='${pinColor}'/><circle cx='16' cy='16' r='6' fill='#fff'/></svg>`,
    )}")`;
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundSize = 'contain';
    new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([data.coords.lng, data.coords.lat])
      .addTo(map);

    map.on('load', () => {
      if (!mapRef.current) return;
      mapRef.current.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'Feature', geometry: data.geojson, properties: {} },
      });
      mapRef.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'none' },
        paint: {
          'line-color': resolveBrandColor('--brand-secondary', '#1796d6'),
          'line-width': 5,
          'line-opacity': 0.92,
        },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token, data.coords.lat, data.coords.lng, data.geojson]);

  // Al cambiar de tab: toggle del layer + fit al bbox / flyTo al centro.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      if (tab === 'trail') {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
        const coords = data.geojson.coordinates;
        if (coords.length > 0) {
          const lngs = coords.map((c) => c[0]);
          const lats = coords.map((c) => c[1]);
          map.fitBounds(
            [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ],
            { padding: 36, duration: 600 },
          );
        }
      } else {
        map.setLayoutProperty(layerId, 'visibility', 'none');
        map.flyTo({
          center: [
            data.defaultCenter?.lng ?? data.coords.lng,
            data.defaultCenter?.lat ?? data.coords.lat,
          ],
          zoom: data.defaultZoom ?? 13,
          duration: 600,
        });
      }
    };

    if (map.isStyleLoaded() && map.getLayer(layerId)) apply();
    else map.once('idle', apply);
  }, [tab, data.coords.lat, data.coords.lng, data.geojson, data.defaultCenter, data.defaultZoom]);

  return (
    <div className="w-full">
      {/* Segmented tabs */}
      <div className="px-[18px] pt-3">
        <div
          className="flex overflow-hidden rounded-[6px]"
          style={{ height: 36, border: `1px solid ${BRAND}` }}
        >
          {(
            [
              ['default', defaultLabel],
              ['trail', trailLabel],
            ] as const
          ).map(([key, label]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className="flex flex-1 items-center justify-center font-semibold"
                style={{
                  fontSize: 14,
                  fontFamily: OPEN_SANS,
                  backgroundColor: active ? BRAND : BRAND_TINT,
                  color: active ? '#fff' : BRAND,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mapa */}
      <div className="mt-3 w-full" style={{ height: 180 }}>
        {token ? (
          <div
            ref={containerRef}
            role="img"
            aria-label={`Map of ${title}`}
            className="h-full w-full"
          />
        ) : (
          <div
            role="img"
            aria-label={`Map of ${title}`}
            className="flex h-full w-full items-center justify-center"
            style={{
              backgroundColor: 'hsl(var(--foreground) / 0.06)',
              color: 'hsl(var(--foreground) / 0.5)',
              fontSize: 14,
              fontFamily: OPEN_SANS,
            }}
          >
            Map unavailable
          </div>
        )}
      </div>
    </div>
  );
}
