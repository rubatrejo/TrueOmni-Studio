import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

/**
 * Billboard 3 — variante "Dark blue + grid 2×3 con overlay".
 *
 * Layout del SVG Billboard 3:
 * - Fondo gradiente linear #004f8b (top) → negro (bottom).
 * - "See ADS" Open Sans Bold 36px blanco underline arriba-izquierda.
 * - Grid 2×3 de cards 525×525 rx=9 con photos + overlay #11100d al 35.2%.
 * - "TOUCH TO START" 60px @ footer + chevron.
 * - Logo TrueOmni blanco.
 */
export function Billboard3() {
  const cardBase = 'absolute overflow-hidden';
  const cardSize = { width: '525px', height: '525px', borderRadius: '9px' } as const;
  const overlayStyle = { backgroundColor: 'rgba(17,16,13,0.352)' } as const;
  const labelClass =
    'absolute font-display font-bold uppercase leading-[1.05] text-white tracking-wide';
  const labelStyle = { left: '40px', bottom: '40px', fontSize: '70px' } as const;

  return (
    <div
      data-billboard="3"
      className="relative h-full w-full overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #004f8b 0%, #000 100%)' }}
    >
      {/* See ADS Title */}
      <span
        className="absolute font-sans font-bold text-white underline"
        style={{ left: '43.5px', top: '36.5px', fontSize: '36px' }}
      >
        See ADS
      </span>

      {/* Row 1 (y=100) */}
      <div className={cardBase} style={{ ...cardSize, left: '0px', top: '100px' }}>
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
      <div className={cardBase} style={{ ...cardSize, left: '555px', top: '100px' }}>
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

      {/* Row 2 (y=655) */}
      <div className={cardBase} style={{ ...cardSize, left: '0px', top: '655px' }}>
        <img
          src="/assets/billboard-3/play.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={overlayStyle} />
        <span className={labelClass} style={labelStyle}>
          Stay
        </span>
      </div>
      <div className={cardBase} style={{ ...cardSize, left: '555px', top: '655px' }}>
        <img
          src="/assets/billboard-3/things-to-do.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={overlayStyle} />
        <span className={labelClass} style={labelStyle}>
          Things
          <br />
          to do
        </span>
      </div>

      {/* Row 3 (y=1210) */}
      <div className={cardBase} style={{ ...cardSize, left: '0px', top: '1210px' }}>
        <img
          src="/assets/billboard-3/play.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={overlayStyle} />
        <span className={labelClass} style={labelStyle}>
          Play
        </span>
      </div>
      <div className={cardBase} style={{ ...cardSize, left: '555px', top: '1210px' }}>
        <img
          src="/assets/billboard-3/events.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={overlayStyle} />
        <span className={labelClass} style={labelStyle}>
          Itinerary
          <br />
          Builder
        </span>
      </div>

      {/* Footer (y=1745 → 1920, altura 175px) */}
      <div
        className="absolute inset-x-0 flex items-center justify-center gap-6"
        style={{ top: '1745px', height: '175px' }}
      >
        <TrueOmniLogo className="h-[50px] w-auto text-white" />
        <span
          className="font-display font-bold uppercase text-white"
          style={{ fontSize: '60px', letterSpacing: '0.02em' }}
        >
          Touch to start
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="36"
          height="24"
          viewBox="0 -12 18 14"
          fill="#fff"
        >
          <path d="M17.776-3.066l-8.281-8.27a.707.707,0,0,0-1,0L.209-3.066a.721.721,0,0,0,0,1.016L2.062-.209a.707.707,0,0,0,1,0L8.993-6.136,14.919-.209a.707.707,0,0,0,1,0l1.853-1.842A.721.721,0,0,0,17.776-3.066Z" />
        </svg>
      </div>
    </div>
  );
}
