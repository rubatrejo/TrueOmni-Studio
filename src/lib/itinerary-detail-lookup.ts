import type { EventMeta, SecondaryCta } from '@/components/listings/listing-detail';

import type { EventItem, KioskConfig, Listing, Trail } from './config';
import { formatEventDateLong, formatTimeRange } from './events-date';
import { isEventsModule, isListingsModule, isTrailsModule } from './itinerary-tabs';

/**
 * Lookup `{kind}:{slug}` → `MapDetailEntry`-like, para que el Itinerary
 * Builder pueda renderizar `ListingDetail` in-place al hacer SEE MORE INFO
 * sobre el bubble del mapa. Reusa el patrón de `buildMapDetailLookup` pero
 * incluye trails (catálogo del módulo Trails) además de listings y events.
 */
export interface ItineraryDetailEntry {
  moduleKey: string;
  listing: Listing;
  eventMeta?: EventMeta;
  secondaryCta?: SecondaryCta;
  favoritesKind: 'listing' | 'event';
}

export type ItineraryDetailLookup = Record<string, ItineraryDetailEntry>;

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

function trailToListing(t: Trail): Listing {
  return {
    slug: t.slug,
    title: t.title,
    subcategory: t.subcategory,
    image: t.image,
    hours: t.hours,
    priceRange: 1,
    features: t.features,
    popularity: t.popularity,
    address: t.address,
    phone: t.phone,
    coords: t.coords,
    website: t.website,
    description: t.description,
    directions: t.directions,
  };
}

export function buildItineraryDetailLookup(config: KioskConfig): ItineraryDetailLookup {
  const modules = config.features?.home?.modules ?? {};
  const out: ItineraryDetailLookup = {};

  for (const [moduleSlug, mod] of Object.entries(modules)) {
    if (isListingsModule(mod)) {
      for (const l of mod.listings) {
        out[`listing:${l.slug}`] = {
          moduleKey: moduleSlug,
          listing: l,
          favoritesKind: 'listing',
        };
      }
    } else if (isEventsModule(mod)) {
      for (const ev of mod.events) {
        out[`event:${ev.slug}`] = {
          moduleKey: moduleSlug,
          listing: eventToListing(ev),
          favoritesKind: 'event',
          eventMeta: {
            date: ev.date,
            startTime: ev.startTime,
            endTime: ev.endTime,
            dateLabel: formatEventDateLong(ev.date),
            timeLabel: formatTimeRange(ev.startTime, ev.endTime),
          },
          secondaryCta: ev.ticketsUrl
            ? { label: 'GET TICKETS', href: ev.ticketsUrl, color: 'blue' }
            : undefined,
        };
      }
    } else if (isTrailsModule(mod)) {
      for (const t of mod.trails) {
        out[`trail:${t.slug}`] = {
          moduleKey: moduleSlug,
          listing: trailToListing(t),
          favoritesKind: 'listing',
        };
      }
    }
  }

  return out;
}
