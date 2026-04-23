'use client';

import Link from 'next/link';
import { useState } from 'react';

import { formatDayLabel, formatTime12 } from '@/lib/events-date';
import type { TicketableEvent } from '@/lib/tickets';

/**
 * Card horizontal de un ticket (event con `.ticket`):
 *
 *   [ THURSDAY ]   [ image 280×178 con BADGE $ ][ dark panel con title + time·venue ]
 *   [   10     ]
 *
 * Badge: pill blanco con texto primary en esquina top-right del cover — visible
 * sin necesidad de leer metadatos. Mismo layout que `EventCard` + el badge.
 */
export function TicketCard({
  event,
  moduleKey,
  showGutter = true,
}: {
  event: TicketableEvent;
  moduleKey: string;
  showGutter?: boolean;
}) {
  const { weekdayLong, dayNumber } = formatDayLabel(event.date);
  const timeLabel = `${formatTime12(event.startTime)} · ${event.venue}`;

  return (
    <Link
      href={`/home/${moduleKey}/${event.slug}`}
      aria-label={`${event.title} — ${event.ticket.priceDisplay}`}
      className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
    >
      <div
        className="flex items-stretch"
        style={{ width: '880px', columnGap: '20px', marginBottom: '22px' }}
      >
        {showGutter ? (
          <div
            className="flex flex-col items-center justify-center font-sans"
            style={{ width: '84px', flexShrink: 0, color: '#2c2c2c' }}
          >
            <span
              style={{
                fontSize: '18px',
                lineHeight: '22px',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              {weekdayLong}
            </span>
            <span
              style={{
                fontSize: '60px',
                lineHeight: '64px',
                fontWeight: 700,
                fontFamily: 'Helvetica, Arial, sans-serif',
                color: '#1a1a1a',
              }}
            >
              {dayNumber}
            </span>
          </div>
        ) : null}

        <div
          className="relative flex items-stretch overflow-hidden"
          style={{
            flex: 1,
            height: '158px',
            borderRadius: '8px',
            backgroundColor: '#3b3b3b',
            boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <TicketImage src={event.image} alt={event.title} />
            <div
              className="font-display font-bold"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                paddingLeft: '14px',
                paddingRight: '14px',
                paddingTop: '6px',
                paddingBottom: '6px',
                borderRadius: '999px',
                backgroundColor: '#ffffff',
                color: '#004f8b',
                fontSize: '15px',
                letterSpacing: '0.02em',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              }}
            >
              {event.ticket.priceDisplay}
            </div>
          </div>
          <div
            className="flex flex-col justify-center"
            style={{ flex: 1, padding: '0 28px', color: '#ffffff', rowGap: '10px' }}
          >
            <span
              style={{
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: '22px',
                lineHeight: '28px',
                fontWeight: 700,
                letterSpacing: '0.01em',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {event.title}
            </span>
            <span
              style={{
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: '16px',
                lineHeight: '16px',
                color: 'rgba(255,255,255,0.82)',
                letterSpacing: '0.02em',
              }}
            >
              {timeLabel}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TicketImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        aria-hidden
        style={{
          width: '280px',
          height: '178px',
          flexShrink: 0,
          background: 'linear-gradient(135deg, #004f8b 0%, #1796d6 100%)',
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{ width: '280px', height: '178px', flexShrink: 0, objectFit: 'cover' }}
    />
  );
}
