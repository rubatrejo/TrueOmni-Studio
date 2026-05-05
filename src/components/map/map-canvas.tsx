'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import type { GeoJSONSource } from 'mapbox-gl';
import { useEffect, useRef } from 'react';

import { isCanonicalMapSource, type MapSource } from '@/lib/map-source';
import type { MapItem } from '@/lib/map-item';

import {
  customPinSvg,
  pinDataUri,
  resolveBrandColor,
  resolveMapPinColor,
  selectedPinSvg,
} from './map-pin-icons';

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
  /** Si se pasa, dibuja una LineString conectando estos puntos (Trip Builder). */
  routeStops?: readonly { lng: number; lat: number }[];
  /** Color CSS de la línea de ruta. Default = primary del kiosk. */
  routeColor?: string;
  /** Padding (px) aplicado en el easeTo del pin seleccionado para
   *  desplazar el centro visible. Útil cuando hay sidebar/overlay sobre el mapa. */
  flyToPadding?: { top?: number; bottom?: number; left?: number; right?: number };
  /** Si true, cuando cambian los `routeStops` y hay ≥2, el mapa hace
   *  `fitBounds` para encuadrar todos los stops + ruta dentro del viewport. */
  fitRouteBounds?: boolean;
  /** Multiplicador del tamaño de los pins (S=0.75, M=1.0, L=1.3). Default 1. */
  pinScale?: number;
  /**
   * Override de iconKey por categoría. Si el operador asignó `coffee` a
   * `restaurants`, todos los pins de esa categoría usan el icono coffee
   * en lugar del cubiertos canónico.
   */
  categoryIcons?: Partial<Record<MapSource, string>>;
  /**
   * Listing modules dinámicos (no canónicos) con su iconKey/customIcon.
   * Sus items se renderizan como `mapboxgl.Marker` HTML con el icono y
   * color dinámico de cada categoría — fuera del cluster Mapbox.
   */
  dynamicListings?: ReadonlyArray<{
    key: string;
    label: string;
    iconKey?: string;
    customIcon?: string;
  }>;
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
  routeStops,
  routeColor,
  flyToPadding,
  fitRouteBounds,
  pinScale = 1,
  categoryIcons,
  dynamicListings,
  className,
  style,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const customMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const readyRef = useRef(false);
  const itemsRef = useRef<readonly MapItem[]>(items);
  const routeStopsRef = useRef<readonly { lng: number; lat: number }[] | undefined>(routeStops);
  routeStopsRef.current = routeStops;

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
        img.src = pinDataUri(source, categoryIcons?.[source]);
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

      // Mapbox NO acepta `hsl(var(--brand-primary))` como `paint.circle-color`
      // — su validador exige un color literal. Resolvemos la CSS var al valor
      // hsl real en runtime (igual que ya hacía `route-line` más abajo).
      const clusterColor = resolveBrandColor('--brand-primary', '#0066cc');
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'items',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': clusterColor,
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
          'icon-size': pinScale,
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

      // Layer opcional de ruta del Trip Builder (LineString entre stops).
      // Se añade siempre vacío; el effect setData lo llena cuando cambian.
      const lineColor =
        routeColor ??
        (() => {
          const v = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary')
            .trim();
          // Mapbox no acepta el formato moderno `hsl(H S% L%)` (sin comas);
          // convertir a `hsl(H, S%, L%)` para que la librería lo parsee.
          return v ? `hsl(${v.split(/\s+/).join(', ')})` : 'hsl(var(--brand-secondary))';
        })();
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer(
        {
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': lineColor,
            'line-width': 5,
            'line-opacity': 0.85,
          },
        },
        // Insertar la línea ANTES de los pins para que los pins queden encima.
        'unclustered-point',
      );
      // Si ya teníamos stops antes del load (race), aplicar ahora.
      const initialStops = routeStopsRef.current;
      if (initialStops && initialStops.length >= 2) {
        const src = map.getSource('route') as GeoJSONSource | undefined;
        src?.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: initialStops.map((s) => [s.lng, s.lat]),
              },
            },
          ],
        });
      }
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

  // Sync de zoom y center cuando el editor del Studio los cambia. Sin esto
  // el slider del MapEditor no afecta el preview hasta hacer reload.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    if (Math.abs(map.getZoom() - zoom) > 0.05) {
      map.easeTo({ zoom, duration: 250 });
    }
  }, [zoom]);

  // Sync del tamaño de pins (icon-size) sin re-init.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    try {
      map.setLayoutProperty('unclustered-point', 'icon-size', pinScale);
    } catch {
      /* layer aún no añadido */
    }
  }, [pinScale]);

  // Sync de iconos por categoría: regenera el data URI y reemplaza la
  // imagen en Mapbox sin reinicializar el mapa.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    for (const source of SOURCES) {
      const img = new Image(140, 188);
      img.onload = () => {
        const key = `${PIN_IMAGE_PREFIX}${source}`;
        try {
          if (map.hasImage(key)) map.removeImage(key);
          map.addImage(key, img, { pixelRatio: 2 });
        } catch {
          /* concurrencia con destroy del mapa */
        }
      };
      img.src = pinDataUri(source, categoryIcons?.[source]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    categoryIcons?.restaurants,
    categoryIcons?.['things-to-do'],
    categoryIcons?.stay,
    categoryIcons?.events,
  ]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const cur = map.getCenter();
    if (Math.abs(cur.lng - center.lng) > 1e-5 || Math.abs(cur.lat - center.lat) > 1e-5) {
      map.easeTo({ center: [center.lng, center.lat], duration: 350 });
    }
  }, [center.lat, center.lng]);

  // Custom pins (moduleSlug === 'custom') + items con source NO canónico
  // (listings dinámicos como Shopping/Wellness) se renderizan como HTML
  // Markers independientes del cluster Mapbox. Permite usar el catálogo
  // extendido de iconos sin pre-registrar imágenes en Mapbox por cada
  // posible categoría dinámica.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    customMarkersRef.current.forEach((m) => m.remove());
    customMarkersRef.current = [];
    // Index dynamicListings por key para sacar iconKey/customIcon de cada
    // listing module no canónico.
    const dynBySource = new Map<
      string,
      { iconKey?: string; customIcon?: string }
    >();
    if (dynamicListings) {
      for (const d of dynamicListings) dynBySource.set(d.key, d);
    }
    const htmlItems = items.filter(
      (it) => it.moduleSlug === 'custom' || !isCanonicalMapSource(it.source),
    );
    if (htmlItems.length === 0) {
      return () => {
        customMarkersRef.current.forEach((m) => m.remove());
        customMarkersRef.current = [];
      };
    }
    for (const item of htmlItems) {
      const color = resolveMapPinColor(item.source);
      // Para custom pins el iconKey viene en el item; para dinámicos viene
      // del listing entry; fallback a 'info'.
      let iconKey = item.iconKey || dynBySource.get(item.source)?.iconKey || 'info';
      const customIconUrl = dynBySource.get(item.source)?.customIcon;
      const w = Math.round(70 * pinScale);
      const h = Math.round(94 * pinScale);
      const el = document.createElement('div');
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.cursor = 'pointer';
      el.setAttribute('aria-label', item.title);
      if (customIconUrl) {
        // Render del teardrop con `<img>` del custom icon en el círculo.
        // Más simple que customPinSvg porque el SVG no puede inline una
        // image que viva fuera del documento sin xlink:href.
        el.innerHTML = `
          <div style="position:relative;width:${w}px;height:${h}px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 140 188" style="position:absolute;inset:0;">
              <g transform="scale(2)">
                <path d="M9.586,58.734h0A34.762,34.762,0,0,1,35,0,34.762,34.762,0,0,1,60.411,58.734h.043L34.394,94Z" fill="${color}"/>
                <g transform="translate(5 5)"><ellipse cx="29.988" cy="29.865" rx="28.988" ry="28.865" fill="#ffffff"/></g>
              </g>
            </svg>
            <img src="${customIconUrl}" alt="" style="position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);width:${Math.round(w * 0.4)}px;height:${Math.round(w * 0.4)}px;object-fit:contain;pointer-events:none;" />
          </div>`;
      } else {
        el.innerHTML = customPinSvg(iconKey, color)
          .replace('width="140"', `width="${w}"`)
          .replace('height="188"', `height="${h}"`);
      }
      el.addEventListener('click', () => onSelect(item.slug));
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([item.coords.lng, item.coords.lat])
        .addTo(map);
      customMarkersRef.current.push(marker);
    }
    return () => {
      customMarkersRef.current.forEach((m) => m.remove());
      customMarkersRef.current = [];
    };
  }, [items, onSelect, pinScale, dynamicListings]);

  // Sync de la ruta (LineString) cuando cambian los stops del rail.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource('route') as GeoJSONSource | undefined;
    if (!src) return;
    if (!routeStops || routeStops.length < 2) {
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
            coordinates: routeStops.map((s) => [s.lng, s.lat]),
          },
        },
      ],
    });

    // Fit bounds para que todos los stops queden visibles.
    if (fitRouteBounds && routeStops.length >= 2) {
      const bounds = new mapboxgl.LngLatBounds();
      routeStops.forEach((s) => bounds.extend([s.lng, s.lat]));
      const pad = flyToPadding ?? {};
      map.fitBounds(bounds, {
        padding: {
          top: (pad.top ?? 0) + 80,
          bottom: (pad.bottom ?? 0) + 80,
          left: (pad.left ?? 0) + 80,
          right: (pad.right ?? 0) + 80,
        },
        duration: 600,
        maxZoom: 14,
      });
    }
  }, [routeStops, fitRouteBounds, flyToPadding]);

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

    // Bubble se oculta durante el ease programático y aparece (con pin debajo)
    // recién al moveend. Después del moveend, attachamos los listeners de
    // 'move'/'zoom'/'resize' para que el bubble siga al pin si el usuario pana
    // manualmente el mapa.
    onSelectedPosition?.(null);

    let manualListenersAttached = false;
    const attachManualListeners = () => {
      if (manualListenersAttached) return;
      manualListenersAttached = true;
      map.on('move', project);
      map.on('zoom', project);
      map.on('resize', project);
    };

    const handleMoveEnd = () => {
      project();
      attachManualListeners();
      map.off('moveend', handleMoveEnd);
    };
    map.on('moveend', handleMoveEnd);

    map.easeTo({
      center: [item.coords.lng, item.coords.lat],
      zoom: Math.max(14, map.getZoom()),
      duration: 450,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      padding: flyToPadding,
    });

    return () => {
      if (manualListenersAttached) {
        map.off('move', project);
        map.off('zoom', project);
        map.off('resize', project);
      }
      map.off('moveend', handleMoveEnd);
    };
  }, [selectedSlug, items, onSelectedPosition, flyToPadding]);

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
  // Custom pins + dynamic listings (sources no canónicos) van fuera del
  // GeoJSON: se renderizan como HTML Markers. Solo los 4 canónicos van por
  // el cluster Mapbox.
  return {
    type: 'FeatureCollection',
    features: items
      .filter((it) => it.moduleSlug !== 'custom' && isCanonicalMapSource(it.source))
      .map((it) => ({
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
