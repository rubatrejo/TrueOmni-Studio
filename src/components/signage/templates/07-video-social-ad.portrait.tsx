import { SignageBrandVideoOverlay } from './_shared/brand-video-overlay';
import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `07-video-social-ad` — portrait 1080×1920.
 *
 * Replica `designs/signage/portrait/07-video-social-ad.svg`. Layout verbatim:
 *  - Video at translate(-238 155) — rect 1556×875 fill pattern (centrado).
 *    Play_Icon at translate(703 363) dentro de Video → net (465, 518).
 *  - Bottom_Horizontal_Add_2 (small ad strip) at translate(0 1031) — rect 1080×281.
 *  - Splash-Social-Listing at translate(0 1312):
 *    4 cols × 2 rows = 8 social posts. Cols x: 0, 270.793, 540.529, 810.264.
 *    Rows y: 0, 304. Cada tile: image rect 270×304 + gradient overlay 270×152
 *    at translate(0 152) (oscurece bottom para @username).
 */

function urlOr(clientSlug: string, raw: string | undefined, fallback: string): string {
  const u = raw && raw.length > 0 ? raw : fallback;
  return u.startsWith('/') || u.startsWith('http') ? u : `/signage-assets/${clientSlug}/${u}`;
}

interface SocialPostLike {
  author: string;
  image?: string;
}

const COL_X = [0, 270.793, 540.529, 810.264];
const ROW_Y = [0, 304];

function Render({ client, slots }: SignageTemplateRenderProps) {
  const videoMod = slots.find((s) => s.module.kind === 'video-image');
  const hasVideoAsset = !!(
    videoMod &&
    videoMod.module.kind === 'video-image' &&
    videoMod.module.asset.url
  );
  const adMod = slots.find((s) => s.module.kind === 'ads');
  const videoUrl = urlOr(
    client.slug,
    videoMod && videoMod.module.kind === 'video-image' ? videoMod.module.asset.url : undefined,
    'assets/video-image/pool.png',
  );
  const adUrl = urlOr(
    client.slug,
    adMod && adMod.module.kind === 'ads' ? adMod.module.asset.url : undefined,
    'assets/ads/full-ad.png',
  );
  const socialData = client.social as { posts?: SocialPostLike[] } | undefined;
  const posts: SocialPostLike[] = socialData?.posts ?? [];
  const slotPosts: (SocialPostLike | null)[] = Array.from(
    { length: 8 },
    (_, i) => posts[i] ?? null,
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
          id="p07-video"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          viewBox="0 0 1280 720"
        >
          <image width="1280" height="720" href={videoUrl} />
        </pattern>
        <pattern
          id="p07-ad"
          patternUnits="objectBoundingBox"
          preserveAspectRatio="xMidYMid slice"
          width="1"
          height="1"
        >
          <image preserveAspectRatio="xMidYMid slice" width="1080" height="281" href={adUrl} />
        </pattern>
        <linearGradient id="p07-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(0,0,0)" stopOpacity="0" />
          <stop offset="100%" stopColor="rgb(0,0,0)" stopOpacity="0.65" />
        </linearGradient>
        {slotPosts.map((p, i) =>
          p ? (
            <pattern key={i} id={`p07-social-${i}`} width="1" height="1" viewBox="0 0 270 304">
              <image
                preserveAspectRatio="xMidYMid slice"
                width="270"
                height="304"
                href={urlOr(client.slug, p.image, 'assets/social/placeholder.jpg')}
              />
            </pattern>
          ) : null,
        )}
      </defs>

      {/* Video translate(-238 155) rect 1556×875 */}
      <g transform="translate(-238 155)">
        <rect width="1556" height="875" fill="url(#p07-video)" />
        {!hasVideoAsset ? (
          <SignageBrandVideoOverlay
            brandVideo={client.branding.brandVideo}
            width={1556}
            height={875}
          />
        ) : null}
        <g transform="translate(703 363)">
          <path
            d="M75,150a75,75,0,1,1,75-75A75.085,75.085,0,0,1,75,150ZM55.434,42.391v65.217L110.869,75Z"
            fill="hsl(var(--signage-text-on-brand))"
            opacity="0.8"
          />
        </g>
      </g>

      {/* Bottom_Horizontal_Add_2 translate(0 1031) rect 1080×281 */}
      <g transform="translate(0 1031)">
        <rect width="1080" height="281" fill="url(#p07-ad)" />
      </g>

      {/* Splash-Social-Listing translate(0 1312) — 4×2 grid */}
      <g transform="translate(0 1312)">
        {slotPosts.map((p, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          return (
            <SocialTile
              key={i}
              x={COL_X[col]}
              y={ROW_Y[row]}
              post={p}
              patternId={p ? `p07-social-${i}` : null}
            />
          );
        })}
      </g>
    </svg>
  );
}

function SocialTile({
  x,
  y,
  post,
  patternId,
}: {
  x: number;
  y: number;
  post: SocialPostLike | null;
  patternId: string | null;
}) {
  // Cada tile del SVG: image rect 270×304 + gradient rect 270×152 at translate(0 152).
  return (
    <g transform={`translate(${x} ${y})`}>
      {post && patternId ? (
        <>
          <rect width="270" height="304" fill={`url(#${patternId})`} />
          <rect width="270" height="152" transform="translate(0 152)" fill="url(#p07-grad)" />
          <text
            x="14"
            y="285"
            fontFamily="var(--signage-font-body, 'Open Sans')"
            fontSize="16"
            fontWeight="600"
            fill="hsl(var(--signage-text-on-brand))"
          >
            {`@${post.author}`}
          </text>
        </>
      ) : (
        <rect width="270" height="304" fill="hsl(var(--signage-stage-bg))" />
      )}
    </g>
  );
}

const VideoSocialAdPortraitTemplate: SignageTemplate = {
  id: '07-video-social-ad',
  orientation: 'portrait',
  label: 'Video + Social + Ad (Portrait)',
  category: 'composed',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      rect: { x: 0, y: 0, w: 1080, h: 875 },
      acceptedModules: ['video-image'],
    },
    { key: 'ad', kind: 'strip', rect: { x: 0, y: 875, w: 1080, h: 281 }, acceptedModules: ['ads'] },
    {
      key: 'social',
      kind: 'strip',
      rect: { x: 0, y: 1156, w: 1080, h: 608 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(VideoSocialAdPortraitTemplate);

export default VideoSocialAdPortraitTemplate;
