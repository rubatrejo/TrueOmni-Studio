import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

/**
 * Billboard 4 — variante "Bandas horizontales + sidebars verticales".
 *
 * Layout del SVG Billboard 4:
 * - Banda 1 (y=0..389): landscape image + overlay #004f8b 87% con logo
 *   TrueOmni white centered.
 * - Banda 2 (y=389..835): fireworks/events image + gradient overlay 33%.
 * - Separador blanco (y=835..1280) o área con card central.
 * - Banda 3 (y=1280..1726): cityscape image + gradient overlay 74%.
 * - Footer (y=1726..1920): #004f8b con logo footer.
 * - Sidebar labels rotados -90°:
 *   · EVENTS (blue #004f8b) en left a y=835.
 *   · START (olive #b9bd39) en left a y=1726.
 *   · FOOD (blue #1796d6) a derecha.
 * - "See ADS" @ (43.5, 36.5) Open Sans Bold 36px blanco.
 */
export function Billboard4() {
  return (
    <div
      data-billboard="4"
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: '#fff' }}
    >
      {/* See ADS title */}
      <span
        className="absolute z-10 font-sans font-bold text-white underline"
        style={{ left: '43.5px', top: '36.5px', fontSize: '36px' }}
      >
        See ADS
      </span>

      {/* Banda 1 (y=0..389) landscape + blue overlay + logo */}
      <div className="absolute inset-x-0 overflow-hidden" style={{ top: '0', height: '389px' }}>
        <img
          src="/assets/billboard-4/landscape.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,79,139,0.87)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <TrueOmniLogo className="h-[128px] w-auto text-white" />
        </div>
      </div>

      {/* Banda 2 (y=389..835) fireworks */}
      <div className="absolute inset-x-0 overflow-hidden" style={{ top: '389px', height: '446px' }}>
        <img
          src="/assets/billboard-4/events.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)',
            opacity: 0.33,
          }}
        />
      </div>

      {/* White band (y=835..1280): placeholder/separator, mantiene estructura */}
      <div
        className="absolute inset-x-0 flex items-center justify-center"
        style={{ top: '835px', height: '445px', backgroundColor: '#fff' }}
      >
        <TrueOmniLogo className="h-[90px] w-auto text-[#2f2f2f]" />
      </div>

      {/* Banda 3 (y=1280..1726) cityscape */}
      <div
        className="absolute inset-x-0 overflow-hidden"
        style={{ top: '1280px', height: '446px' }}
      >
        <img
          src="/assets/billboard-4/things-to-do.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)',
            opacity: 0.74,
          }}
        />
      </div>

      {/* Footer (y=1726..1920) */}
      <div
        className="absolute inset-x-0 flex items-center"
        style={{
          top: '1726px',
          height: '194px',
          backgroundColor: '#004f8b',
          paddingLeft: '59px',
        }}
      >
        <TrueOmniLogo className="h-[65px] w-auto text-white" />
      </div>

      {/* Sidebar EVENTS — rotate(-90) posicionado en left, y=835..(835-446=389)
          Con rotación: width=446 altura=162 se convierte en altura=446 ancho=162
          La barra queda vertical, pegada al lado izquierdo. */}
      <div
        className="absolute z-10 flex items-center justify-center"
        style={{
          left: '0',
          top: '389px',
          width: '162px',
          height: '446px',
          backgroundColor: '#004f8b',
        }}
      >
        <span
          className="font-display font-bold uppercase text-white"
          style={{ fontSize: '70px', transform: 'rotate(-90deg)', letterSpacing: '0.05em' }}
        >
          Events
        </span>
      </div>

      {/* Sidebar FOOD — derecha, y=835..1280 (aprox) */}
      <div
        className="absolute z-10 flex items-center justify-center"
        style={{
          right: '0',
          top: '835px',
          width: '162px',
          height: '445px',
          backgroundColor: '#1796d6',
        }}
      >
        <span
          className="font-display font-bold uppercase text-white"
          style={{ fontSize: '70px', transform: 'rotate(-90deg)', letterSpacing: '0.05em' }}
        >
          Food
        </span>
      </div>
    </div>
  );
}
