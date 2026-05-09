import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `08-video-social` — composed 2-zone:
 *  - Left: Video/Image (1144×925) full body height
 *  - Right: Social Wall 3×3 grid (9 tiles 258×308)
 *
 * Replica `designs/signage/08-video-social.svg` con la misma decisión de
 * diseño que DS9 (3×3 grid en lugar de 6+tweet del SVG fuente). Reusa los
 * assets ya extraídos en DS5 (pool.png) y DS9 (9 posts).
 */

const POST_NATURAL_DIMS: Array<{ w: number; h: number }> = [
  { w: 3648, h: 5472 },
  { w: 5464, h: 8192 },
  { w: 4507, h: 5634 },
  { w: 2448, h: 3264 },
  { w: 5304, h: 7952 },
  { w: 3268, h: 4085 },
  { w: 4000, h: 2828 },
  { w: 4000, h: 2659 },
  { w: 4000, h: 2247 },
];

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
      <rect width="258" height="154" transform="translate(0 154)" fill="url(#vs-overlay)" />
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

function Render({ client, slots }: SignageTemplateRenderProps) {
  const videoUrl = getVideoUrl(client.slug, slots);
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
        <clipPath id="vs-clip-video">
          <rect width="1144" height="925" />
        </clipPath>
        <pattern
          id="vs-video"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          viewBox="0 0 1280 720"
        >
          <image width="1280" height="720" href={videoUrl} />
        </pattern>
        {postUrls.map((url, i) => {
          const dims = POST_NATURAL_DIMS[i] ?? { w: 258, h: 308 };
          return (
            <pattern
              key={`vs-post-${i}`}
              id={`vs-post-${i + 1}`}
              preserveAspectRatio="xMidYMid slice"
              width="100%"
              height="100%"
              viewBox={`0 0 ${dims.w} ${dims.h}`}
            >
              <image width={dims.w} height={dims.h} href={url} />
            </pattern>
          );
        })}
        <linearGradient id="vs-overlay" x1="0.5" x2="0.5" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="hsl(var(--signage-brand-primary))" stopOpacity="0" />
          <stop offset="1" stopColor="hsl(var(--signage-brand-primary))" />
        </linearGradient>
      </defs>

      {/* Video — translate(0 155). El SVG fuente tenía rect 1644×925 con
          translate(-209) para crop centrado dentro del clip 1144×925. Aquí
          simplificamos: rect 1144×925 directo (sin translate negativo) ya que
          la pattern hace xMidYMid slice y centra correctamente. */}
      <g transform="translate(0 155)" clipPath="url(#vs-clip-video)">
        <rect width="1144" height="925" fill="url(#vs-video)" />
        <PlayIconOverlay x={497} y={387} />
      </g>

      {/* Splash-Social-Listing — translate(1143.992 155), 9 tiles 3×3 */}
      <g transform="translate(1143.992 155)">
        {GRID_POSITIONS.map((pos, i) => (
          <SocialTile
            key={`tile-${i}`}
            x={pos.x}
            y={pos.y}
            patternId={`vs-post-${i + 1}`}
            username={posts[i]?.author ?? '@username'}
          />
        ))}
      </g>
    </svg>
  );
}

const VideoSocialTemplate: SignageTemplate = {
  id: '08-video-social',
  label: 'Video + Social',
  category: 'composed',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      rect: { x: 0, y: 0, w: 1144, h: 925 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'social',
      kind: 'sidebar',
      rect: { x: 1144, y: 0, w: 776, h: 925 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(VideoSocialTemplate);

export default VideoSocialTemplate;
