import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

/**
 * Billboard 2 — variante "Hero + 4 category cards".
 *
 * Layout del SVG Billboard 2:
 * - Splash-Background full 1080×1920 (foto sparklers) + overlay gradient
 *   linear opacity 0.8.
 * - Logo TrueOmni @ (256, 115) en dark grey #2f2f2f.
 * - 4 tarjetas categoría con fotos cubriendo el canvas:
 *   THINGS TO DO, HOTELS, ITINERARY BUILDER, EVENTS.
 * - "10:37 a.m." @ (66, 1838) Montserrat-Bold 67px blanco en footer.
 * - "TOUCH TO START" 55px @ (473, 1678) con flecha circular broken.
 * - Button ENGLISH decorativo olive @ (776, 1783) 244×80.
 */
export function Billboard2() {
  return (
    <div
      data-billboard="2"
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: '#000' }}
    >
      {/* Hero full-bleed (sparklers) */}
      <img
        src="/assets/billboard-2/hero.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Overlay gradient opacity 0.8 */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
          opacity: 0.8,
        }}
      />

      {/* Logo TrueOmni centrado arriba en grey oscuro */}
      <div className="absolute" style={{ left: '256px', top: '115px' }}>
        <TrueOmniLogo className="h-[106px] w-auto text-[#2f2f2f]" />
      </div>

      {/* Grid de 4 cards: THINGS TO DO (grande, central alto) + 3 laterales */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: '166px',
          top: '390px',
          width: '748px',
          height: '600px',
          borderRadius: '21px',
        }}
      >
        <img
          src="/assets/billboard-2/things-to-do.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
        <span
          className="absolute font-display font-bold uppercase text-white"
          style={{ left: '40px', bottom: '40px', fontSize: '70px', letterSpacing: '0.02em' }}
        >
          Things to do
        </span>
      </div>

      {/* Hotels card (abajo-izquierda) */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: '60px',
          top: '1060px',
          width: '460px',
          height: '460px',
          borderRadius: '21px',
        }}
      >
        <img
          src="/assets/billboard-2/hotels.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
        <span
          className="absolute font-display font-bold uppercase text-white"
          style={{ left: '40px', bottom: '40px', fontSize: '50px', letterSpacing: '0.02em' }}
        >
          Hotels
        </span>
      </div>

      {/* Itinerary Builder card (abajo-derecha) */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: '560px',
          top: '1060px',
          width: '460px',
          height: '460px',
          borderRadius: '21px',
        }}
      >
        <img
          src="/assets/billboard-2/itinerary.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />
        <span
          className="absolute font-display font-bold uppercase leading-[1.05] text-white"
          style={{ left: '40px', bottom: '40px', fontSize: '50px', letterSpacing: '0.02em' }}
        >
          Itinerary
          <br />
          Builder
        </span>
      </div>

      {/* Footer group con clock + TOUCH TO START + arrow + ENGLISH */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: '300px' }}>
        {/* Clock bottom-left */}
        <div
          className="absolute font-display font-bold text-white"
          style={{ left: '66px', bottom: '48px', fontSize: '67px', lineHeight: '1' }}
        >
          10:37 a.m.
        </div>

        {/* TOUCH TO START + arrow centered */}
        <div
          className="absolute flex items-center gap-8"
          style={{ left: '50%', bottom: '180px', transform: 'translateX(-50%)' }}
        >
          <span
            className="font-display font-bold uppercase text-white"
            style={{ fontSize: '55px', letterSpacing: '0.02em' }}
          >
            Touch to start
          </span>
          {/* Arrow circle path from SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="110"
            height="110"
            viewBox="-10 -10 120 120"
            fill="none"
            stroke="#fff"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M46.023,72.912,67.534,51.4m0,0L46.023,29.889M67.534,51.4H3m8.15,26.889a48.4,48.4,0,1,0,0-53.778" />
          </svg>
        </div>

        {/* ENGLISH button decorativo */}
        <div
          className="absolute flex items-center gap-3"
          style={{
            right: '60px',
            bottom: '48px',
            width: '244px',
            height: '80px',
            backgroundColor: '#b9bd39',
            borderRadius: '8px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <span
            className="font-sans font-bold uppercase text-white"
            style={{ fontSize: '24px', letterSpacing: '0.02em' }}
          >
            English
          </span>
          {/* Drop-down chevron from SVG path */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 -12 18 14"
            fill="#fff"
            className="ml-auto"
          >
            <path d="M17.776-3.066l-8.281-8.27a.707.707,0,0,0-1,0L.209-3.066a.721.721,0,0,0,0,1.016L2.062-.209a.707.707,0,0,0,1,0L8.993-6.136,14.919-.209a.707.707,0,0,0,1,0l1.853-1.842A.721.721,0,0,0,17.776-3.066Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
