import type { EventMeta, SecondaryCta } from '@/components/listings/listing-detail';

import type { EventItem, HomeMapModule, HomeModuleVariant, KioskConfig, Listing } from './config';
import { formatEventDateLong, formatTimeRange } from './events-date';
import type { MapItem } from './map-item';

/** Entrada pre-computada para renderizar `ListingDetail` in-place desde el mapa. */
export interface MapDetailEntry {
  moduleKey: string;
  listing: Listing;
  eventMeta?: EventMeta;
  secondaryCta?: SecondaryCta;
  favoritesKind: 'listing' | 'event';
}

/** Clave del lookup: `{moduleKey}:{slug}`. */
export type MapDetailLookup = Record<string, MapDetailEntry>;

function eventToListing(ev: EventItem): Listing {
  return {
    slug: ev.slug,
    title: ev.title,
    subcategory: ev.category,
    image: ev.image,
    hours: '',
    priceRange: ev.priceBand ?? 1,
    features: ev.features,
    popularity: ev.popularity,
    address: ev.address,
    phone: ev.phone,
    coords: ev.coords,
    website: ev.website,
    description: ev.description,
    directions: ev.directions,
  };
}

function isListingsModule(
  m: HomeModuleVariant | undefined,
): m is Extract<HomeModuleVariant, { listings: Listing[] }> {
  return !!m && (m.kind === undefined || m.kind === 'listings');
}

function isEventsModule(
  m: HomeModuleVariant | undefined,
): m is Extract<HomeModuleVariant, { kind: 'events' }> {
  return !!m && m.kind === 'events';
}

/**
 * Construye un lookup por `{moduleKey}:{slug}` con todo lo necesario para
 * renderizar el `ListingDetail` in-place (overlay encima del mapa), sin
 * navegar al módulo origen.
 *
 * Sólo incluye entradas para los items del pool actual del Map; no para
 * todo el catálogo del cliente.
 */
export function buildMapDetailLookup(
  config: KioskConfig,
  mod: HomeMapModule,
  items: readonly MapItem[],
): MapDetailLookup {
  void mod; // reservado para futuras overrides por módulo
  const modules = config.features?.home?.modules ?? {};
  const out: MapDetailLookup = {};

  for (const it of items) {
    const m = modules[it.moduleSlug];
    const key = `${it.moduleSlug}:${it.slug}`;

    if (isListingsModule(m)) {
      const listing = m.listings.find((l) => l.slug === it.slug);
      if (!listing) continue;
      out[key] = {
        moduleKey: it.moduleSlug,
        listing,
        favoritesKind: 'listing',
      };
      continue;
    }

    if (isEventsModule(m)) {
      const event = m.events.find((e) => e.slug === it.slug);
      if (!event) continue;
      out[key] = {
        moduleKey: it.moduleSlug,
        listing: eventToListing(event),
        favoritesKind: 'event',
        eventMeta: {
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          dateLabel: formatEventDateLong(event.date),
          timeLabel: formatTimeRange(event.startTime, event.endTime),
        },
        secondaryCta: event.ticketsUrl
          ? { label: 'GET TICKETS', href: event.ticketsUrl, color: 'blue' }
          : undefined,
      };
    }
  }

  return out;
}
