/**
 * Normaliza un path de asset del Trip Planner (Fase 3.17).
 * - URLs absolutas (http/https) se devuelven sin cambios.
 * - Paths que empiezan con `/` se devuelven sin cambios (ya son absolute).
 * - Paths relativos (`assets/itinerary/...`) se prefijan con `/`.
 *
 * Mismo patrón que `resolvePhotoBoothAsset`.
 */
export function resolveItineraryAsset(raw: string): string {
  if (!raw) return raw;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/')) return raw;
  return `/${raw}`;
}

/**
 * Construye una URL del Mapbox Static Image API para usar de fondo decorativo
 * (ej. el welcome popup del Trip Planner). Sin pins/markers — solo el mapa.
 *
 * Si no hay token o coords, devuelve null y el caller usa un fallback.
 */
export function buildMapboxStaticUrl(opts: {
  token: string | undefined;
  lng: number | undefined;
  lat: number | undefined;
  zoom?: number;
  width?: number;
  height?: number;
  style?: string;
}): string | null {
  const { token, lng, lat } = opts;
  if (!token || lng === undefined || lat === undefined) return null;
  const zoom = opts.zoom ?? 12;
  const width = opts.width ?? 620;
  const height = opts.height ?? 800;
  const style = opts.style ?? 'streets-v12';
  return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${lng},${lat},${zoom},0/${width}x${height}@2x?access_token=${token}`;
}
