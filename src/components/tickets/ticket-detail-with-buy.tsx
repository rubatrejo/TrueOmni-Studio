'use client';

import { ListingDetail } from '@/components/listings/listing-detail';
import type { EventMeta, SecondaryCta } from '@/components/listings/listing-detail';
import type { Listing } from '@/lib/config';

interface Props {
  moduleKey: string;
  /** Listing adaptado desde el event (usa `eventToListing` del server). */
  listing: Listing;
  /** Meta del event para la fila fecha/hora. */
  eventMeta: EventMeta;
  textos: Record<string, string>;
  mapboxToken?: string;
  clientCoords?: { lat: number; lng: number };
}

/**
 * Wrapper client del `ListingDetail` para un ticket. Monta el detail
 * con `favoritesKind="event"` (bucket compartido) y un `secondaryCta`
 * "BUY TICKET" que dispara el `CustomEvent('kiosk:ticket-purchase-open')`.
 * El `QrPurchaseHost` montado sibling en la ruta escucha ese evento y abre
 * el modal con el QR.
 */
export function TicketDetailWithBuy({
  moduleKey,
  listing,
  eventMeta,
  textos,
  mapboxToken,
  clientCoords,
}: Props) {
  const secondaryCta: SecondaryCta = {
    label: textos.tickets_buy_cta ?? 'BUY TICKET',
    onClick: () => window.dispatchEvent(new CustomEvent('kiosk:ticket-purchase-open')),
    color: 'blue',
  };

  return (
    <ListingDetail
      moduleKey={moduleKey}
      listing={listing}
      mapboxToken={mapboxToken}
      clientCoords={clientCoords}
      eventMeta={eventMeta}
      secondaryCta={secondaryCta}
      favoritesKind="event"
    />
  );
}
