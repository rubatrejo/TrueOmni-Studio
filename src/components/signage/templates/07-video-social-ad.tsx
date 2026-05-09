import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `07-video-social-ad` — composed con módulo Social Wall:
 *  - Top-left: Video/Image (1144×644)
 *  - Right column: Social Wall 3×3 grid (9 tiles 258×308 cada uno)
 *  - Bottom-left: Bottom horizontal ad (1144×281)
 *
 * Decisión de diseño (post-DS9): el SVG fuente tenía 6 tiles + featured tweet
 * en la parte inferior derecha. Lo simplificamos a 9 tiles 3×3 a petición del
 * usuario — la carga visual es más consistente y el editor podrá decidir
 * si activa el "tweet destacado" como toggle en DSS5.
 */

const POST_NATURAL_DIMS: Array<{ w: number; h: number }> = [
  { w: 3648, h: 5472 },
  { w: 5464, h: 8192 },
  { w: 4507, h: 5634 },
  { w: 2448, h: 3264 },
  { w: 5304, h: 7952 },
  { w: 3268, h: 4085 },
  { w: 4000, h: 2828 }, // post-7 unsplash
  { w: 4000, h: 2659 }, // post-8 unsplash
  { w: 4000, h: 2247 }, // post-9 unsplash
];

function buildAssetUrl(clientSlug: string, relPath: string | undefined, fallback: string): string {
  const path = relPath ?? fallback;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/'))
    return path;
  return `/signage-assets/${clientSlug}/${path}`;
}

function getVideoUrl(clientSlug: string, slots: SignageTemplateRenderProps['slots']): string {
  const slot = slots.find((s) => s.module.kind === 'video-image');
  if (slot && slot.module.kind === 'video-image' && slot.module.asset.url) {
    return buildAssetUrl(clientSlug, slot.module.asset.url, '');
  }
  return buildAssetUrl(clientSlug, undefined, 'assets/video-image/pool.png');
}

function getAdUrl(clientSlug: string, slots: SignageTemplateRenderProps['slots']): string {
  const slot = slots.find((s) => s.slotKey === 'bottom-ad' && s.module.kind === 'ads');
  if (slot && slot.module.kind === 'ads' && slot.module.asset.url) {
    return buildAssetUrl(clientSlug, slot.module.asset.url, '');
  }
  return buildAssetUrl(clientSlug, undefined, 'assets/ads/bottom-banner.jpg');
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

// Posiciones del grid 3×3 dentro de Splash-Social-Listing (translate 1143.992 155).
// Cada tile es 258×308 con gaps de ~1px.
const GRID_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 0, y: 0 },
  { x: 259.003, y: 0 },
  { x: 518.008, y: 0 },
  { x: 0, y: 308 },
  { x: 259.003, y: 308 },
  { x: 518.007, y: 308 },
  { x: 0, y: 616 },
  { x: 259.003, y: 616 },
  { x: 518.007, y: 616 },
];

function Render({ client, slots }: SignageTemplateRenderProps) {
  const videoUrl = getVideoUrl(client.slug, slots);
  const adUrl = getAdUrl(client.slug, slots);
  const posts = client.social.posts.slice(0, 9);
  const postUrls = posts.map((p, i) =>
    buildAssetUrl(client.slug, p.image, `assets/social/post-${i + 1}.jpg`),
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
          id="vsa-video"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          viewBox="0 0 1280 720"
        >
          <image width="1280" height="720" href={videoUrl} />
        </pattern>
        <pattern id="vsa-ad" width="1" height="1" viewBox="0 22.154 1144 281">
          <image preserveAspectRatio="xMidYMid slice" width="1144" height="448.712" href={adUrl} />
        </pattern>
        {postUrls.map((url, i) => {
          const dims = POST_NATURAL_DIMS[i] ?? { w: 258, h: 308 };
          return (
            <pattern
              key={`vsa-post-${i}`}
              id={`vsa-post-${i + 1}`}
              preserveAspectRatio="xMidYMid slice"
              width="100%"
              height="100%"
              viewBox={`0 0 ${dims.w} ${dims.h}`}
            >
              <image width={dims.w} height={dims.h} href={url} />
            </pattern>
          );
        })}
        {/* Linear gradient azul brand-primary verbatim del SVG fuente. */}
        <linearGradient id="vsa-overlay" x1="0.5" x2="0.5" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="hsl(var(--signage-brand-primary))" stopOpacity="0" />
          <stop offset="1" stopColor="hsl(var(--signage-brand-primary))" />
        </linearGradient>
      </defs>

      {/* Video — translate(0 155), rect 1144×644 */}
      <g transform="translate(0 155)">
        <rect width="1144" height="644" fill="url(#vsa-video)" />
        <PlayIconOverlay x={497} y={247} />
      </g>

      {/* Bottom Ad — translate(0 799), rect 1144×281 */}
      <g transform="translate(0 799)">
        <rect width="1144" height="281" fill="url(#vsa-ad)" />
      </g>

      {/* Splash-Social-Listing 3×3 — translate(1143.992 155), 9 tiles */}
      <g transform="translate(1143.992 155)">
        {GRID_POSITIONS.map((pos, i) => (
          <SocialTile
            key={`tile-${i}`}
            x={pos.x}
            y={pos.y}
            patternId={`vsa-post-${i + 1}`}
            username={posts[i]?.author ?? '@username'}
          />
        ))}
      </g>
    </svg>
  );
}

function SocialTile({
  x,
  y,
  patternId,
  username,
}: {
  x: number;
  y: number;
  patternId: string;
  username: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="258" height="308" fill={`url(#${patternId})`} />
      <rect width="258" height="154" transform="translate(0 154)" fill="url(#vsa-overlay)" />
      <text
        transform="translate(20 282)"
        fill="hsl(var(--signage-text-on-brand))"
        fontSize="20"
        className="signage-font-body"
        fontWeight="700"
        letterSpacing="0.026em"
      >
        <tspan x="0" y="0">
          {username}
        </tspan>
      </text>
    </g>
  );
}

const VideoSocialAdTemplate: SignageTemplate = {
  id: '07-video-social-ad',
  label: 'Video + Social + Ad',
  category: 'composed',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      rect: { x: 0, y: 0, w: 1144, h: 644 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'social',
      kind: 'sidebar',
      rect: { x: 1144, y: 0, w: 776, h: 925 },
      acceptedModules: ['social'],
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

registerTemplate(VideoSocialAdTemplate);

export default VideoSocialAdTemplate;
