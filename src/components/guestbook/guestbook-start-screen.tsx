'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import { FloatingHomeButton } from '@/components/listings/floating-home-button';

/**
 * Pantalla 0 del Guestbook: hero (ballerinas) arriba, título + subtítulo
 * centrado, botón START, y el globo crop visible en la parte inferior.
 *
 * Layout verbatim del SVG `0-Guestbook-Start.svg`:
 *   - y=0..620: HomeHeader con heroImage (pasado por el padre).
 *   - y=620..~1250: bloque blanco con título + subtítulo + START.
 *   - y=1250+: globe crop (renderizado por el padre `GuestbookModule`).
 */
export function GuestbookStartScreen({
  header,
  title,
  subtitle,
  ctaLabel,
  onStart,
}: {
  header: ReactNode;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onStart: () => void;
}) {
  const [tapped, setTapped] = useState(false);

  return (
    <div className="relative flex h-full w-full flex-col">
      {header}

      {/* Content card: bg blanco SOLO en el bloque de texto + CTA.
          Debajo queda transparente para que el globo del padre se vea. */}
      <div
        className="flex flex-col items-center"
        style={{
          paddingTop: '96px',
          paddingLeft: '60px',
          paddingRight: '60px',
          paddingBottom: '60px',
          rowGap: '20px',
          backgroundColor: '#f8f8f8',
        }}
      >
        <h1
          className="text-center font-sans"
          style={{
            fontSize: '46px',
            lineHeight: '50px',
            fontWeight: 700,
            color: '#004f8b',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h1>
        <p
          className="text-center font-sans"
          style={{
            fontSize: '22px',
            lineHeight: '32px',
            color: '#4a4a4a',
            maxWidth: '820px',
          }}
        >
          {subtitle}
        </p>
        <button
          type="button"
          onClick={() => {
            if (tapped) return;
            setTapped(true);
            onStart();
          }}
          className="font-sans text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          style={{
            marginTop: '18px',
            width: '320px',
            height: '72px',
            borderRadius: '8px',
            backgroundColor: '#1796d6',
            fontSize: '24px',
            lineHeight: '24px',
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          {ctaLabel}
        </button>
      </div>

      <FloatingHomeButton />
    </div>
  );
}
