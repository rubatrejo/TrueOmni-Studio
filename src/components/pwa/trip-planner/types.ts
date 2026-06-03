import type { ItineraryStopKind } from '@/lib/config';

/** Card normalizada para la vista LIST del Trip Planner PWA. */
export interface TpCard {
  slug: string;
  kind: ItineraryStopKind;
  moduleSlug: string;
  title: string;
  subcategory: string;
  image: string;
  coords: { lat: number; lng: number };
  address: string;
  distanceMi: number;
  /** Línea de horario, ej. "Open until 11:00 pm" (derivado de hours). */
  openUntil: string;
  /** Solo events: ISO `YYYY-MM-DD` para el week-strip. */
  date?: string;
}

/** Categoría del menú desplegable (Things to Do / Restaurants / Events). */
export interface TpCategory {
  key: string;
  label: string;
  items: TpCard[];
}

/** Itinerario pre-armado (tab Local Listings). */
export interface TpLocalListing {
  slug: string;
  title: string;
  /** Hasta 3 covers para el collage. */
  images: string[];
  stopCount: number;
  /** Distancia del primer stop (para la card, estilo del diseño). */
  distanceMi: number;
  /** "Open until …" del primer stop. */
  openUntil: string;
  /** Stops que se añaden al plan al usar este itinerario. */
  stops: { slug: string; kind: ItineraryStopKind }[];
}
