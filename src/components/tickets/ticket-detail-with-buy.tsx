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
  /** Features del event para renderizar pills en el bloque de info extra. */
  features: readonly string[];
  /** Categoría del event (ej. "Music", "Sports") — visible en el bloque info. */
  category: string;
  /** Duración formateada (ej. "3h", "1h 30min") — calculada en el server. */
  durationLabel: string;
  /** Texto de precio visible como chip destacado en el bloque info. */
  priceDisplay: string;
  textos: Record<string, string>;
  mapboxToken?: string;
  clientCoords?: { lat: number; lng: number };
}

/**
 * Wrapper client del `ListingDetail` para un ticket. Añade al detail:
 * - CTA `BUY TICKET` azul disparando `CustomEvent('kiosk:ticket-purchase-open')`.
 * - Bloque "EVENT INFO" en el slot `extraDetails` con duración + categoría +
 *   features como pills horizontales, justo antes de DESCRIPTION.
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
      extraDetails={
        <TicketExtraInfo
          durationLabel={durationLabel}
          category={category}
          features={features}
          priceDisplay={priceDisplay}
        />
      }
    />
  );
}

function TicketExtraInfo({
  durationLabel,
  category,
  features,
  priceDisplay,
}: {
  durationLabel: string;
  category: string;
  features: readonly string[];
  priceDisplay: string;
}) {
  // Combinamos metas clave en una franja de 2 niveles:
  // Linea 1: label destacado "EVENT INFO" + chip de precio prominente.
  // Linea 2: duration · category + pills horizontal con features.
  return (
    <div className="flex flex-col" style={{ rowGap: '12px' }}>
      <div className="flex items-center" style={{ columnGap: '12px' }}>
        <span
          style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 700,
            fontSize: '18px',
            lineHeight: '18px',
            color: '#444',
            opacity: 0.85,
            letterSpacing: '0.08em',
          }}
        >
          EVENT INFO
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: '28px',
            paddingLeft: '14px',
            paddingRight: '14px',
            borderRadius: '999px',
            background:
              'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.78) 100%)',
            color: '#ffffff',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '0.04em',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          {priceDisplay}
        </span>
      </div>
      <div className="flex flex-wrap items-center" style={{ columnGap: '8px', rowGap: '8px' }}>
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
        height: '30px',
        paddingLeft: '12px',
        paddingRight: '12px',
        borderRadius: '6px',
        border: accent ? '1.5px solid hsl(var(--primary))' : '1px solid #d0d0d0',
        backgroundColor: accent ? 'hsl(var(--primary) / 0.08)' : '#f4f4f4',
        color: accent ? 'hsl(var(--primary))' : '#555',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '13px',
        fontWeight: accent ? 700 : 600,
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </span>
  );
}
