'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import type { GeoJSONSource } from 'mapbox-gl';
import { useEffect, useRef } from 'react';

import type { MapSource } from '@/lib/config';
import type { MapItem } from '@/lib/map-item';

import { pinDataUri, selectedPinSvg } from './map-pin-icons';

const SOURCES: readonly MapSource[] = ['restaurants', 'things-to-do', 'stay', 'events'] as const;
const PIN_IMAGE_PREFIX = 'map-pin-';

interface MapCanvasProps {
  token: string | undefined;
  items: readonly MapItem[];
  center: { lat: number; lng: number };
  zoom: number;
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  /** Posición del pin seleccionado en px relativos al canvas. null si no hay. */
  onSelectedPosition?: (pos: { left: number; top: number } | null) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Mapa interactivo con clustering nativo de Mapbox GL y pins por categoría.
 * La source única `items` agrupa todos los `MapItem` como features GeoJSON;
 * los layers se separan entre `clusters`, `cluster-count` y el symbol
 * `unclustered-point`. El pin seleccionado se renderiza como `mapboxgl.Marker`
 * aparte (sale del cluster) para poder animarse y mostrar la flecha inferior.
 */
export function MapCanvas({
  token,
  items,
  center,
  zoom,
  selectedSlug,
  onSelect,
  onSelectedPosition,
  className,
  style,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const readyRef = useRef(false);
  const itemsRef = useRef<readonly MapItem[]>(items);

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
      readyRef.current = true;

      for (const source of SOURCES) {
        const img = new Image(140, 188);
        img.onload = () => {
          if (!map.hasImage(`${PIN_IMAGE_PREFIX}${source}`)) {
            map.addImage(`${PIN_IMAGE_PREFIX}${source}`, img, { pixelRatio: 2 });
          }
        };
        img.src = pinDataUri(source);
      }

      map.addSource('items', {
        type: 'geojson',
        data: toFeatureCollection(itemsRef.current),
        cluster: true,
        // Más agresivo desclustering (antes clusterMaxZoom:14, clusterRadius:50):
        // a partir de zoom 15 se desagrupan; radio de clustering más chico para
        // que más pins se muestren sueltos y el mapa se vea poblado.
        clusterMaxZoom: 15,
        clusterRadius: 18,
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'items',
        filter: ['has', 'point_count'],
        paint: {
          // Azul oscuro (primario del kiosk) en lugar del coral anterior.
          'circle-color': '#004f8b',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 4,
          'circle-radius': ['step', ['get', 'point_count'], 34, 10, 42, 50, 52],
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'items',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 26,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      });

      map.addLayer({
        id: 'unclustered-point',
        type: 'symbol',
        source: 'items',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': ['concat', PIN_IMAGE_PREFIX, ['get', 'source']],
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
          'icon-size': 1,
        },
      });

      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0]?.properties?.cluster_id;
        if (clusterId == null) return;
        const src = map.getSource('items') as GeoJSONSource;
        src.getClusterExpansionZoom(clusterId as number, (err, expansion) => {
          if (err || expansion == null) return;
          const feat = features[0];
          if (!feat || feat.geometry.type !== 'Point') return;
          const [lng, lat] = feat.geometry.coordinates as [number, number];
          map.easeTo({ center: [lng, lat], zoom: expansion });
        });
      });

      map.on('click', 'unclustered-point', (e) => {
        const feat = e.features?.[0];
        const slug = feat?.properties?.slug as string | undefined;
        if (slug) onSelect(slug);
      });

      map.on('mouseenter', 'clusters', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'clusters', () => (map.getCanvas().style.cursor = ''));
      map.on('mouseenter', 'unclustered-point', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'unclustered-point', () => (map.getCanvas().style.cursor = ''));
    });

    return () => {
      selectedMarkerRef.current?.remove();
      selectedMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Sync del source cuando cambian items (filter aplicado).
  useEffect(() => {
    itemsRef.current = items;
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource('items') as GeoJSONSource | undefined;
    if (src) src.setData(toFeatureCollection(items));
  }, [items]);

  // Selected pin: DOM marker + easeTo + sync de posición para la burbuja.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    selectedMarkerRef.current?.remove();
    selectedMarkerRef.current = null;

    if (!selectedSlug) {
      onSelectedPosition?.(null);
      return;
    }
    const item = items.find((it) => it.slug === selectedSlug);
    if (!item) {
      onSelectedPosition?.(null);
      return;
    }

    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.style.width = '156px';
    el.style.height = '210px';
    el.style.pointerEvents = 'none';
    el.innerHTML = selectedPinSvg(item.source);

    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([item.coords.lng, item.coords.lat])
      .addTo(map);
    selectedMarkerRef.current = marker;

    const project = () => {
      if (!mapRef.current || !onSelectedPosition) return;
      const { x, y } = mapRef.current.project([item.coords.lng, item.coords.lat]);
      onSelectedPosition({ left: x, top: y });
    };
    project();

    map.on('move', project);
    map.on('zoom', project);
    map.on('resize', project);

    map.easeTo({
      center: [item.coords.lng, item.coords.lat],
      zoom: Math.max(14, map.getZoom()),
      duration: 600,
    });

    return () => {
      map.off('move', project);
      map.off('zoom', project);
      map.off('resize', project);
    };
  }, [selectedSlug, items, onSelectedPosition]);

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
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '18px',
          ...style,
        }}
      >
        Map unavailable (missing Mapbox token)
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Interactive kiosk map"
      className={className}
      style={style}
    />
  );
}

function toFeatureCollection(items: readonly MapItem[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: items.map((it) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [it.coords.lng, it.coords.lat] },
      properties: {
        slug: it.slug,
        source: it.source,
        moduleSlug: it.moduleSlug,
        title: it.title,
      },
    })),
  };
}
