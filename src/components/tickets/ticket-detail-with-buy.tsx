'use client';

import { ListingDetail } from '@/components/listings/listing-detail';
import type { EventMeta } from '@/components/listings/listing-detail';
import type { Listing } from '@/lib/config';

interface Props {
  moduleKey: string;
  listing: Listing;
  eventMeta: EventMeta;
  features: readonly string[];
  category: string;
  durationLabel: string;
  priceDisplay: string;
  textos: Record<string, string>;
  mapboxToken?: string;
  clientCoords?: { lat: number; lng: number };
}

/**
 * Wrapper client del `ListingDetail` para un ticket. Añade:
 * - CTA `BUY TICKET` full-width sticky al bottom del card, con precio en el chip interno.
 * - Bloque "EVENT INFO" al final del card (debajo de DESCRIPTION) con duration + category + features pills (tamaño legible).
 */
export function TicketDetailWithBuy({
  moduleKey,
  listing,
  eventMeta,
  features,
  category,
  durationLabel,
  priceDisplay,
  textos,
  mapboxToken,
  clientCoords,
}: Props) {
  return (
    <ListingDetail
      moduleKey={moduleKey}
      listing={listing}
      mapboxToken={mapboxToken}
      clientCoords={clientCoords}
      eventMeta={eventMeta}
      eventMetaOnHero
      favoritesKind="event"
      secondaryCta={{
        label: `${textos.tickets_buy_cta ?? 'BUY TICKET'}  ${priceDisplay}`,
        onClick: () => window.dispatchEvent(new CustomEvent('kiosk:ticket-purchase-open')),
        color: 'olive',
      }}
      extraDetails={
        <TicketExtraInfo durationLabel={durationLabel} category={category} features={features} />
      }
    />
  );
}

function TicketExtraInfo({
  durationLabel,
  category,
  features,
}: {
  durationLabel: string;
  category: string;
  features: readonly string[];
}) {
  return (
    <div className="flex flex-col" style={{ rowGap: '14px' }}>
      <span
        style={{
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 700,
          fontSize: '22px',
          lineHeight: '22px',
          color: '#444',
          opacity: 0.85,
          letterSpacing: '0.06em',
        }}
      >
        EVENT INFO
      </span>
      <div className="flex flex-wrap items-center" style={{ columnGap: '10px', rowGap: '10px' }}>
        <InfoPill label={durationLabel} accent />
        <InfoPill label={category} accent />
        {features.map((f) => (
          <InfoPill key={f} label={f} />
        ))}
      </div>
    </div>
  );
}

function InfoPill({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '40px',
        paddingLeft: '16px',
        paddingRight: '16px',
        borderRadius: '8px',
        border: accent ? '1.5px solid hsl(var(--primary))' : '1px solid #d0d0d0',
        backgroundColor: accent ? 'hsl(var(--primary) / 0.08)' : '#f4f4f4',
        color: accent ? 'hsl(var(--primary))' : '#555',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '16px',
        fontWeight: accent ? 700 : 600,
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </span>
  );
}
