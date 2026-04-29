import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { LanguageDropdown } from '@/components/home/language-dropdown';

import { AccessibilityIcon } from './billboard-footer-parts';

/**
 * Billboard 4 — variante "Bandas horizontales + sidebars verticales".
 *
 * Layout según ref-b4:
 * - Banda 1 (y=0..330): header azul #004f8b con TrueOmni logo blanco.
 * - Sidebar EVENTS vertical (blue #004f8b) sobre banda 2.
 * - Banda 2 (y=330..830): fireworks/events photo.
 * - Sidebar FOOD vertical (blue #1796d6) derecha sobre banda 3.
 * - Banda 3 (y=830..1330): cityscape photo (landscape.jpg).
 * - Sidebar START vertical (olive #b9bd39) izquierda sobre banda 4.
 * - Banda 4 (y=1330..1730): grass/lake photo + icono arrow circle grande.
 * - Footer (y=1730..1920): #004f8b con TrueOmni + accesibilidad + ENGLISH.
 */
export function Billboard4() {
  return (
    <div
      data-billboard="4"
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: '#fff' }}
    >
      {/* Banda 1 (y=0..330) header azul + logo */}
      <div
        className="absolute inset-x-0 flex items-center justify-center"
        style={{ top: '0', height: '330px', backgroundColor: '#004f8b' }}
      >
        <TrueOmniLogo slot="idle" className="h-[128px] w-auto text-white" />
      </div>

      {/* Banda 2 (y=330..830) fireworks */}
      <div className="absolute inset-x-0 overflow-hidden" style={{ top: '330px', height: '500px' }}>
        <img
          src="/assets/billboard-4/events.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Banda 3 (y=830..1330) cityscape */}
      <div className="absolute inset-x-0 overflow-hidden" style={{ top: '830px', height: '500px' }}>
        <img
          src="/assets/billboard-4/landscape.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Banda 4 (y=1330..1730) grass/lake + arrow circle */}
      <div
        className="absolute inset-x-0 overflow-hidden"
        style={{ top: '1330px', height: '400px' }}
      >
        <img
          src="/assets/billboard-4/things-to-do.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Arrow circle grande a la derecha */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="200"
          height="200"
          viewBox="-10 -10 120 120"
          fill="none"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute"
          style={{ right: '180px', top: '50%', transform: 'translateY(-50%)' }}
        >
          <path d="M46.023,72.912,67.534,51.4m0,0L46.023,29.889M67.534,51.4H3m8.15,26.889a48.4,48.4,0,1,0,0-53.778" />
        </svg>
      </div>

      {/* Footer (y=1730..1920) */}
      <div
        className="absolute left-0 right-0 flex items-center justify-between"
        style={{
          bottom: '0',
          height: '190px',
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

      {/* Sidebar EVENTS — left, sobre banda 2 (y=330..830) */}
      <div
        className="absolute z-10 flex items-center justify-center"
        style={{
          left: '0',
          top: '330px',
          width: '140px',
          height: '500px',
          backgroundColor: '#004f8b',
        }}
      >
        <span
          className="font-display font-bold uppercase text-white"
          style={{
            fontSize: '72px',
            letterSpacing: '0.05em',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
          }}
        >
          Events
        </span>
      </div>

      {/* Sidebar FOOD — right, sobre banda 3 (y=830..1330) */}
      <div
        className="absolute z-10 flex items-center justify-center"
        style={{
          right: '0',
          top: '830px',
          width: '140px',
          height: '500px',
          backgroundColor: '#1796d6',
        }}
      >
        <span
          className="font-display font-bold uppercase text-white"
          style={{
            fontSize: '72px',
            letterSpacing: '0.05em',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
          }}
        >
          Food
        </span>
      </div>

      {/* Sidebar START — left, sobre banda 4 (y=1330..1730) */}
      <div
        className="absolute z-10 flex items-center justify-center"
        style={{
          left: '0',
          top: '1330px',
          width: '140px',
          height: '400px',
          backgroundColor: '#b9bd39',
        }}
      >
        <span
          className="font-display font-bold uppercase text-white"
          style={{
            fontSize: '72px',
            letterSpacing: '0.05em',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
          }}
        >
          Start
        </span>
      </div>
    </div>
  );
}
