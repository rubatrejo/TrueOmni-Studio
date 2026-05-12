import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `02-full-ad` — anuncio fullscreen 1920×925.
 *
 * Replica `designs/signage/02-full-ad.svg`. El cliente sube su anuncio como
 * un único asset (PNG/JPG/video) que ocupa toda la body region. La imagen
 * del default cliente fue extraída del SVG fuente (1398×782 PNG) y se sirve
 * vía `/signage-assets/<slug>/assets/ads/full-ad.png`.
 *
 * Para overrides per-slide (cuando un Ads module en un slot tenga su propio
 * asset configurado) usar `slots[0].module.asset.url`. DS4 lo cablea como
 * fallback opcional manteniendo el default del cliente como base.
 */

function getAssetUrl(clientSlug: string, slots: SignageTemplateRenderProps['slots']): string {
  const adsModule = slots.find((s) => s.module.kind === 'ads');
  if (adsModule && adsModule.module.kind === 'ads' && adsModule.module.asset.url) {
    const url = adsModule.module.asset.url;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
      return url;
    }
    return `/signage-assets/${clientSlug}/${url}`;
  }
  // Fallback: ad por defecto del cliente.
  return `/signage-assets/${clientSlug}/assets/ads/full-ad.png`;
}

function Render({ client, slots }: SignageTemplateRenderProps) {
  const adUrl = getAssetUrl(client.slug, slots);

  return (
    <svg
      viewBox="0 155 1920 925"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="block"
    >
      <defs>
        {/*
          Pattern verbatim del SVG fuente: width=1 height=1, viewBox crops
          y desde 94.785 a una imagen 1920×1073.991 con preserveAspectRatio
          xMidYMid slice. Esto preserva el framing original del XD.
        */}
        <pattern id="ad-fullbleed" width="1" height="1" viewBox="0 94.785 1920 925">
          <image preserveAspectRatio="xMidYMid slice" width="1920" height="1073.991" href={adUrl} />
        </pattern>
      </defs>

      {/* Display_Full_Add translate(0 155) — body region */}
      <g transform="translate(0 155)">
        <rect width="1920" height="925" fill="url(#ad-fullbleed)" />
      </g>
    </svg>
  );
}

const FullAdTemplate: SignageTemplate = {
  id: '02-full-ad',
  orientation: 'landscape',
  label: 'Full Ad',
  category: 'fullscreen',
  slots: [
    {
      key: 'main',
      kind: 'fullscreen',
      rect: { x: 0, y: 0, w: 1920, h: 925 },
      acceptedModules: ['ads'],
    },
  ],
  Render,
};

registerTemplate(FullAdTemplate);

export default FullAdTemplate;
