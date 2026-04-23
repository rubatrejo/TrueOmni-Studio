/**
 * Geocoding del Guestbook: zip code → coords via Mapbox Geocoding API v5.
 *
 * Con fallback: si el fetch falla (network error, token inválido, zip no
 * encontrado) devuelve null y el llamante cae a `config.client.coords`.
 */
export interface GeocodeResult {
  lat: number;
  lng: number;
  /** Nombre legible del lugar ("Miami, Florida"). */
  placeName: string;
}

export async function geocodeZip(
  zip: string,
  mapboxToken: string,
  countryCode = 'US',
): Promise<GeocodeResult | null> {
  const sanitized = zip.trim();
  if (sanitized.length < 3) return null;
  if (!mapboxToken) return null;

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(sanitized)}.json` +
    `?country=${encodeURIComponent(countryCode.toLowerCase())}` +
    `&types=postcode` +
    `&limit=1` +
    `&access_token=${encodeURIComponent(mapboxToken)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout?.(5000) });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      features?: Array<{ center?: [number, number]; place_name?: string }>;
    };
    const hit = body.features?.[0];
    if (!hit?.center) return null;
    const [lng, lat] = hit.center;
    return { lat, lng, placeName: hit.place_name ?? sanitized };
  } catch {
    return null;
  }
}
