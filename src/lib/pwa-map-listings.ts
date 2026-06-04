import type { ListingItem } from '@/components/pwa/listing-row';
import type { KioskConfig, Listing } from '@/lib/config';
import { todayISO } from '@/lib/events-date';
import { isListingsModule } from '@/lib/itinerary-tabs';
import { haversineMi } from '@/lib/listings-sort';
import { jitterCoords } from '@/lib/map-aggregator';
import type { MapItem } from '@/lib/map-item';
import { eventDateLabel } from '@/lib/map-open-today';
import { trailToPwaListing } from '@/lib/trails';

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
  // Paridad con el kiosk (D3): excluir eventos pasados del mapa.
  const today = todayISO(config.client?.timezone);

  const items: ListingItem[] = [];
  const mapItems: MapItem[] = [];
  const listings: Listing[] = [];
  const featureSet = new Set<string>();

  for (const cat of categories) {
    const mod = modules[cat.source];
    if (!mod) continue;

    // Events: módulo `kind: 'events'` (no listings). Mapea cada EventItem a
    // Listing crudo (para `applyFilters`) + ListingItem + MapItem (pin 'events').
    if (mod.kind === 'events') {
      for (const e of mod.events) {
        if (e.date < today) continue; // no mostrar eventos pasados (paridad kiosk)
        const id = uid(cat.source, e.slug);
        listings.push({
          slug: id,
          title: e.title,
          subcategory: e.category,
          image: e.image,
          hours: '',
          priceRange: e.priceBand ?? 1,
          features: e.features,
          popularity: e.popularity,
          address: e.address,
          phone: e.phone,
          coords: e.coords,
          website: e.website,
          description: e.description,
          directions: e.directions,
        });
        for (const f of e.features) featureSet.add(f);
        items.push({
          slug: id,
          title: e.title,
          subcategory: e.category,
          image: e.image,
          coords: e.coords,
          distanceMi: origin ? haversineMi(origin, e.coords) : 0,
          cityState: cityStateOf(e.address),
          openUntil: '',
          moduleSlug: cat.source,
          detailSlug: e.slug,
        });
        mapItems.push({
          source: 'events',
          moduleSlug: cat.source,
          slug: id,
          title: e.title,
          subcategory: e.category,
          image: e.image,
          coords: jitterCoords(id, 'events', e.coords),
          address: e.address,
          phone: e.phone,
          features: e.features,
          popularity: e.popularity,
          dateLabel: eventDateLabel(e),
          priceMode: e.priceMode,
          priceRange: e.priceBand,
        });
      }
      continue;
    }

    // Trails: módulo `kind: 'trails'` (no listings). Adapta cada Trail a Listing
    // crudo (con difficulty/trailType para `applyFilters`) + ListingItem + MapItem
    // (pin/color/ícono canónico de la source 'trails').
    if (mod.kind === 'trails') {
      for (const tr of mod.trails) {
        const id = uid(cat.source, tr.slug);
        listings.push(trailToPwaListing(tr, id));
        for (const f of tr.features) featureSet.add(f);
        items.push({
          slug: id,
          title: tr.title,
          subcategory: tr.subcategory,
          image: tr.image,
          coords: tr.coords,
          distanceMi: origin ? haversineMi(origin, tr.coords) : 0,
          cityState: cityStateOf(tr.address),
          openUntil: '',
          moduleSlug: cat.source,
          detailSlug: tr.slug,
        });
        mapItems.push({
          source: 'trails',
          moduleSlug: cat.source,
          slug: id,
          title: tr.title,
          subcategory: tr.subcategory,
          image: tr.image,
          coords: jitterCoords(id, 'trails', tr.coords),
          address: tr.address,
          phone: tr.phone,
          features: tr.features,
          popularity: tr.popularity,
          hours: tr.hours,
        });
      }
      continue;
    }

    if (!isListingsModule(mod)) continue;

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
        coords: jitterCoords(id, cat.source, l.coords),
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
