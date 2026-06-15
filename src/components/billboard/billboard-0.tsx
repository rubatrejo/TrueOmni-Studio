'use client';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { LanguageDropdown } from '@/components/home/language-dropdown';
import { useTextosMap } from '@/components/i18n-provider';

import { BillboardBackground } from './billboard-background';
import { BillboardPoweredBy } from './billboard-language-slot';
import { OverlayLayer } from './billboard-overlay';
import { toTouchCase } from './touch-label';
import type { BillboardVariantProps } from './types';
import {
  BILLBOARD_LOGO_SLOT_WIDTH,
  useBillboardB0,
  useBillboardFooterLogoHeight,
  useBillboardFooterLogoPosition,
  useBillboardLogoHeight,
  useBillboardLogoPosition,
  useLanguagesEnabled,
} from './use-billboard-override';

export function Billboard0({ languagesEnabled = true }: BillboardVariantProps = {}) {
  const t = useTextosMap();
  const langEnabled = useLanguagesEnabled(languagesEnabled);
  const logoH = useBillboardLogoHeight();
  const footerLogoH = useBillboardFooterLogoHeight();
  const footerLogoPos = useBillboardFooterLogoPosition();
  const logoPos = useBillboardLogoPosition(0);
  const { background, touchHere, overlayOpacity, overlay } = useBillboardB0();
  const touchLeft = (1080 - touchHere.width) / 2;
  const touchTop = 947 - touchHere.height / 2;
  const rawLabel =
    touchHere.label.trim().length > 0 ? touchHere.label : (t.billboard_touch_here ?? 'Touch\nHere');
  const buttonLabel = toTouchCase(
    touchHere.twoLines ? rawLabel.replace(/\s+/, '\n') : rawLabel.replace(/\n+/g, ' '),
    touchHere.uppercase,
  );
  return (
    <div
      data-billboard="0"
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: '#000' }}
    >
      <BillboardBackground src={background.src} type={background.type} />

      <OverlayLayer overlayOpacity={overlayOpacity} overlay={overlay} />

      <div
        className="absolute flex items-center justify-center"
        style={{
          left: `${logoPos.x}px`,
          top: `${logoPos.y}px`,
          width: `${BILLBOARD_LOGO_SLOT_WIDTH}px`,
          height: `${logoH}px`,
        }}
      >
        <TrueOmniLogo slot="idle" className="h-full w-auto max-w-full text-white" />
      </div>

      <div
        className="absolute flex items-center justify-center"
        style={{
          left: `${touchLeft}px`,
          top: `${touchTop}px`,
          width: `${touchHere.width}px`,
          height: `${touchHere.height}px`,
          backgroundColor: '#2e2e2e',
          borderRadius: '20px',
          boxShadow: 'inset 0 0 0 10px #fff',
        }}
      >
        <p
          className="text-center font-display font-bold text-white"
          style={{
            fontSize: `${touchHere.fontSize}px`,
            lineHeight: `${Math.round(touchHere.fontSize * 1.22)}px`,
            whiteSpace: 'pre-line',
          }}
        >
          {buttonLabel}
        </p>
      </div>

      {langEnabled ? (
        <div data-billboard-no-link className="absolute" style={{ left: '418px', top: '1565px' }}>
          <LanguageDropdown />
        </div>
      ) : null}

      <div
        className="absolute left-0 right-0"
        style={{ bottom: '0', height: '218px', width: '1080px' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'hsl(var(--brand-secondary))',
            clipPath: 'polygon(1080px 0, 0 83.636px, 0 218px, 1080px 218px)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'hsl(var(--brand-primary))',
            clipPath: 'polygon(0 0, 1080px 83.636px, 1080px 218px, 0 218px)',
          }}
        />
        {/* Footer logo. Coords absolutas en canvas 1080×1920, dentro de
            este block que está anchored bottom (y=1702..1920). Convertimos
            la y absoluta a top relativo restando 1702 (offset del block). */}
        <div
          className="absolute flex items-center"
          style={{
            left: `${footerLogoPos.x}px`,
            top: `${Math.max(0, footerLogoPos.y - 1702)}px`,
            height: footerLogoH,
            width: '360px',
          }}
        >
          <TrueOmniLogo slot="footer" className="h-full w-auto max-w-full text-white" />
        </div>
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
        <div className="absolute" style={{ left: '851px', top: '132px' }}>
          <BillboardPoweredBy />
        </div>
      </div>
    </div>
  );
}
