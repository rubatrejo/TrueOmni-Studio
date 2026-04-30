'use client';

import Link from 'next/link';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { LanguageDropdown } from '@/components/home/language-dropdown';
import { useTextosMap } from '@/components/i18n-provider';

import { AccessibilityIcon } from './billboard-footer-parts';
import { resolveSlotHref, resolveSlotImage, resolveSlotLabel } from './module-info';
import { useBillboardLogoHeight, useBillboardOverride } from './use-billboard-override';

/**
 * Billboard 3 — variante "2 cards arriba + banner central + 2 cards abajo".
 *
 * Layout según ref-b3:
 * - Fila 1 (y=0..450): FOOD & DRINK (eat.jpg) + EVENTS (events.jpg).
 * - Banner central (y=450..1230): foto grass/city con overlay azul dark,
 *   TrueOmni logo centrado + TOUCH TO START + arrow circle.
 * - Fila 2 (y=1230..1720): THINGS TO DO (play.jpg) + ITINERARY BUILDER
 *   (things-to-do.jpg como "bikes").
 * - Footer (y=1720..1920): #004f8b con TrueOmni + accesibilidad + ENGLISH.
 */
export function Billboard3() {
  const t = useTextosMap();
  const logoH = useBillboardLogoHeight();
  const { modules } = useBillboardOverride();
  // Slots 0..3 del 2×2: top-left → top-right → bottom-left → bottom-right.
  const slot0 = resolveSlotLabel(modules?.[0], { label: 'Food &', labelLine2: 'Drink' });
  const slot1 = resolveSlotLabel(modules?.[1], { label: 'Events' });
  const slot2 = resolveSlotLabel(modules?.[2], { label: 'Things', labelLine2: 'to Do' });
  const slot3 = resolveSlotLabel(modules?.[3], { label: 'Itinerary', labelLine2: 'Builder' });
  const cardBase = 'absolute overflow-hidden';
  const topRowSize = { width: '540px', height: '475px' } as const;
  const bottomRowSize = { width: '540px', height: '475px' } as const;
  const overlayStyle = { backgroundColor: 'rgba(0,0,0,0.35)' } as const;
  const labelClass =
    'absolute font-display font-bold uppercase leading-[1.05] text-white tracking-wide';
  const labelStyle = { left: '40px', bottom: '40px', fontSize: '64px' } as const;

  return (
    <div
      data-billboard="3"
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: '#004f8b' }}
    >
      {/* Fila 1 — slots 0 (top-left) y 1 (top-right). y=0..450 */}
      <Link
        href={resolveSlotHref(modules?.[0])}
        className={`${cardBase} block`}
        style={{ ...topRowSize, left: '0', top: '0' }}
        aria-label={`${slot0.label} ${slot0.labelLine2 ?? ''}`.trim()}
      >
        <img
          src={resolveSlotImage(modules?.[0], '/assets/billboard-3/eat.jpg')}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={overlayStyle} />
        <span className={labelClass} style={labelStyle}>
          {slot0.label}
          {slot0.labelLine2 ? (
            <>
              <br />
              {slot0.labelLine2}
            </>
          ) : null}
        </span>
      </Link>
      <Link
        href={resolveSlotHref(modules?.[1])}
        className={`${cardBase} block`}
        style={{ ...topRowSize, left: '540px', top: '0' }}
        aria-label={`${slot1.label} ${slot1.labelLine2 ?? ''}`.trim()}
      >
        <img
          src={resolveSlotImage(modules?.[1], '/assets/billboard-3/events.jpg')}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={overlayStyle} />
        <span className={labelClass} style={labelStyle}>
          {slot1.label}
          {slot1.labelLine2 ? (
            <>
              <br />
              {slot1.labelLine2}
            </>
          ) : null}
        </span>
      </Link>

      {/* Banner central (y=475..1245): grass/city + logo + TOUCH TO START */}
      <div className="absolute inset-x-0 overflow-hidden" style={{ top: '475px', height: '770px' }}>
        <img
          src="/assets/billboard-4/things-to-do.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,79,139,0.6)' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-16">
          {/* Logo height configurable desde Studio (S=80 / M=128 / L=180).
              SVG original era 110px → cae cerca del L. */}
          <div className="flex items-center justify-center" style={{ height: `${logoH}px` }}>
            <TrueOmniLogo slot="idle" className="h-full w-auto text-white" />
          </div>
          <div className="flex items-center gap-10">
            <span
              className="font-display font-bold uppercase text-white"
              style={{ fontSize: '72px', letterSpacing: '0.02em', whiteSpace: 'pre-line' }}
            >
              {(t.billboard_touch_to_start ?? 'Touch to start').replace(/\n/g, ' ')}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="110"
              height="110"
              viewBox="-10 -10 120 120"
              fill="none"
              stroke="#fff"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M46.023,72.912,67.534,51.4m0,0L46.023,29.889M67.534,51.4H3m8.15,26.889a48.4,48.4,0,1,0,0-53.778" />
            </svg>
          </div>
        </div>
      </div>

      {/* Fila 2 — slots 2 (bottom-left) y 3 (bottom-right). y=1245..1720 */}
      <Link
        href={resolveSlotHref(modules?.[2])}
        className={`${cardBase} block`}
        style={{ ...bottomRowSize, left: '0', top: '1245px' }}
        aria-label={`${slot2.label} ${slot2.labelLine2 ?? ''}`.trim()}
      >
        <img
          src={resolveSlotImage(modules?.[2], '/assets/billboard-3/play.jpg')}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={overlayStyle} />
        <span className={labelClass} style={labelStyle}>
          {slot2.label}
          {slot2.labelLine2 ? (
            <>
              <br />
              {slot2.labelLine2}
            </>
          ) : null}
        </span>
      </Link>
      <Link
        href={resolveSlotHref(modules?.[3])}
        className={`${cardBase} block`}
        style={{ ...bottomRowSize, left: '540px', top: '1245px' }}
        aria-label={`${slot3.label} ${slot3.labelLine2 ?? ''}`.trim()}
      >
        <img
          src={resolveSlotImage(modules?.[3], '/assets/billboard-3/things-to-do.jpg')}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={overlayStyle} />
        <span className={labelClass} style={labelStyle}>
          {slot3.label}
          {slot3.labelLine2 ? (
            <>
              <br />
              {slot3.labelLine2}
            </>
          ) : null}
        </span>
      </Link>

      {/* Footer (y=1720..1920): #004f8b con TrueOmni + accesibilidad + ENGLISH */}
      <div
        className="absolute left-0 right-0 flex items-center justify-between"
        style={{
          bottom: '0',
          height: '200px',
          backgroundColor: '#004f8b',
          paddingLeft: '59px',
          paddingRight: '59px',
        }}
      >
        <TrueOmniLogo slot="footer" className="h-[65px] w-auto text-white" />
        <AccessibilityIcon size={80} color="#fff" />
        <div data-billboard-no-link>
          <LanguageDropdown />
        </div>
      </div>
    </div>
  );
}
