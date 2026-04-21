import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

import { AccessibilityIcon, EnglishButton } from './billboard-footer-parts';

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
      {/* Fila 1: FOOD & DRINK + EVENTS (y=0..450) */}
      <div className={cardBase} style={{ ...topRowSize, left: '0', top: '0' }}>
        <img
          src="/assets/billboard-3/eat.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={overlayStyle} />
        <span className={labelClass} style={labelStyle}>
          Food &<br />
          Drink
        </span>
      </div>
      <div className={cardBase} style={{ ...topRowSize, left: '540px', top: '0' }}>
        <img
          src="/assets/billboard-3/events.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={overlayStyle} />
        <span className={labelClass} style={labelStyle}>
          Events
        </span>
      </div>

      {/* Banner central (y=475..1245): grass/city + logo + TOUCH TO START */}
      <div className="absolute inset-x-0 overflow-hidden" style={{ top: '475px', height: '770px' }}>
        <img
          src="/assets/billboard-4/things-to-do.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,79,139,0.6)' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-16">
          <TrueOmniLogo className="h-[110px] w-auto text-white" />
          <div className="flex items-center gap-10">
            <span
              className="font-display font-bold uppercase text-white"
              style={{ fontSize: '72px', letterSpacing: '0.02em' }}
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
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M46.023,72.912,67.534,51.4m0,0L46.023,29.889M67.534,51.4H3m8.15,26.889a48.4,48.4,0,1,0,0-53.778" />
            </svg>
          </div>
        </div>
      </div>

      {/* Fila 2: THINGS TO DO + ITINERARY BUILDER (y=1230..1720) */}
      <div className={cardBase} style={{ ...bottomRowSize, left: '0', top: '1245px' }}>
        <img
          src="/assets/billboard-3/play.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={overlayStyle} />
        <span className={labelClass} style={labelStyle}>
          Things
          <br />
          to Do
        </span>
      </div>
      <div className={cardBase} style={{ ...bottomRowSize, left: '540px', top: '1245px' }}>
        <img
          src="/assets/billboard-3/things-to-do.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={overlayStyle} />
        <span className={labelClass} style={labelStyle}>
          Itineray
          <br />
          Builder
        </span>
      </div>

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
        <TrueOmniLogo className="h-[65px] w-auto text-white" />
        <AccessibilityIcon size={80} color="#fff" />
        <EnglishButton width={244} height={80} fontSize={26} />
      </div>
    </div>
  );
}
