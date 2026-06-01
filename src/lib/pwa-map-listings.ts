import type { ListingItem } from '@/components/pwa/listing-row';
import type { KioskConfig, Listing } from '@/lib/config';
import { isListingsModule } from '@/lib/itinerary-tabs';
import { haversineMi } from '@/lib/listings-sort';
import type { MapItem } from '@/lib/map-item';

/** "City, ST" derivado de la dirección (igual que los list pages de listings). */
function cityStateOf(address: string): string {
  const city = address.split(',').slice(-2, -1)[0]?.trim() ?? '';
  const st = address.match(/,\s*([A-Z]{2})\b/)?.[1] ?? '';
  return [city, st].filter(Boolean).join(', ');
}

/** Identificador único de un listing agregado (evita colisión de slugs entre módulos). */
function uid(source: string, slug: string): string {
  return `${source}__${slug}`;
}

/**
 * Agrega los listings de las categorías declaradas en `features.pwa.map.categories`
 * en un único conjunto para el módulo Maps. Reutiliza la data del kiosk
 * (`home.modules.<source>.listings`); no duplica contenido.
 *
 * El `slug` de cada item es un uid (`source__slug`) para que `ListingsMap`/`MapCanvas`
 * no colisionen keys entre categorías; `moduleSlug` + `detailSlug` guardan el módulo
 * y el slug real para construir el href de detalle (`/pwa/map/<module>/<slug>`).
 *
 * También devuelve `listings` (crudos, con `slug` = uid) para que el overlay de
 * filtros reuse `applyFilters`, y `features` (pool agregado) para sus secciones.
 */
export function getPwaMapData(config: KioskConfig): {
  items: ListingItem[];
  mapItems: MapItem[];
  listings: Listing[];
  features: string[];
} {
  const categories = config.features?.pwa?.map?.categories ?? [];
  const modules = config.features?.home?.modules ?? {};
  const origin = config.client?.coords;

  const items: ListingItem[] = [];
  const mapItems: MapItem[] = [];
  const listings: Listing[] = [];
  const featureSet = new Set<string>();

  for (const cat of categories) {
    const mod = modules[cat.source];
    if (!mod || !isListingsModule(mod)) continue;

    for (const l of mod.listings) {
      const id = uid(cat.source, l.slug);
      // Listing crudo con slug = uid para que el Set de `applyFilters` matchee los items.
      listings.push({ ...l, slug: id });
      for (const f of l.features) featureSet.add(f);
      items.push({
        slug: id,
        title: l.title,
        subcategory: l.subcategory,
        image: l.image,
        coords: l.coords,
        distanceMi: origin ? haversineMi(origin, l.coords) : 0,
        cityState: cityStateOf(l.address),
        openUntil: '',
        moduleSlug: cat.source,
        detailSlug: l.slug,
      });
      mapItems.push({
        source: cat.source,
        moduleSlug: cat.source,
        slug: id,
        title: l.title,
        subcategory: l.subcategory,
        image: l.image,
        coords: l.coords,
        address: l.address,
        phone: l.phone,
        features: l.features,
        popularity: l.popularity,
        hours: l.hours,
        priceRange: l.priceRange,
      });
    }
  }

  return { items, mapItems, listings, features: [...featureSet].sort() };
}
