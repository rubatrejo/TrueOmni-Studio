import { Accessibility, ChevronUp, Globe } from 'lucide-react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

/**
 * Billboard 0 — variante "Dark Hero".
 *
 * Layout replicado 1:1 del SVG original (designs/TNT/Billboard/Billboard 0.svg):
 * - Foto hero full-bleed (1080×1920).
 * - Botón central "TOUCH HERE" 548×342 @ (281, 776), rx=20, fill #2e2e2e,
 *   con doble borde blanco: un ring de 10px desde el edge (SVG stroke).
 * - Botón ENGLISH (decorativo Fase 3) 244×80 @ (418, 1565), rx=8,
 *   fondo #b4bd01 (olive), globe icon + ENGLISH + chevron.
 * - Footer 1080×218 @ y=1702 en #004f8b con:
 *   · Logo TrueOmni blanco @ (60, 103 relativo al footer).
 *   · Wheelchair accessibility icon @ (540, 114 relativo al footer).
 *   · "Powered by" + mini logo TrueOmni @ (851, 132 relativo al footer).
 *
 * Tipografía CTA: Open Sans Bold 90px (fidelidad 1:1 con el SVG).
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

      {/* Botón central TOUCH HERE (548×342 @ x=281 y=776, rx=20).
          Doble borde: fill oscuro + ring blanco 10px desde el edge. */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: '281px',
          top: '776px',
          width: '548px',
          height: '342px',
          backgroundColor: '#2e2e2e',
          borderRadius: '20px',
          boxShadow: 'inset 0 0 0 10px #fff',
        }}
      >
        <p
          className="text-center font-sans font-bold text-white"
          style={{ fontSize: '90px', lineHeight: '110px' }}
        >
          TOUCH
          <br />
          HERE
        </p>
      </div>

      {/* Botón ENGLISH decorativo (244×80 @ x=418 y=1565, rx=8, fill #b4bd01).
          Globe icon + label + chevron-up. Fase 6 lo hará funcional. */}
      <div
        className="absolute flex items-center"
        style={{
          left: '418px',
          top: '1565px',
          width: '244px',
          height: '80px',
          backgroundColor: '#b4bd01',
          borderRadius: '8px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <Globe className="h-8 w-8 text-white" strokeWidth={2.5} />
        <span
          className="ml-3 font-sans font-bold uppercase text-white"
          style={{ fontSize: '24px', letterSpacing: '0.02em' }}
        >
          English
        </span>
        <ChevronUp className="ml-auto h-6 w-6 text-white" strokeWidth={3} />
      </div>

      {/* Footer 1080×218 @ y=1702 en azul marca #004f8b. */}
      <div
        className="absolute left-0 right-0 flex items-center"
        style={{
          bottom: '0',
          height: '218px',
          backgroundColor: '#004f8b',
        }}
      >
        {/* Logo TrueOmni @ (60, 103) relativo → centrado verticalmente
            con margen izquierdo de 60px. */}
        <TrueOmniLogo className="ml-[60px] h-[65px] w-auto text-white" />

        {/* Wheelchair icon @ (540, 114) relativo → centrado verticalmente
            con x absoluto 540. */}
        <Accessibility
          className="absolute h-[54px] w-[54px] text-white"
          style={{ left: '540px', top: '111px' }}
          strokeWidth={2.2}
        />

        {/* "Powered by" + mini logo TrueOmni a la derecha del footer. */}
        <div className="absolute flex flex-col items-start" style={{ left: '851px', top: '103px' }}>
          <span
            className="font-sans italic text-white"
            style={{ fontSize: '8px', letterSpacing: '0.02em', lineHeight: '1' }}
          >
            Powered by
          </span>
          <TrueOmniLogo className="mt-[4px] h-[14px] w-auto text-white" />
        </div>
      </div>
    </div>
  );
}
