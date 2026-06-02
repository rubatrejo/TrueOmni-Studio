import type { Listing, Trail, TrailDifficulty, TrailType } from './config';

/** Estado del filter overlay del módulo Trails. */
export interface TrailFilterState {
  /** Features AND — todas las seleccionadas deben estar presentes. */
  features: string[];
  /** Difficulties OR — cualquiera de las seleccionadas. */
  difficulties: TrailDifficulty[];
  /** Trail types OR — cualquiera de los seleccionados. */
  trailTypes: TrailType[];
}

export const EMPTY_TRAILS_FILTER: TrailFilterState = {
  features: [],
  difficulties: [],
  trailTypes: [],
};

/** Aplica el filter al pool de trails. Difficulty y TrailType son OR; features AND. */
export function applyTrailsFilter(trails: readonly Trail[], filter: TrailFilterState): Trail[] {
  return trails.filter((t) => {
    if (filter.features.length > 0 && !filter.features.every((f) => t.features.includes(f))) {
      return false;
    }
    if (
      filter.difficulties.length > 0 &&
      !filter.difficulties.includes(t.considerations.difficulty)
    ) {
      return false;
    }
    if (filter.trailTypes.length > 0) {
      const type = t.considerations.trailType;
      if (type == null || !filter.trailTypes.includes(type)) return false;
    }
    return true;
  });
}

/** Búsqueda case-insensitive sobre title + subcategory + description. */
export function searchTrails(trails: readonly Trail[], query: string): Trail[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [...trails];
  return trails.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.subcategory.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q),
  );
}

/**
 * Adapta un `Trail` al shape `Listing` que consumen `ListingCard` y `ListingDetail`.
 * Los campos no aplicables (priceRange, reserveUrl, threshold360Url) se rellenan
 * con valores neutros. El detail overrideará las secciones específicas (map +
 * considerations) vía los slots `mapSlot` y `extraDetails`.
 */
export function trailToListing(trail: Trail): Listing {
  return {
    slug: trail.slug,
    title: trail.title,
    subcategory: trail.subcategory,
    image: trail.image,
    hours: trail.hours,
    priceRange: 1,
    features: trail.features,
    popularity: trail.popularity,
    address: trail.address,
    phone: trail.phone,
    coords: trail.coords,
    website: trail.website,
    description: trail.description,
    directions: trail.directions,
  };
}

/**
 * Variante del adapter para la PWA: igual que `trailToListing` pero pobla
 * `difficulty` y `trailType` para que el overlay de filtros de la PWA
 * (`applyFilters`) pueda filtrar por las secciones Difficulty / Trail Type.
 * `slug` es overrideable para el mapa agregado (uid `source__slug`).
 */
export function trailToPwaListing(trail: Trail, slug: string = trail.slug): Listing {
  return {
    ...trailToListing(trail),
    slug,
    difficulty: trail.considerations.difficulty,
    trailType: trail.considerations.trailType,
  };
}
