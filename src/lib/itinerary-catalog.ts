import type {
  EventItem,
  HomeModuleVariant,
  ItineraryStopKind,
  KioskConfig,
  Listing,
  Trail,
} from './config';
import { isEventsModule, isListingsModule, isTrailsModule } from './itinerary-tabs';

/**
 * Item normalizado del catálogo del Itinerary Builder. Sirve para renderizar
 * tanto las cards de la columna izquierda como los pins del mapa.
 *
 * Une Listings + Events + Trails en una shape común. Para datos específicos
 * (`hours`, `date`, `priceMode`) se usa la propiedad opcional correspondiente.
 */
export interface ItineraryCatalogItem {
  /** Discriminador del bucket de favoritos. */
  kind: ItineraryStopKind;
  /** Slug del módulo origen (`restaurants`, `events`, `trails`, ...). */
  moduleSlug: string;
  /** Slug del item dentro del módulo. */
  slug: string;
  title: string;
  subcategory: string;
  image: string;
  coords: { lat: number; lng: number };
  address: string;
  /** 0-100 — usado para sort por defecto. */
  popularity: number;
  features: string[];
  /** Solo listings: hours human-readable. */
  hours?: string;
  /** Solo events: ISO `YYYY-MM-DD`. */
  date?: string;
  /** Solo events: 'HH:MM' 24h. */
  startTime?: string;
  /** Solo events: 'HH:MM' 24h. */
  endTime?: string;
  /** Solo events. */
  priceMode?: 'free' | 'paid';
  /** Solo listings/events. */
  priceRange?: 1 | 2 | 3 | 4;
}

const listingToItem = (l: Listing, moduleSlug: string): ItineraryCatalogItem => ({
  kind: 'listing',
  moduleSlug,
  slug: l.slug,
  title: l.title,
  subcategory: l.subcategory,
  image: l.image,
  coords: l.coords,
  address: l.address,
  popularity: l.popularity,
  features: l.features,
  hours: l.hours,
  priceRange: l.priceRange,
});

const eventToItem = (e: EventItem, moduleSlug: string): ItineraryCatalogItem => ({
  kind: 'event',
  moduleSlug,
  slug: e.slug,
  title: e.title,
  subcategory: e.category,
  image: e.image,
  coords: e.coords,
  address: e.address,
  popularity: e.popularity,
  features: e.features,
  date: e.date,
  startTime: e.startTime,
  endTime: e.endTime,
  priceMode: e.priceMode,
  priceRange: e.priceBand,
});

const trailToItem = (t: Trail, moduleSlug: string): ItineraryCatalogItem => ({
  kind: 'trail',
  moduleSlug,
  slug: t.slug,
  title: t.title,
  subcategory: t.subcategory,
  image: t.image,
  coords: t.coords,
  address: t.address,
  popularity: t.popularity,
  features: t.features,
  hours: t.hours,
});

/** Devuelve los items de un módulo concreto. Devuelve [] si el módulo no existe o no es elegible. */
export function getItineraryCatalogForModule(
  config: KioskConfig,
  moduleSlug: string,
): ItineraryCatalogItem[] {
  const mod: HomeModuleVariant | undefined = config.features?.home?.modules?.[moduleSlug];
  if (!mod) return [];
  if (isListingsModule(mod)) return mod.listings.map((l) => listingToItem(l, moduleSlug));
  if (isEventsModule(mod)) return mod.events.map((e) => eventToItem(e, moduleSlug));
  if (isTrailsModule(mod)) return mod.trails.map((t) => trailToItem(t, moduleSlug));
  return [];
}

/** Devuelve TODOS los items elegibles (todos los módulos excluyendo stay). Útil para el mapa. */
export function getItineraryCatalogAll(config: KioskConfig): ItineraryCatalogItem[] {
  const out: ItineraryCatalogItem[] = [];
  const modules = config.features?.home?.modules ?? {};
  for (const [slug, mod] of Object.entries(modules)) {
    if (slug === 'stay') continue;
    if (isListingsModule(mod)) {
      out.push(...mod.listings.map((l) => listingToItem(l, slug)));
    } else if (isEventsModule(mod)) {
      out.push(...mod.events.map((e) => eventToItem(e, slug)));
    } else if (isTrailsModule(mod)) {
      out.push(...mod.trails.map((t) => trailToItem(t, slug)));
    }
  }
  return out;
}

/** Filtra por substring case-insensitive en title/subcategory/address. */
export function filterCatalogBySearch(
  items: ItineraryCatalogItem[],
  query: string,
): ItineraryCatalogItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (i) =>
      i.title.toLowerCase().includes(q) ||
      i.subcategory.toLowerCase().includes(q) ||
      i.address.toLowerCase().includes(q),
  );
}

/** Distancia en millas entre dos coords (Haversine). */
export function distanceMi(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 3958.8; // millas
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
