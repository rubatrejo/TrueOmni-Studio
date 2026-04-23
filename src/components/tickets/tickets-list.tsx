'use client';

import type { TicketableEvent } from '@/lib/tickets';

import { TicketCard } from './ticket-card';

/**
 * Lista vertical de tickets del día seleccionado. Mismo layout que `EventsList`
 * (paddings idénticos) pero tipando el pool como `TicketableEvent[]` para que
 * el card pueda acceder al `ticket.priceDisplay` sin narrowing.
 */
export function TicketsList({
  tickets,
  moduleKey,
  emptyLabel = 'No tickets available right now.',
}: {
  tickets: readonly TicketableEvent[];
  moduleKey: string;
  emptyLabel?: string;
}) {
  if (tickets.length === 0) {
    return (
      <div
        className="flex h-full w-full items-start justify-center"
        style={{ padding: '80px 40px 0', color: '#6e6e6e' }}
      >
        <span
          className="font-sans"
          style={{
            fontSize: '22px',
            lineHeight: '28px',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          {emptyLabel}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex w-full flex-col items-start"
      style={{
        paddingTop: '32px',
        paddingBottom: '40px',
        paddingLeft: '140px',
        paddingRight: '60px',
      }}
    >
      {tickets.map((t) => (
        <TicketCard key={t.slug} event={t} moduleKey={moduleKey} />
      ))}
    </div>
  );
}
