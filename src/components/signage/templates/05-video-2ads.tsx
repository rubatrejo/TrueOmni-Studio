import { SignageBrandVideoOverlay } from './_shared/brand-video-overlay';
import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `05-video-2ads` — composed 3-zone con video + 2 ads.
 *  - Top-left: Video/Image (1144×644)
 *  - Right vertical ad (776×925) — full body height
 *  - Bottom-left horizontal ad (1144×281)
 *
 * Replica `designs/signage/05-video-2ads.svg`. Reusa pool.png del módulo
 * Video. Los 2 ads son assets diferenciados:
 *  - `assets/ads/right-vertical.png` (default)
 *  - `assets/ads/bottom-banner-pizza.png` (default)
 *
 * White-label: cada ad puede ser overrideado per-slide via slots con keys
 * "right-ad" y "bottom-ad" respectivamente.
 */

function buildAssetUrl(clientSlug: string, relPath: string): string {
  if (relPath.startsWith('http://') || relPath.startsWith('https://') || relPath.startsWith('/')) {
    return relPath;
  }
  return `/signage-assets/${clientSlug}/${relPath}`;
}

function getSlotAdUrl(
  clientSlug: string,
  slots: SignageTemplateRenderProps['slots'],
  slotKey: string,
  fallback: string,
): string {
  const slot = slots.find((s) => s.slotKey === slotKey);
  if (slot && slot.module.kind === 'ads' && slot.module.asset.url) {
    return buildAssetUrl(clientSlug, slot.module.asset.url);
  }
  return buildAssetUrl(clientSlug, fallback);
}

function getVideoUrl(clientSlug: string, slots: SignageTemplateRenderProps['slots']): string {
  const slot = slots.find((s) => s.slotKey === 'video');
  if (slot && slot.module.kind === 'video-image' && slot.module.asset.url) {
    return buildAssetUrl(clientSlug, slot.module.asset.url);
  }
  return buildAssetUrl(clientSlug, 'assets/video-image/pool.png');
}

function PlayIconOverlay({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M75,150a75,75,0,1,1,75-75A75.085,75.085,0,0,1,75,150ZM55.434,42.391v65.217L110.869,75Z"
        fill="hsl(var(--signage-text-on-brand))"
        fillOpacity="0.8"
      />
    </g>
  );
}

function Render({ client, slots }: SignageTemplateRenderProps) {
  const videoUrl = getVideoUrl(client.slug, slots);
  const rightAdUrl = getSlotAdUrl(client.slug, slots, 'right-ad', 'assets/ads/right-vertical.png');
  const bottomAdUrl = getSlotAdUrl(
    client.slug,
    slots,
    'bottom-ad',
    'assets/ads/bottom-banner-pizza.png',
  );
  const videoMod = slots.find((s) => s.module.kind === 'video-image');
  const hasVideoAsset = !!(
    videoMod &&
    videoMod.module.kind === 'video-image' &&
    videoMod.module.asset.url
  );

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
        <pattern
          id="v2a-video"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          viewBox="0 0 1280 720"
        >
          <image width="1280" height="720" href={videoUrl} />
        </pattern>
        <pattern id="v2a-right" width="1" height="1" viewBox="0 135.196 776 925">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="776"
            height="1080.58"
            href={rightAdUrl}
          />
        </pattern>
        <pattern id="v2a-bottom" width="1" height="1" viewBox="0 59.607 1144 281">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="1144"
            height="344.607"
            href={bottomAdUrl}
          />
        </pattern>
      </defs>

      {/* Video — translate(0 155), rect 1144×644 */}
      <g transform="translate(0 155)">
        <rect width="1144" height="644" fill="url(#v2a-video)" />
        {!hasVideoAsset ? (
          <SignageBrandVideoOverlay
            brandVideo={client.branding.brandVideo}
            width={1144}
            height={644}
          />
        ) : null}
        <PlayIconOverlay x={497} y={247} />
      </g>

      {/* Right Vertical Add — translate(1144 155), rect 776×925 */}
      <g transform="translate(1144 155)">
        <rect width="776" height="925" fill="url(#v2a-right)" />
      </g>

      {/* Bottom Horizontal Add — translate(0 799), rect 1144×281 */}
      <g transform="translate(0 799)">
        <rect width="1144" height="281" fill="url(#v2a-bottom)" />
      </g>
    </svg>
  );
}

const Video2AdsTemplate: SignageTemplate = {
  id: '05-video-2ads',
  orientation: 'landscape',
  label: 'Video + 2 Ads',
  category: 'composed',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      rect: { x: 0, y: 0, w: 1144, h: 644 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'right-ad',
      kind: 'sidebar',
      rect: { x: 1144, y: 0, w: 776, h: 925 },
      acceptedModules: ['ads'],
    },
    {
      key: 'bottom-ad',
      kind: 'strip',
      rect: { x: 0, y: 644, w: 1144, h: 281 },
      acceptedModules: ['ads'],
    },
  ],
  Render,
};

registerTemplate(Video2AdsTemplate);

export default Video2AdsTemplate;
