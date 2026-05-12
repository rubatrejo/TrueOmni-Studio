import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `05-video-2ads` — portrait 1080×1920.
 *
 * Replica `designs/signage/portrait/05-video-2ads.svg`. Layout verbatim:
 *  - Video at translate(-238 155) — rect 1556×875 fill pattern (16:9 video
 *    centrado en canvas portrait con offset horizontal -238).
 *    Play_Icon at translate(703 363) dentro de Video → net (465, 518).
 *  - Bottom_Horizontal_Add (small ad strip) at translate(0 1031) — rect 1080×281.
 *  - Display_Full_Add (vertical Travelife) at translate(0 1312) — rect 1080×608.
 *
 * 155 (header) + 875 + 281 + 608 = 1919 ≈ 1920 (1px de rounding del SVG).
 */

function urlOr(clientSlug: string, raw: string | undefined, fallback: string): string {
  const u = raw && raw.length > 0 ? raw : fallback;
  return u.startsWith('/') || u.startsWith('http') ? u : `/signage-assets/${clientSlug}/${u}`;
}

function Render({ client, slots }: SignageTemplateRenderProps) {
  const videoMod = slots.find((s) => s.module.kind === 'video-image');
  const adMods = slots.filter((s) => s.module.kind === 'ads');
  const videoUrl = urlOr(
    client.slug,
    videoMod && videoMod.module.kind === 'video-image' ? videoMod.module.asset.url : undefined,
    'assets/video-image/pool.png',
  );
  const ad1Url = urlOr(
    client.slug,
    adMods[0] && adMods[0].module.kind === 'ads' ? adMods[0].module.asset.url : undefined,
    'assets/ads/full-ad.png',
  );
  const ad2Url = urlOr(
    client.slug,
    adMods[1] && adMods[1].module.kind === 'ads'
      ? adMods[1].module.asset.url
      : adMods[0] && adMods[0].module.kind === 'ads'
        ? adMods[0].module.asset.url
        : undefined,
    'assets/ads/full-ad.png',
  );

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
        <pattern
          id="p05-video"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          viewBox="0 0 1280 720"
        >
          <image width="1280" height="720" href={videoUrl} />
        </pattern>
        {/* Pattern objectBoundingBox + xMidYMid slice: la image siempre
            llena el rect destino respetando aspect ratio. */}
        <pattern
          id="p05-ad1"
          patternUnits="objectBoundingBox"
          preserveAspectRatio="xMidYMid slice"
          width="1"
          height="1"
        >
          <image preserveAspectRatio="xMidYMid slice" width="1080" height="281" href={ad1Url} />
        </pattern>
        <pattern
          id="p05-ad2"
          patternUnits="objectBoundingBox"
          preserveAspectRatio="xMidYMid slice"
          width="1"
          height="1"
        >
          <image preserveAspectRatio="xMidYMid slice" width="1080" height="608" href={ad2Url} />
        </pattern>
      </defs>

      {/* Video translate(-238 155) rect 1556×875 */}
      <g transform="translate(-238 155)">
        <rect width="1556" height="875" fill="url(#p05-video)" />
        <g transform="translate(703 363)">
          <path
            d="M75,150a75,75,0,1,1,75-75A75.085,75.085,0,0,1,75,150ZM55.434,42.391v65.217L110.869,75Z"
            fill="hsl(var(--signage-text-on-brand))"
            opacity="0.8"
          />
        </g>
      </g>

      {/* Bottom_Horizontal_Add translate(0 1031) rect 1080×281 */}
      <g transform="translate(0 1031)">
        <rect width="1080" height="281" fill="url(#p05-ad1)" />
      </g>

      {/* Display_Full_Add translate(0 1312) rect 1080×608 */}
      <g transform="translate(0 1312)">
        <rect width="1080" height="608" fill="url(#p05-ad2)" />
      </g>
    </svg>
  );
}

const Video2AdsPortraitTemplate: SignageTemplate = {
  id: '05-video-2ads',
  orientation: 'portrait',
  label: 'Video + 2 Ads (Portrait)',
  category: 'composed',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      rect: { x: 0, y: 0, w: 1080, h: 875 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'ad-1',
      kind: 'strip',
      rect: { x: 0, y: 875, w: 1080, h: 281 },
      acceptedModules: ['ads'],
    },
    {
      key: 'ad-2',
      kind: 'strip',
      rect: { x: 0, y: 1156, w: 1080, h: 608 },
      acceptedModules: ['ads'],
    },
  ],
  Render,
};

registerTemplate(Video2AdsPortraitTemplate);

export default Video2AdsPortraitTemplate;
