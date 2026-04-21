'use client';

import { useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

import { AccessibilityIcon, EnglishButton } from './billboard-footer-parts';

/**
 * Billboard 2 — "Hero full-bleed + carousel de cards".
 *
 * Layout según ref-b2:
 * - Hero full-bleed sparklers + overlay gradient.
 * - TrueOmni logo blanco centrado arriba.
 * - Carousel 3-up visible: card central grande + peek cards laterales
 *   visiblemente más pequeñas. Click en cualquier lado avanza/retrocede.
 * - "TOUCH TO START" + arrow circle.
 * - Footer: clock + accesibilidad + ENGLISH.
 */

interface CardData {
  key: string;
  image: string;
  label: string;
  labelLine2?: string;
}

const CARDS: readonly CardData[] = [
  { key: 'things-to-do', image: '/assets/billboard-2/things-to-do.jpg', label: 'Things to Do' },
  { key: 'events', image: '/assets/billboard-2/events.jpg', label: 'Events' },
  { key: 'hotels', image: '/assets/billboard-2/hotels.jpg', label: 'Hotels' },
  {
    key: 'itinerary',
    image: '/assets/billboard-2/itinerary.jpg',
    label: 'Itinerary',
    labelLine2: 'Builder',
  },
];

export function Billboard2() {
  const [active, setActive] = useState(0);
  const n = CARDS.length;

  const prev = CARDS[(active - 1 + n) % n]!;
  const current = CARDS[active]!;
  const next = CARDS[(active + 1) % n]!;

  const advance = () => setActive((i) => (i + 1) % n);
  const recede = () => setActive((i) => (i - 1 + n) % n);

  return (
    <div
      data-billboard="2"
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: '#000' }}
    >
      {/* Hero full-bleed */}
      <img
        src="/assets/billboard-2/hero.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* Logo TrueOmni blanco centrado */}
      <div className="absolute flex justify-center" style={{ left: '0', right: '0', top: '120px' }}>
        <TrueOmniLogo className="h-[100px] w-auto text-white" />
      </div>

      {/* Peek izquierda — más chica y en Y más alto (retranqueada) */}
      <button
        type="button"
        onClick={recede}
        aria-label={`Ver ${prev.label}`}
        className="absolute overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
        style={{
          left: '-180px',
          top: '440px',
          width: '280px',
          height: '760px',
          borderRadius: '21px',
          transition: 'transform 300ms ease',
        }}
        key={`prev-${prev.key}`}
      >
        <img src={prev.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      </button>

      {/* Peek derecha — simétrica */}
      <button
        type="button"
        onClick={advance}
        aria-label={`Ver ${next.label}`}
        className="absolute overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
        style={{
          right: '-180px',
          top: '440px',
          width: '280px',
          height: '760px',
          borderRadius: '21px',
          transition: 'transform 300ms ease',
        }}
        key={`next-${next.key}`}
      >
        <img src={next.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      </button>

      {/* Card central — más grande (800×960) — click avanza */}
      <button
        type="button"
        onClick={advance}
        aria-label={`${current.label}: activar`}
        className="absolute overflow-hidden shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        style={{
          left: '140px',
          top: '340px',
          width: '800px',
          height: '960px',
          borderRadius: '24px',
          transition: 'transform 300ms ease',
        }}
        key={`center-${current.key}`}
      >
        <img src={current.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(0,0,0,0.82) 100%)',
          }}
        />
        <span
          className="absolute font-display font-bold uppercase leading-[1.05] text-white"
          style={{
            left: '0',
            right: '0',
            bottom: '56px',
            textAlign: 'center',
            fontSize: '74px',
            letterSpacing: '0.02em',
          }}
        >
          {current.label}
          {current.labelLine2 ? (
            <>
              <br />
              {current.labelLine2}
            </>
          ) : null}
        </span>
      </button>

      {/* TOUCH TO START + arrow circle */}
      <div
        className="absolute flex items-center gap-10"
        style={{ left: '50%', top: '1410px', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
      >
        <span
          className="font-display font-bold uppercase text-white"
          style={{ fontSize: '60px', letterSpacing: '0.02em' }}
        >
          Touch to start
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="110"
          height="110"
          viewBox="-10 -10 120 120"
          fill="none"
          stroke="#fff"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M46.023,72.912,67.534,51.4m0,0L46.023,29.889M67.534,51.4H3m8.15,26.889a48.4,48.4,0,1,0,0-53.778" />
        </svg>
      </div>

      {/* Footer: clock + accesibilidad + ENGLISH */}
      <div
        className="absolute left-0 right-0 flex items-center justify-between"
        style={{ bottom: '0', height: '200px', paddingLeft: '66px', paddingRight: '60px' }}
      >
        <span
          className="font-display font-bold text-white"
          style={{ fontSize: '67px', lineHeight: '1' }}
        >
          10:37 a.m.
        </span>
        <AccessibilityIcon size={80} color="#fff" />
        <EnglishButton width={244} height={80} fontSize={26} />
      </div>
    </div>
  );
}
