'use client';

/**
 * Map viewer + draw editor para la `LineString` de un trail.
 *
 * Reemplaza el textarea raw que pedía al operador editar JSON literal.
 * Hallazgo #12 del audit panorámico Studio (2026-05-05).
 *
 * Modos:
 *  - Map (default): Mapbox + draw plugin. El operador dibuja la ruta a mano,
 *    arrastra vertices, los borra. Cada cambio commitea coordinates al schema.
 *  - Raw JSON (fallback): textarea con el array `[lng, lat][]` por si el
 *    operador prefiere copiar-pegar desde una herramienta GIS externa.
 *
 * Si no hay `mapboxToken` configurado en `integrations.mapbox.token`, el
 * componente cae al raw editor con un aviso (graceful degradation).
 */

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import MapboxDraw from '@mapbox/mapbox-gl-draw';
import mapboxgl from 'mapbox-gl';
import { useEffect, useMemo, useRef, useState } from 'react';

import { downsampleCoords, parseGpxToCoords } from '@/lib/gpx-parser';

type Coord = [number, number];

interface TrailGeoJsonFieldProps {
  coordinates: Coord[];
  /** Coords del trailhead (centro fallback si la línea está vacía). */
  fallbackCenter?: { lng: number; lat: number };
  mapboxToken: string;
  onChange: (next: Coord[]) => void;
}

export function TrailGeoJsonField({
  coordinates,
  fallbackCenter,
  mapboxToken,
  onChange,
}: TrailGeoJsonFieldProps) {
  const [mode, setMode] = useState<'map' | 'raw'>(mapboxToken ? 'map' : 'raw');

  return (
    <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex items-center justify-between gap-2">
        <h5 className="text-[11.5px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          Trail map (GeoJSON)
        </h5>
        <div className="flex items-center gap-1">
          <ModeButton
            label="Map"
            active={mode === 'map'}
            disabled={!mapboxToken}
            onClick={() => setMode('map')}
          />
          <ModeButton
            label="Raw JSON"
            active={mode === 'raw'}
            onClick={() => setMode('raw')}
          />
        </div>
      </div>

      {!mapboxToken ? (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Map disabled — set <code>integrations.mapbox.token</code> in Integrations to enable
          the visual editor.
        </p>
      ) : null}

      {mode === 'map' && mapboxToken ? (
        <TrailDrawMap
          coordinates={coordinates}
          fallbackCenter={fallbackCenter}
          mapboxToken={mapboxToken}
          onChange={onChange}
        />
      ) : (
        <RawJsonField coordinates={coordinates} onChange={onChange} />
      )}
    </div>
  );
}

function ModeButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-2.5 py-0.5 text-[11px] transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Map editor                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function TrailDrawMap({
  coordinates,
  fallbackCenter,
  mapboxToken,
  onChange,
}: TrailGeoJsonFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const featureIdRef = useRef<string | null>(null);
  const skipNextSyncRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const initialCenter = useMemo<[number, number]>(() => {
    if (coordinates.length > 0) return coordinates[0]!;
    if (fallbackCenter) return [fallbackCenter.lng, fallbackCenter.lat];
    return [-98.5, 39.5]; // centro continental USA, fallback final.
  }, [coordinates, fallbackCenter]);

  // Init mapa + draw plugin (una sola vez).
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: initialCenter,
      zoom: coordinates.length > 0 ? 13 : 9,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { line_string: true, trash: true },
      defaultMode: 'simple_select',
      styles: drawStyles,
    });
    drawRef.current = draw;
    map.addControl(draw as unknown as mapboxgl.IControl, 'top-left');

    map.on('load', () => {
      if (coordinates.length >= 2) {
        const ids = draw.add({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates },
        });
        featureIdRef.current = ids[0] ?? null;
        fitToCoords(map, coordinates);
      } else {
        // Sin línea aún → arrancar en modo dibujo para que el operador
        // empiece a clickear puntos directamente.
        draw.changeMode('draw_line_string');
      }
    });

    const sync = () => {
      if (skipNextSyncRef.current) {
        skipNextSyncRef.current = false;
        return;
      }
      const fc = draw.getAll();
      const lines = fc.features.filter((f) => f.geometry.type === 'LineString');
      // Tomar la línea más reciente (o la única). Si hay varias, fundir
      // ignorando las viejas — el modelo es 1 trail = 1 LineString.
      const last = lines[lines.length - 1];
      if (!last || last.geometry.type !== 'LineString') {
        onChangeRef.current([]);
        featureIdRef.current = null;
        return;
      }
      featureIdRef.current = String(last.id ?? '');
      const coords = last.geometry.coordinates as Coord[];
      onChangeRef.current(coords.slice());
    };

    map.on('draw.create', sync);
    map.on('draw.update', sync);
    map.on('draw.delete', sync);

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
      featureIdRef.current = null;
    };
    // initialCenter/coordinates intencionalmente fuera: la inicialización
    // ocurre 1× y los cambios externos se reflejan en el efecto siguiente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]);

  // Sincronizar coordinates externos → draw plugin (cuando otro componente
  // las cambia, eg. Raw JSON tab o Reset).
  useEffect(() => {
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map || !draw) return;
    if (!map.isStyleLoaded()) {
      const onLoad = () => syncExternal(draw, coordinates, featureIdRef);
      map.once('load', onLoad);
      return () => {
        map.off('load', onLoad);
      };
    }
    syncExternal(draw, coordinates, featureIdRef);
  }, [coordinates]);

  const handleClear = () => {
    const draw = drawRef.current;
    if (!draw) return;
    draw.deleteAll();
    onChangeRef.current([]);
    draw.changeMode('draw_line_string');
  };

  const handleCenter = () => {
    const map = mapRef.current;
    if (!map) return;
    if (coordinates.length >= 2) {
      fitToCoords(map, coordinates);
    } else if (fallbackCenter) {
      map.flyTo({ center: [fallbackCenter.lng, fallbackCenter.lat], zoom: 13 });
    }
  };

  const handleDrawMore = () => {
    const draw = drawRef.current;
    if (!draw) return;
    draw.changeMode('draw_line_string');
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importInfo, setImportInfo] = useState<string | null>(null);

  const handleImportGpx = () => fileInputRef.current?.click();

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-importar el mismo archivo después.
    if (!file) return;
    setImportError(null);
    setImportInfo(null);
    try {
      const xml = await file.text();
      const { coords, pointCount, trackName } = parseGpxToCoords(xml);
      // Downsample agresivo: 5000+ puntos de Strava → 500 max para no
      // saturar el KV (cada coord son ~25 bytes serializados).
      const reduced = downsampleCoords(coords, 500);
      onChangeRef.current(reduced);
      setImportInfo(
        `Imported ${pointCount.toLocaleString()} points${
          reduced.length < pointCount ? ` (downsampled to ${reduced.length})` : ''
        }${trackName ? ` from “${trackName}”` : ''}.`,
      );
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to parse GPX.');
    }
  };

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="h-[320px] w-full overflow-hidden rounded-md ring-1 ring-zinc-200 dark:ring-zinc-800"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleDrawMore}
          className="rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-700 transition hover:bg-sky-500/20 dark:text-sky-300"
        >
          Draw line
        </button>
        <button
          type="button"
          onClick={handleImportGpx}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-900"
          title="Import a .gpx file (Strava, AllTrails, Garmin, etc.)"
        >
          Import GPX
        </button>
        <button
          type="button"
          onClick={handleCenter}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Recenter
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-md border border-rose-300/60 bg-rose-50 px-2 py-1 text-[11px] text-rose-700 transition hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
        >
          Clear
        </button>
        <span className="ml-auto text-[11px] text-zinc-500">
          {coordinates.length} points
        </span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx,application/gpx+xml,application/xml,text/xml"
        className="hidden"
        onChange={onFileSelected}
      />
      {importError ? (
        <p className="text-[11px] text-rose-600 dark:text-rose-400">{importError}</p>
      ) : importInfo ? (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{importInfo}</p>
      ) : (
        <p className="text-[11px] leading-snug text-zinc-500">
          Click <em>Draw line</em>, then click on the map to add points. Double-click to
          finish. Drag a vertex to move it; click <em>Trash</em> in the top-left toolbar to
          delete the selected feature. Or <em>Import GPX</em> from your hike app.
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Raw JSON fallback                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

function RawJsonField({
  coordinates,
  onChange,
}: {
  coordinates: Coord[];
  onChange: (next: Coord[]) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(coordinates));
  const [error, setError] = useState<string | null>(null);

  // Si el array externo cambia (p.ej. desde el map editor), refrescamos
  // el textarea — pero solo si el contenido difiere para no pisar la
  // edición en curso del operador.
  useEffect(() => {
    const next = JSON.stringify(coordinates);
    setText((prev) => (prev === next ? prev : next));
  }, [coordinates]);

  const commit = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('must be a JSON array');
      const valid = parsed.every(
        (p: unknown) =>
          Array.isArray(p) &&
          p.length === 2 &&
          typeof p[0] === 'number' &&
          typeof p[1] === 'number',
      );
      if (!valid) throw new Error('expected array of [lng, lat] tuples');
      onChange((parsed as Coord[]).slice());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  return (
    <label className="block space-y-1">
      <span className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
        Coordinates ([lng, lat] tuples)
      </span>
      <textarea
        rows={4}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        placeholder='[[-112.123,36.123],[-112.124,36.124]]'
        className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[11px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-600"
      />
      {error ? (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">{error}</p>
      ) : (
        <p className="text-[11px] text-zinc-500">{coordinates.length} points.</p>
      )}
    </label>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function fitToCoords(map: mapboxgl.Map, coords: Coord[]) {
  if (coords.length < 2) return;
  const bounds = new mapboxgl.LngLatBounds();
  for (const [lng, lat] of coords) bounds.extend([lng, lat]);
  map.fitBounds(bounds, { padding: 32, maxZoom: 16, duration: 600 });
}

function syncExternal(
  draw: MapboxDraw,
  coords: Coord[],
  featureIdRef: { current: string | null },
) {
  const existingId = featureIdRef.current;
  // Si las coords coinciden con lo que el plugin ya tiene, nada que hacer.
  if (existingId) {
    const feat = draw.get(existingId);
    if (
      feat &&
      feat.geometry.type === 'LineString' &&
      sameCoords(feat.geometry.coordinates as Coord[], coords)
    ) {
      return;
    }
  }
  draw.deleteAll();
  if (coords.length >= 2) {
    const ids = draw.add({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coords },
    });
    featureIdRef.current = ids[0] ?? null;
  } else {
    featureIdRef.current = null;
  }
}

function sameCoords(a: Coord[], b: Coord[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]![0] !== b[i]![0] || a[i]![1] !== b[i]![1]) return false;
  }
  return true;
}

/**
 * Estilos del draw plugin alineados con el resto del Studio (sky-500 = brand
 * neutral del editor; el preview del kiosk usa los tokens del cliente).
 */
const drawStyles = [
  {
    id: 'gl-draw-line',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#0ea5e9',
      'line-width': 4,
      'line-opacity': 0.9,
    },
  },
  {
    id: 'gl-draw-line-static',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['==', 'mode', 'static']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#0ea5e9',
      'line-width': 4,
    },
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-halo-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
    paint: { 'circle-radius': 7, 'circle-color': '#ffffff' },
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
    paint: { 'circle-radius': 5, 'circle-color': '#0ea5e9' },
  },
  {
    id: 'gl-draw-line-midpoint',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'midpoint'], ['==', '$type', 'Point']],
    paint: { 'circle-radius': 4, 'circle-color': '#0ea5e9', 'circle-opacity': 0.6 },
  },
];
