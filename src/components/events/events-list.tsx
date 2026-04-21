'use client';

import type { EventItem } from '@/lib/config';

import { EventCard } from './event-card';

/**
 * Lista vertical de eventos del día seleccionado (v1).
 *
 * La agrupación por semana (con headers "February 6 – 12, 2024") + columna
 * "Thursday 27" a la izquierda se activa cuando `selectedDate === null`
 * (v2, ver plan Fase 3.4 §9).
 */
export function EventsList({
  events,
  moduleKey,
  emptyLabel = 'No events scheduled for this day.',
}: {
  events: readonly EventItem[];
  moduleKey: string;
  emptyLabel?: string;
}) {
  if (events.length === 0) {
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
      {events.map((event) => (
        <EventCard key={event.slug} event={event} moduleKey={moduleKey} />
      ))}
    </div>
  );
}
