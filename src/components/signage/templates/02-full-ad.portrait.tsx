import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `02-full-ad` — portrait 1080×1920.
 *
 * Replica `designs/signage/portrait/02-full-ad.svg`. Body region `Right_Vertical_Add`
 * — un único rect 1080×1765 con fill="url(#pattern)" en transform translate(0 155).
 * El pattern fuente del SVG tiene viewBox `0 0 800 1114` con preserveAspectRatio
 * xMidYMid slice, así que conservamos esos dims para que la image del cliente
 * se framee igual que el XD original.
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
  return `/signage-assets/${clientSlug}/assets/ads/full-ad.png`;
}

function Render({ client, slots }: SignageTemplateRenderProps) {
  const adUrl = getAssetUrl(client.slug, slots);

  return (
    <svg
      viewBox="0 155 1080 1765"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="block"
    >
      <defs>
        {/* El SVG XD usa una image base 800×1114 portrait pero el ad del
            cliente puede subir cualquier aspect. preserveAspectRatio del
            pattern usa "100% 100%" para que la image SIEMPRE llene el rect
            (cover-style con slice). El image dentro del pattern también
            usa xMidYMid slice para centrar + recortar excedentes. */}
        <pattern
          id="ad-fullbleed-portrait"
          patternUnits="objectBoundingBox"
          preserveAspectRatio="xMidYMid slice"
          width="1"
          height="1"
        >
          <image preserveAspectRatio="xMidYMid slice" width="1080" height="1765" href={adUrl} />
        </pattern>
      </defs>

      {/* Right_Vertical_Add transform(0 155) — body 1080×1765 portrait */}
      <g transform="translate(0 155)">
        <rect width="1080" height="1765" fill="url(#ad-fullbleed-portrait)" />
      </g>
    </svg>
  );
}

const FullAdPortraitTemplate: SignageTemplate = {
  id: '02-full-ad',
  orientation: 'portrait',
  label: 'Full Ad (Portrait)',
  category: 'fullscreen',
  slots: [
    {
      key: 'main',
      kind: 'fullscreen',
      rect: { x: 0, y: 0, w: 1080, h: 1765 },
      acceptedModules: ['ads'],
    },
  ],
  Render,
};

registerTemplate(FullAdPortraitTemplate);

export default FullAdPortraitTemplate;
