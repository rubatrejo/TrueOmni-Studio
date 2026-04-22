import { notFound } from 'next/navigation';

import { AdsSlot } from '@/components/ads/ads-slot';
import { BrochureReader } from '@/components/digital-brochure/brochure-reader';
import { EventsModule } from '@/components/events/events-module';
import { HomeHeader } from '@/components/home/header';
import { KioskCanvas } from '@/components/kiosk-canvas';
import { ListingDetail } from '@/components/listings/listing-detail';
import type { EventMeta, SecondaryCta } from '@/components/listings/listing-detail';
import { ListingsModule } from '@/components/listings/listings-module';
import { PassDetailWithShare } from '@/components/passes/pass-detail-with-share';
import { PassShareHost } from '@/components/passes/pass-share-host';
import { PassesModule } from '@/components/passes/passes-module';
import { getAdsFromConfig } from '@/lib/ads';
import type { EventItem, Listing } from '@/lib/config';
import { getConfig } from '@/lib/config';
import { formatEventDateLong, formatTimeRange } from '@/lib/events-date';

interface PageProps {
  params: Promise<{ module: string; slug: string }>;
}

/**
 * Detail screen de un listing o un evento.
 *
 * Render: el grid/lista del módulo como background + el card de detail encima
 * con overlay oscuro. La ruta discrimina por `mod.kind`.
 */
export default async function DetailPage({ params }: PageProps) {
  const { module, slug } = await params;
  const config = await getConfig();
  const mod = config.features?.home?.modules?.[module];
  if (!mod) notFound();

  const mapboxToken = config.integraciones?.mapbox_token;
  const ads = getAdsFromConfig(config);

  if (mod.kind === 'events') {
    const event = mod.events.find((e) => e.slug === slug);
    if (!event) notFound();

    const listing = eventToListing(event);
    const eventMeta: EventMeta = {
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      dateLabel: formatEventDateLong(event.date),
      timeLabel: formatTimeRange(event.startTime, event.endTime),
    };
    const secondaryCta: SecondaryCta | undefined = event.ticketsUrl
      ? { label: 'GET TICKETS', href: event.ticketsUrl, color: 'blue' }
      : undefined;

    return (
      <KioskCanvas>
        <EventsModule
          moduleKey={module}
          module={mod}
          clientCoords={config.client.coords}
          clientTimezone={config.client.timezone}
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        <ListingDetail
          moduleKey={module}
          listing={listing}
          mapboxToken={mapboxToken}
          clientCoords={config.client.coords}
          eventMeta={eventMeta}
          secondaryCta={secondaryCta}
          favoritesKind="event"
        />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }

  // Social Wall no tiene ruta [slug] — los posts se abren como modal dentro
  // del módulo. Cualquier /home/social-wall/* es 404.
  if (mod.kind === 'social-wall') notFound();

  // Map no tiene ruta [slug] propia; cualquier detail navega a su módulo origen.
  if (mod.kind === 'map') notFound();

  // Digital Brochure — reader fullscreen
  if (mod.kind === 'digital-brochure') {
    const brochure = mod.brochures.find((b) => b.slug === slug);
    if (!brochure) notFound();
    return (
      <KioskCanvas>
        <BrochureReader brochure={brochure} moduleKey={module} />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }

  if (mod.kind === 'passes') {
    const pass = mod.passes.find((p) => p.slug === slug);
    if (!pass) notFound();
    return (
      <KioskCanvas>
        <PassesModule
          moduleKey={module}
          module={mod}
          textos={config.textos ?? {}}
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        <PassDetailWithShare moduleKey={module} pass={pass} textos={config.textos ?? {}} />
        <PassShareHost
          client={{ slug: config.client.slug }}
          pass={pass}
          textos={config.textos ?? {}}
        />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }

  // Listings
  const listing = mod.listings.find((l) => l.slug === slug);
  if (!listing) notFound();

  return (
    <KioskCanvas>
      <ListingsModule
        moduleKey={module}
        module={mod}
        clientCoords={config.client.coords}
        header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
      />
      <ListingDetail
        moduleKey={module}
        listing={listing}
        mapboxToken={mapboxToken}
        clientCoords={config.client.coords}
      />
      <AdsSlot ads={ads} />
    </KioskCanvas>
  );
}

/**
 * Adapta un `EventItem` al shape que consume `ListingDetail` (que fue tipado
 * para Listings). Los campos no aplicables (priceRange, subcategory, etc.)
 * se rellenan con valores neutros.
 *
 * `eventMeta` y `secondaryCta` se pasan por separado como props del detail.
 */
function eventToListing(event: EventItem): Listing {
  return {
    slug: event.slug,
    title: event.title,
    subcategory: event.category,
    image: event.image,
    hours: '', // reemplazado por eventMeta
    priceRange: event.priceBand ?? 1,
    features: event.features,
    popularity: event.popularity,
    address: event.address,
    phone: event.phone,
    coords: event.coords,
    website: event.website,
    description: event.description,
    directions: event.directions,
  };
}
