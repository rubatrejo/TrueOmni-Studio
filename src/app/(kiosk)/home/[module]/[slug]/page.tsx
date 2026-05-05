import { notFound } from 'next/navigation';

import { AdsSlot } from '@/components/ads/ads-slot';
import { BrochureReader } from '@/components/digital-brochure/brochure-reader';
import { EventsModule } from '@/components/events/events-module';
import { HomeHeader } from '@/components/home/header';
import { KioskCanvas } from '@/components/kiosk-canvas';
import { DynamicListingDetailPlaceholder } from '@/components/listings/dynamic-listing-detail-placeholder';
import { ListingDetail } from '@/components/listings/listing-detail';
import type { EventMeta } from '@/components/listings/listing-detail';
import { ListingsModule } from '@/components/listings/listings-module';
import { PassDetailWithShare } from '@/components/passes/pass-detail-with-share';
import { PassQrHost } from '@/components/passes/pass-qr-host';
import { PassesModule } from '@/components/passes/passes-module';
import { QrPurchaseHost } from '@/components/shared/qr-purchase-host';
import { TicketDetailWithBuy } from '@/components/tickets/ticket-detail-with-buy';
import { TicketsModule } from '@/components/tickets/tickets-module';
import { TrailDetail } from '@/components/trails/trail-detail';
import { TrailsModule } from '@/components/trails/trails-module';
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
  if (!mod) {
    // Listing module dinámico (Studio creado, sin publish todavía). El
    // placeholder client-side espera al bridge para hidratar el detail.
    const ads = getAdsFromConfig(config);
    return (
      <KioskCanvas>
        <DynamicListingDetailPlaceholder
          moduleKey={module}
          slug={slug}
          mapboxToken={config.integraciones?.mapbox_token}
          clientCoords={config.client.coords}
        />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }

  const mapboxToken = config.integraciones?.mapbox_token;
  const ads = getAdsFromConfig(config);

  // Deals no tiene detail fullscreen — la interacción es listing → modal redeem.
  if (mod.kind === 'deals') notFound();

  // Guestbook es un flujo completo sin detail por slug.
  if (mod.kind === 'guestbook') notFound();

  if (mod.kind === 'trails') {
    const trail = mod.trails.find((t) => t.slug === slug);
    if (!trail) notFound();
    return (
      <KioskCanvas>
        <TrailsModule
          moduleKey={module}
          module={mod}
          clientCoords={config.client.coords}
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        <TrailDetail
          moduleKey={module}
          trail={trail}
          mapboxToken={mapboxToken}
          clientCoords={config.client.coords}
        />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }

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
    const textos = config.textos ?? {};
    const hasTicket = event.ticket != null;

    return (
      <KioskCanvas>
        <EventsModule
          moduleKey={module}
          module={mod}
          clientCoords={config.client.coords}
          clientTimezone={config.client.timezone}
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        {hasTicket && event.ticket ? (
          <TicketDetailWithBuy
            moduleKey={module}
            listing={listing}
            eventMeta={eventMeta}
            features={event.features}
            category={event.category}
            durationLabel={formatDuration(event.startTime, event.endTime)}
            priceDisplay={event.ticket.priceDisplay}
            mapboxToken={mapboxToken}
            clientCoords={config.client.coords}
          />
        ) : (
          <ListingDetail
            moduleKey={module}
            listing={listing}
            mapboxToken={mapboxToken}
            clientCoords={config.client.coords}
            eventMeta={eventMeta}
            secondaryCta={
              event.ticketsUrl
                ? {
                    label: 'GET TICKETS',
                    labelKey: 'events_get_tickets',
                    href: event.ticketsUrl,
                    color: 'blue',
                  }
                : undefined
            }
            favoritesKind="event"
          />
        )}
        {hasTicket && event.ticket ? (
          <QrPurchaseHost
            eventName="kiosk:ticket-purchase-open"
            title={event.title.toUpperCase()}
            purchaseUrl={event.ticket.purchaseUrl}
            priceDisplay={event.ticket.priceDisplay}
            submitLabel={textos.tickets_buy_cta ?? 'BUY TICKET'}
            submitFullWidth
            textos={{
              qr_instruction:
                textos.tickets_share_instruction ?? 'SCAN QR OR GET SMS TO BUY YOUR TICKET',
              qr_phone_label: textos.tickets_share_phone_label ?? 'Enter your phone number',
              qr_country: textos.tickets_share_country ?? 'USA (+1)',
              qr_phone_placeholder: textos.tickets_share_phone_placeholder ?? '000-555-0115',
              qr_phone_aria:
                textos.tickets_share_phone_aria ?? 'Phone number. Tap to edit via keypad.',
              qr_terms: textos.tickets_share_terms ?? 'I accept details',
              qr_send: textos.tickets_share_send ?? 'SEND',
            }}
            sentTitle={textos.tickets_sent_title ?? 'Link sent!'}
            sentMessage={
              textos.tickets_sent_message ?? 'Check your phone to complete the purchase.'
            }
          />
        ) : null}
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
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        <PassDetailWithShare moduleKey={module} pass={pass} />
        <PassQrHost clientSlug={config.client.slug} pass={pass} qrLogo={mod.qrLogo} />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }

  if (mod.kind === 'tickets') {
    const eventsModule = config.features?.home?.modules?.events;
    const allEvents = eventsModule && eventsModule.kind === 'events' ? eventsModule.events : [];
    const event = allEvents.find((e) => e.slug === slug && e.ticket != null);
    if (!event || !event.ticket) notFound();

    const listing = eventToListing(event);
    const eventMeta: EventMeta = {
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      dateLabel: formatEventDateLong(event.date),
      timeLabel: formatTimeRange(event.startTime, event.endTime),
    };
    const textos = config.textos ?? {};

    return (
      <KioskCanvas>
        <TicketsModule
          moduleKey={module}
          module={mod}
          allEvents={allEvents}
          clientCoords={config.client.coords}
          clientTimezone={config.client.timezone}
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        <TicketDetailWithBuy
          moduleKey={module}
          listing={listing}
          eventMeta={eventMeta}
          features={event.features}
          category={event.category}
          durationLabel={formatDuration(event.startTime, event.endTime)}
          priceDisplay={event.ticket.priceDisplay}
          mapboxToken={mapboxToken}
          clientCoords={config.client.coords}
        />
        <QrPurchaseHost
          eventName="kiosk:ticket-purchase-open"
          title={event.title.toUpperCase()}
          purchaseUrl={event.ticket.purchaseUrl}
          priceDisplay={event.ticket.priceDisplay}
          submitLabel={textos.tickets_buy_cta ?? 'BUY TICKET'}
          submitFullWidth
          textos={{
            qr_instruction:
              textos.tickets_share_instruction ?? 'SCAN QR OR GET SMS TO BUY YOUR TICKET',
            qr_phone_label: textos.tickets_share_phone_label ?? 'Enter your phone number',
            qr_country: textos.tickets_share_country ?? 'USA (+1)',
            qr_phone_placeholder: textos.tickets_share_phone_placeholder ?? '000-555-0115',
            qr_phone_aria:
              textos.tickets_share_phone_aria ?? 'Phone number. Tap to edit via keypad.',
            qr_terms: textos.tickets_share_terms ?? 'I accept details',
            qr_send: textos.tickets_share_send ?? 'SEND',
          }}
          sentTitle={textos.tickets_sent_title ?? 'Link sent!'}
          sentMessage={textos.tickets_sent_message ?? 'Check your phone to complete the purchase.'}
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

/** Formatea "HH:MM"–"HH:MM" a duration label tipo "3h" o "1h 30min". */
function formatDuration(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let totalMin = eh * 60 + em - (sh * 60 + sm);
  if (totalMin < 0) totalMin += 24 * 60; // cruza medianoche
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}
