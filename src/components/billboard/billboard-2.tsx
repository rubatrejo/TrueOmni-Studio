'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { LanguageDropdown } from '@/components/home/language-dropdown';
import { useTextosMap } from '@/components/i18n-provider';

import { BillboardBackground } from './billboard-background';
import { AccessibilityIcon } from './billboard-footer-parts';
import { OverlayLayer } from './billboard-overlay';
import { MODULE_BILLBOARD_INFO, resolveSlotHref } from './module-info';
import {
  BILLBOARD_LOGO_SLOT_WIDTH,
  useBillboardLogoHeight,
  useBillboardLogoPosition,
  useBillboardOverride,
  useBillboardSettings,
} from './use-billboard-override';

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

/** Cards default del SVG original. Se usan como fallback cuando el slot
 *  correspondiente no está asignado en `billboard.modules` o el módulo
 *  asignado no tiene info en MODULE_BILLBOARD_INFO. */
const DEFAULT_CARDS: readonly CardData[] = [
  { key: 'things-to-do', image: '/assets/billboard-2/things-to-do.jpg', label: 'Things to Do' },
  { key: 'events', image: '/assets/billboard-2/events.jpg', label: 'Events' },
  { key: 'hotels', image: '/assets/billboard-2/hotels.jpg', label: 'Hotels' },
  {
    key: 'itinerary',
    image: '/assets/billboard-2/itinerary.jpg',
    label: 'Trip',
    labelLine2: 'Planner',
  },
];

export function Billboard2() {
  const t = useTextosMap();
  const logoH = useBillboardLogoHeight();
  const logoPos = useBillboardLogoPosition(2);
  const { modules } = useBillboardOverride();
  const { background, touchHere, overlayOpacity, overlay } = useBillboardSettings(2);
  const heroSrc = background.src || '/assets/billboard-2/hero.png';
  const heroIsVideo = background.type === 'video';
  const [active, setActive] = useState(0);
  // touchHere.width/height NO aplican (texto + arrow inline, no botón).
  const rawTouchLabel =
    touchHere.label.trim().length > 0 ? touchHere.label : (t.billboard_touch_here ?? 'Touch Here');
  const touchLabel = touchHere.twoLines
    ? rawTouchLabel.replace(/\s+/, '\n')
    : rawTouchLabel.replace(/\n+/g, ' ');

  // CARDS reactivo: por cada slot 0..3, si `billboard.modules[i]` está
  // asignado y existe en MODULE_BILLBOARD_INFO, usar esa info; si no, fallback
  // al DEFAULT_CARDS del slot. La imagen también respeta el override (si el
  // módulo asignado tiene `image` en el catálogo, se usa; si no, conserva la
  // del slot original para no romper la composición visual).
  const CARDS = useMemo<readonly CardData[]>(() => {
    return DEFAULT_CARDS.map((fallback, i) => {
      const slotKey = modules?.[i];
      if (!slotKey) return fallback;
      const info = MODULE_BILLBOARD_INFO[slotKey];
      if (!info) return fallback;
      return {
        key: slotKey,
        image: info.image ?? fallback.image,
        label: info.label,
        labelLine2: info.labelLine2,
      };
    });
  }, [modules]);

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
      {/* Hero full-bleed (overrideable per kiosk) */}
      <BillboardBackground src={heroSrc} type={heroIsVideo ? 'video' : 'image'} />
      {/* Overlay base de identidad (gradient negro vertical para legibilidad
          del logo + cards). Encima, OverlayLayer aplica el overlay configurable
          del Studio si el operador definió mode/color/opacity propios. */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.8) 100%)',
        }}
      />
      <OverlayLayer overlayOpacity={overlayOpacity} overlay={overlay} />

      {/* Logo TrueOmni blanco — posición configurable desde Studio (9-point
          picker + sliders). Default top-center según el SVG original. */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: `${logoPos.x}px`,
          top: `${logoPos.y}px`,
          width: `${BILLBOARD_LOGO_SLOT_WIDTH}px`,
          height: `${logoH}px`,
        }}
      >
        <TrueOmniLogo slot="idle" className="h-full w-auto max-w-full text-white" />
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

      {/* Card central — más grande (800×960) — click navega al módulo del slot
          activo. Antes hacía advance() del carousel; ahora los peeks laterales
          son la única forma de avanzar/retroceder y la card central es el CTA. */}
      <Link
        href={resolveSlotHref(current.key)}
        aria-label={`${current.label}: abrir`}
        className="absolute block overflow-hidden shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
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
      </Link>

      {/* TOUCH TO START + arrow — Link que navega al módulo del slot activo. */}
      <Link
        href={resolveSlotHref(current.key)}
        aria-label={`${current.label}: abrir`}
        className="absolute flex items-center gap-10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
        style={{ left: '50%', top: '1410px', transform: 'translateX(-50%)' }}
      >
        <span
          className="font-display font-bold uppercase leading-none text-white"
          style={{
            fontSize: `${touchHere.fontSize}px`,
            letterSpacing: '0.02em',
            whiteSpace: 'pre-line',
          }}
        >
          {touchLabel}
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
          className="shrink-0"
        >
          <path d="M46.023,72.912,67.534,51.4m0,0L46.023,29.889M67.534,51.4H3m8.15,26.889a48.4,48.4,0,1,0,0-53.778" />
        </svg>
      </Link>

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
        <div data-billboard-no-link>
          <LanguageDropdown />
        </div>
      </div>
    </div>
  );
}
