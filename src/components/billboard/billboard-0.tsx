import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

/**
 * Billboard 0 — variante "Dark Hero".
 *
 * Layout replicado del SVG original (designs/TNT/Billboard/Billboard 0.svg):
 * - Foto hero full-bleed (1080×1920).
 * - Botón central "TOUCH HERE" 548×342 con doble borde blanco.
 *   Posición SVG: x=281, y=776, radius=20, fondo #2e2e2e.
 * - Footer 1080×218 al fondo con fondo `#004f8b` y logo TrueOmni blanco.
 *
 * Tipografía: Open Sans Bold 90px para el CTA (fidelidad 1:1 con el SVG,
 * que usa OpenSans-Bold, no Montserrat). Cada variante respeta las
 * elecciones tipográficas específicas del diseño original.
 */
export function Billboard0() {
  return (
    <div
      data-billboard="0"
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: '#000' }}
    >
      {/* Hero full-bleed */}
      <img
        src="/assets/billboard-0/hero.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Botón central TOUCH HERE (548×342 @ x=281 y=776, rx=20) con
          doble borde: outer fill + inset blanco 10px + inset relleno. */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: '281px',
          top: '776px',
          width: '548px',
          height: '342px',
          backgroundColor: '#2e2e2e',
          borderRadius: '20px',
          boxShadow: 'inset 0 0 0 10px #fff, inset 0 0 0 15px #2e2e2e',
        }}
      >
        <p
          className="text-center font-sans font-bold text-white"
          style={{ fontSize: '90px', lineHeight: '110px', letterSpacing: '0.01em' }}
        >
          TOUCH
          <br />
          HERE
        </p>
      </div>

      {/* Footer 1080×218 @ y=1702 en azul marca (#004f8b) con logo blanco. */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center"
        style={{
          height: '218px',
          backgroundColor: '#004f8b',
          paddingLeft: '60px',
        }}
      >
        <TrueOmniLogo className="h-[65px] w-auto text-white" />
      </div>
    </div>
  );
}
