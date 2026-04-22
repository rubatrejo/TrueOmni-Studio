import { haversineMi } from './listings-sort';

/** Velocidad promedio peatonal (km/h). Usada para ETA local sin fetch. */
const WALK_KMH = 5;
const MI_TO_KM = 1.60934;

export interface WalkingEta {
  minutes: number;
  distanceMi: number;
}

/**
 * ETA peatonal local basado en Haversine /5 km/h. No consulta la API de
 * Directions; es la aproximación pedida en el brainstorming del módulo Map.
 */
export function walkingEta(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): WalkingEta {
  const distanceMi = haversineMi(from, to);
  const distanceKm = distanceMi * MI_TO_KM;
  const minutes = Math.max(1, Math.round((distanceKm / WALK_KMH) * 60));
  return { minutes, distanceMi };
}

/** "7.5" para 7.5 mi o "< 0.1" si es muy cercano. */
export function formatMiAway(mi: number): string {
  if (mi < 0.1) return '< 0.1';
  if (mi < 10) return mi.toFixed(1);
  return String(Math.round(mi));
}
