import type { GuestbookSeedPin } from './config';

/** Aproximación: 1 grado de latitud ≈ 69 millas. */
const DEG_PER_MILE_LAT = 1 / 69;

/**
 * Filtra los `seedPins` cuya `coords` caen dentro de un bounding box de
 * `radiusMi` millas alrededor de `center`. Usa aproximación rectangular
 * (no haversine) — suficiente para dispersión local de pins en un zip.
 */
export function filterPinsByProximity(
  seedPins: readonly GuestbookSeedPin[],
  center: { lat: number; lng: number },
  radiusMi: number,
): GuestbookSeedPin[] {
  const latDelta = radiusMi * DEG_PER_MILE_LAT;
  // Longitud varía con latitud: cos(lat en rad) * DEG_PER_MILE_LAT.
  const lngDelta = latDelta / Math.max(0.1, Math.cos((center.lat * Math.PI) / 180));

  const minLat = center.lat - latDelta;
  const maxLat = center.lat + latDelta;
  const minLng = center.lng - lngDelta;
  const maxLng = center.lng + lngDelta;

  return seedPins.filter(
    (p) =>
      p.coords.lat >= minLat &&
      p.coords.lat <= maxLat &&
      p.coords.lng >= minLng &&
      p.coords.lng <= maxLng,
  );
}
