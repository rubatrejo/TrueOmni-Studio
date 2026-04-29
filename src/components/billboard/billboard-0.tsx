'use client';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { LanguageDropdown } from '@/components/home/language-dropdown';
import { useTextosMap } from '@/components/i18n-provider';

/**
 * Billboard 0 — variante "Dark Hero".
 *
 * Layout replicado 1:1 del SVG original (designs/TNT/Billboard/Billboard 0.svg):
 * - Foto hero full-bleed (1080×1920).
 * - Logo TrueOmni grande blanco @ (193, 371), tamaño ~704×128.
 * - Botón central "TOUCH HERE" 548×342 @ (281, 776), rx=20, fill #2e2e2e,
 *   con ring blanco de 10px desde el edge.
 * - Botón ENGLISH (decorativo Fase 3) 244×80 @ (418, 1565), rx=8,
 *   fondo #b4bd01 (olive), globe icon + ENGLISH + chevron.
 * - Footer 1080×218 @ y=1702 con split diagonal:
 *   · Back_Tab #1796d6 trapezoide (1080,0) → (0,83.636) → (0,218) → (1080,218).
 *   · Front_Tab #004f8b trapezoide (0,0) → (1080,83.636) → (1080,218) → (0,218).
 *   · Logo TrueOmni @ relativo (60, 103).
 *   · Wheelchair path exacto del SVG @ relativo (540, 114).
 *   · Powered by + mini logo @ relativo (851, 132).
 */
export function Billboard0() {
  const t = useTextosMap();
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

      {/* Logo grande TrueOmni encima del botón (193, 371), ~704×128px.
          `slot="idle"` para que use el logo subido en `branding.idleLogo`.
          `width: 694px + flex center` mantiene el logo centrado aunque
          el aspect ratio del logo subido sea distinto al SVG original. */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: '193px', top: '371px', width: '694px', height: '128px' }}
      >
        <TrueOmniLogo
          slot="idle"
          className="h-[128px] max-w-full w-auto text-white"
        />
      </div>

      {/* Botón central TOUCH HERE (548×342 @ x=281 y=776, rx=20) con ring
          blanco de 10px desde el edge (equivalente al stroke del SVG). */}
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
          className="text-center font-display font-bold uppercase text-white"
          style={{ fontSize: '90px', lineHeight: '110px', whiteSpace: 'pre-line' }}
        >
          {t.billboard_touch_here ?? 'Touch\nHere'}
        </p>
      </div>

      {/* Botón Languages funcional (244×80 @ x=418 y=1565). Abre dropdown
          con idiomas del cliente activo y cambia el locale globalmente.
          `data-billboard-no-link` evita que el click navegue al Dashboard
          (el `<BillboardLink>` que envuelve el Billboard hace preventDefault
          cuando detecta este atributo en el subtree). */}
      <div
        data-billboard-no-link
        className="absolute"
        style={{ left: '418px', top: '1565px' }}
      >
        <LanguageDropdown />
      </div>

      {/* Footer 1080×218 @ y=1702 con split diagonal (Back_Tab + Front_Tab). */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: '0',
          height: '218px',
          width: '1080px',
        }}
      >
        {/* Back_Tab brand-secondary (trapezoide con top-left recortado). */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'hsl(var(--brand-secondary))',
            clipPath: 'polygon(1080px 0, 0 83.636px, 0 218px, 1080px 218px)',
          }}
        />
        {/* Front_Tab brand-primary (trapezoide con top-right recortado). */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'hsl(var(--brand-primary))',
            clipPath: 'polygon(0 0, 1080px 83.636px, 1080px 218px, 0 218px)',
          }}
        />

        {/* Logo TrueOmni footer @ relativo (60, 103), ~353.7×65.4.
            `slot="footer"` — logo del footer del Billboard, distinto al
            del header del Home (`default`) y del centro del idle (`idle`). */}
        <div
          className="absolute flex items-center"
          style={{ left: '60px', top: '103px', height: '65px', width: '360px' }}
        >
          <TrueOmniLogo slot="footer" className="h-[65px] max-w-full w-auto text-white" />
        </div>

        {/* Wheelchair icon — path exacto del SVG @ relativo (540, 114.357). */}
        <svg
          className="absolute"
          style={{ left: '540px', top: '114.357px' }}
          xmlns="http://www.w3.org/2000/svg"
          width="54"
          height="54"
          viewBox="0 0 54 54"
          fill="#fff"
          role="img"
          aria-label="Accesibilidad"
        >
          <path d="M5.431,48.58A17.893,17.893,0,0,1,0,35.449,18.137,18.137,0,0,1,3.217,24.955a17.685,17.685,0,0,1,8.49-6.7q.421,2.847.949,6.961A12.414,12.414,0,0,0,8.385,29.49,11.7,11.7,0,0,0,10.23,43.781a11.367,11.367,0,0,0,8.332,3.48A11.846,11.846,0,0,0,30.27,37.136H32.8l2.742,5.8a18.576,18.576,0,0,1-6.8,8.016,17.958,17.958,0,0,1-10.178,3.058A17.893,17.893,0,0,1,5.431,48.58Zm38.128,1.054a3.394,3.394,0,0,1-2-1.74L35.015,33.761H20.25a3.229,3.229,0,0,1-2.215-.844,3.459,3.459,0,0,1-1.16-2Q13.5,7.183,13.5,6.761a6.635,6.635,0,0,1,.949-3.48A6.745,6.745,0,0,1,17.033.8,6.457,6.457,0,0,1,20.566.011a6.4,6.4,0,0,1,4.483,2A6.683,6.683,0,0,1,27,6.55a7.3,7.3,0,0,1-.738,3.217A6.383,6.383,0,0,1,21.2,13.406l.528,3.48H35.438a1.626,1.626,0,0,1,1.688,1.688v3.375a1.624,1.624,0,0,1-1.687,1.688H22.676l.527,3.375H37.125a3.2,3.2,0,0,1,1.74.581,3.933,3.933,0,0,1,1.319,1.318L46.2,41.883l3.9-2a1.956,1.956,0,0,1,1.266,0,1.606,1.606,0,0,1,.949.844l1.477,2.954a1.72,1.72,0,0,1,.105,1.319,1.606,1.606,0,0,1-.844,1L46.2,49.476a3.281,3.281,0,0,1-1.481.361A3.523,3.523,0,0,1,43.559,49.634Z" />
        </svg>

        {/* "Powered by" + mini logo TrueOmni @ relativo (851, 132).
            Tamaños del SVG: "Powered by" 20px, mini logo wordmark
            ~66px tall (2.5x mayor, proporción preservada). */}
        <div className="absolute" style={{ left: '851px', top: '132px' }}>
          <span
            className="block font-display italic text-white"
            style={{ fontSize: '20px', fontWeight: 500, letterSpacing: '0.01em', lineHeight: '1' }}
          >
            {t.billboard_powered_by ?? 'Powered by'}
          </span>
          <TrueOmniLogo slot="brand" className="mt-[6px] h-[32px] w-auto text-white" />
        </div>
      </div>
    </div>
  );
}
