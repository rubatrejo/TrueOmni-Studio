'use client';

import Link from 'next/link';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { LanguageDropdown } from '@/components/home/language-dropdown';
import { useTextosMap } from '@/components/i18n-provider';

import { AccessibilityIcon } from './billboard-footer-parts';
import { OverlayLayer } from './billboard-overlay';
import { resolveSlotHref, resolveSlotImage, resolveSlotLabel } from './module-info';
import { SlotImage } from './slot-image';
import {
  useBillboardFooterLogoHeight,
  useBillboardLogoHeight,
  useBillboardOverride,
  useBillboardSettings,
} from './use-billboard-override';

/**
 * Billboard 3 — variante "2 cards arriba + banner central + 2 cards abajo".
 *
 * Layout según ref-b3:
 * - Fila 1 (y=0..450): FOOD & DRINK (eat.jpg) + EVENTS (events.jpg).
 * - Banner central (y=450..1230): foto grass/city con overlay azul dark,
 *   TrueOmni logo centrado + TOUCH TO START + arrow circle.
 * - Fila 2 (y=1230..1720): THINGS TO DO (play.jpg) + ITINERARY BUILDER
 *   (things-to-do.jpg como "bikes").
 * - Footer (y=1720..1920): hsl(var(--brand-primary)) con TrueOmni + accesibilidad + ENGLISH.
 */
export function Billboard3() {
  const t = useTextosMap();
  const logoH = useBillboardLogoHeight();
  const { modules } = useBillboardOverride();
  const { background, touchHere, overlayOpacity, overlay } = useBillboardSettings(3);
  const heroSrc = background.src || '/assets/billboard-0/hero.jpg';
  const heroIsVideo = background.type === 'video';
  const footerLogoH = useBillboardFooterLogoHeight();
  // touchHere.width/height NO aplican (texto + arrow inline, no botón).
  const rawTouchLabel =
    touchHere.label.trim().length > 0
      ? touchHere.label
      : (t.billboard_touch_here ?? 'Touch Here');
  const touchLabel = touchHere.twoLines
    ? rawTouchLabel.replace(/\s+/, '\n')
    : rawTouchLabel.replace(/\n+/g, ' ');
  // Slots 0..3 del 2×2: top-left → top-right → bottom-left → bottom-right.
  const slot0 = resolveSlotLabel(modules?.[0], { label: 'Food &', labelLine2: 'Drink' });
  const slot1 = resolveSlotLabel(modules?.[1], { label: 'Events' });
  const slot2 = resolveSlotLabel(modules?.[2], { label: 'Things', labelLine2: 'to Do' });
  const slot3 = resolveSlotLabel(modules?.[3], { label: 'Trip', labelLine2: 'Planner' });
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
      style={{ backgroundColor: 'hsl(var(--brand-primary))' }}
    >
      {/* Fila 1 — slots 0 (top-left) y 1 (top-right). y=0..450 */}
      <Link
        href={resolveSlotHref(modules?.[0])}
        className={`${cardBase} block`}
        style={{ ...topRowSize, left: '0', top: '0' }}
        aria-label={`${slot0.label} ${slot0.labelLine2 ?? ''}`.trim()}
      >
        <SlotImage
          src={resolveSlotImage(modules?.[0], '/assets/billboard-3/eat.jpg')}
          fallbackSrc="/assets/billboard-3/eat.jpg"
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
        <SlotImage
          src={resolveSlotImage(modules?.[1], '/assets/billboard-3/events.jpg')}
          fallbackSrc="/assets/billboard-3/events.jpg"
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
        {heroIsVideo ? (
          <video
            src={heroSrc}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {/* Overlay base de identidad de marca: brand-primary 60% asegura
            legibilidad del logo + TOUCH TO START sobre cualquier hero. Encima,
            OverlayLayer aplica el overlay configurable del Studio si el
            operador definió mode/color/opacity propios. */}
        <div className="absolute inset-0" style={{ backgroundColor: 'hsl(var(--brand-primary) / 0.6)' }} />
        <OverlayLayer overlayOpacity={overlayOpacity} overlay={overlay} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-16">
          {/* Logo height configurable desde Studio (S=80 / M=128 / L=180).
              SVG original era 110px → cae cerca del L. */}
          <div className="flex items-center justify-center" style={{ height: `${logoH}px` }}>
            <TrueOmniLogo slot="idle" className="h-full w-auto text-white" />
          </div>
          <div className="flex items-center gap-10">
            <span
              className="font-display font-bold uppercase text-white"
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
        <SlotImage
          src={resolveSlotImage(modules?.[2], '/assets/billboard-3/play.jpg')}
          fallbackSrc="/assets/billboard-3/play.jpg"
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
        <SlotImage
          src={resolveSlotImage(modules?.[3], '/assets/billboard-3/things-to-do.jpg')}
          fallbackSrc="/assets/billboard-3/things-to-do.jpg"
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

      {/* Footer (y=1720..1920): hsl(var(--brand-primary)) con TrueOmni + accesibilidad + ENGLISH */}
      <div
        className="absolute left-0 right-0 flex items-center justify-between"
        style={{
          bottom: '0',
          height: '200px',
          backgroundColor: 'hsl(var(--brand-primary))',
          paddingLeft: '59px',
          paddingRight: '59px',
        }}
      >
        <span
          className="flex items-center"
          style={{ height: footerLogoH }}
        >
          <TrueOmniLogo slot="footer" className="h-full w-auto text-white" />
        </span>
        <AccessibilityIcon size={80} color="#fff" />
        <div data-billboard-no-link>
          <LanguageDropdown />
        </div>
      </div>
    </div>
  );
}
