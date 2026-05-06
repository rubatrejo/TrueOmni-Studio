/**
 * GPX (GPS Exchange Format) parser — minimal, no deps.
 *
 * Extension del hallazgo #12 audit Studio: el operador puede subir un archivo
 * `.gpx` (de Strava, AllTrails, Garmin, etc.) y el TrailGeoJsonField
 * convierte la traza en `[lng, lat][]` para el LineString del trail.
 *
 * GPX is just XML. Aceptamos las dos fuentes de coordenadas más comunes:
 *  - `<trk>/<trkseg>/<trkpt lat lon>` — track points (hike actual).
 *  - `<rte>/<rtept lat lon>` — route points (planned route).
 *
 * Si hay varios `<trkseg>` los concatenamos en una sola línea (el modelo
 * del kiosk asume una LineString por trail; para multi-segmento se pierde
 * el corte explícito pero la geometría se preserva).
 */

type Coord = [number, number];

export interface GpxParseResult {
  coords: Coord[];
  pointCount: number;
  /** `<name>` del primer track (si lo trae el GPX) — útil para sugerir título. */
  trackName?: string;
}

export function parseGpxToCoords(xml: string): GpxParseResult {
  // DOMParser está disponible en navegadores modernos (Chrome/Safari/FF).
  // En SSR no se usa este código (componente es 'use client').
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  const parserError = doc.getElementsByTagName('parsererror')[0];
  if (parserError) {
    throw new Error('Invalid XML — file is not valid GPX.');
  }

  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'gpx') {
    throw new Error('Not a GPX file — root element is not <gpx>.');
  }

  const coords: Coord[] = [];

  // 1. <trk>/<trkseg>/<trkpt> — preferido (hike real).
  const trks = doc.getElementsByTagName('trk');
  let trackName: string | undefined;
  for (let i = 0; i < trks.length; i++) {
    const trk = trks[i]!;
    if (i === 0) {
      const nameEl = trk.getElementsByTagName('name')[0];
      if (nameEl?.textContent) trackName = nameEl.textContent.trim();
    }
    const segs = trk.getElementsByTagName('trkseg');
    for (let j = 0; j < segs.length; j++) {
      const pts = segs[j]!.getElementsByTagName('trkpt');
      for (let k = 0; k < pts.length; k++) {
        const pt = pts[k]!;
        const lat = parseFloat(pt.getAttribute('lat') ?? '');
        const lon = parseFloat(pt.getAttribute('lon') ?? '');
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          coords.push([lon, lat]);
        }
      }
    }
  }

  // 2. Fallback: <rte>/<rtept> (planned route, sin trkpts).
  if (coords.length === 0) {
    const rtepts = doc.getElementsByTagName('rtept');
    for (let i = 0; i < rtepts.length; i++) {
      const pt = rtepts[i]!;
      const lat = parseFloat(pt.getAttribute('lat') ?? '');
      const lon = parseFloat(pt.getAttribute('lon') ?? '');
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        coords.push([lon, lat]);
      }
    }
  }

  if (coords.length === 0) {
    throw new Error('No track or route points found in GPX.');
  }

  return { coords, pointCount: coords.length, trackName };
}

/**
 * Reduce un array denso de coordenadas (típicamente >5000 en GPX de Strava)
 * a un sub-conjunto representativo usando muestreo uniforme. Mantiene
 * primer y último punto; toma `targetCount - 2` intermedios espaciados.
 *
 * Para trails no necesitamos resolución submétrica — un point cada 10-20m
 * es plenty para renderizar la línea en Mapbox sin saturar el KV.
 */
export function downsampleCoords(coords: Coord[], targetCount = 500): Coord[] {
  if (coords.length <= targetCount) return coords;

  const out: Coord[] = [coords[0]!];
  const step = (coords.length - 1) / (targetCount - 1);
  for (let i = 1; i < targetCount - 1; i++) {
    const idx = Math.round(i * step);
    out.push(coords[idx]!);
  }
  out.push(coords[coords.length - 1]!);
  return out;
}
