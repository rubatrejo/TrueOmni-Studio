import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `08-video-social` — portrait 1080×1920.
 *
 * Replica `designs/signage/portrait/08-video-social.svg`. Layout verbatim:
 *  - Video at translate(0 155) — rect 1080×608 fill pattern viewBox 1280×720.
 *    Play_Icon at translate(465 267) dentro de Video (net 465, 422).
 *  - Splash-Social-Listing at translate(0 763) — 3×3 grid de social posts:
 *    cells at (0|360|721.111, 0|386|771) con dimensiones 359-360 wide × 385-386 tall.
 *    Cada cell: image rect 360×386 fill pattern + bottom gradient rect 360×193
 *    fill linear-gradient (oscurece la mitad inferior para legibilidad del @username).
 */

function urlOr(clientSlug: string, raw: string | undefined, fallback: string): string {
  const u = raw && raw.length > 0 ? raw : fallback;
  return u.startsWith('/') || u.startsWith('http') ? u : `/signage-assets/${clientSlug}/${u}`;
}

interface SocialPostLike {
  author: string;
  image?: string;
}

function Render({ client, slots }: SignageTemplateRenderProps) {
  const videoMod = slots.find((s) => s.module.kind === 'video-image');
  const videoUrl = urlOr(
    client.slug,
    videoMod && videoMod.module.kind === 'video-image' ? videoMod.module.asset.url : undefined,
    'assets/video-image/pool.png',
  );
  const socialData = client.social as { posts?: SocialPostLike[] } | undefined;
  const posts: SocialPostLike[] = socialData?.posts ?? [];
  const slotPosts: (SocialPostLike | null)[] = Array.from(
    { length: 9 },
    (_, i) => posts[i] ?? null,
  );

  // Grid coords verbatim del SVG.
  const COL_X = [0, 360, 721.111];
  const ROW_Y = [0, 386, 771];

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
          id="p08-video"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          viewBox="0 0 1280 720"
        >
          <image width="1280" height="720" href={videoUrl} />
        </pattern>
        <linearGradient id="p08-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(0,0,0)" stopOpacity="0" />
          <stop offset="100%" stopColor="rgb(0,0,0)" stopOpacity="0.65" />
        </linearGradient>
        {slotPosts.map((p, i) =>
          p ? (
            <pattern key={i} id={`p08-social-${i}`} width="1" height="1" viewBox="0 0 360 386">
              <image
                preserveAspectRatio="xMidYMid slice"
                width="360"
                height="386"
                href={urlOr(client.slug, p.image, 'assets/social/placeholder.jpg')}
              />
            </pattern>
          ) : null,
        )}
      </defs>

      {/* Video translate(0 155) 1080×608 */}
      <g transform="translate(0 155)">
        <rect width="1080" height="608" fill="url(#p08-video)" />
        <g transform="translate(465 267)">
          <path
            d="M75,150a75,75,0,1,1,75-75A75.085,75.085,0,0,1,75,150ZM55.434,42.391v65.217L110.869,75Z"
            fill="#fff"
            opacity="0.8"
          />
        </g>
      </g>

      {/* Splash-Social-Listing translate(0 763) */}
      <g transform="translate(0 763)">
        {slotPosts.map((p, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          return (
            <SocialTile
              key={i}
              x={COL_X[col]}
              y={ROW_Y[row]}
              post={p}
              patternId={p ? `p08-social-${i}` : null}
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
  // Cada tile del SVG: image rect 360×386 + gradient rect 360×193 at translate(0 193).
  return (
    <g transform={`translate(${x} ${y})`}>
      {post && patternId ? (
        <>
          <rect width="360" height="386" fill={`url(#${patternId})`} />
          <rect width="360" height="193" transform="translate(0 193)" fill="url(#p08-grad)" />
          <text
            x="20"
            y="362"
            fontFamily="Open Sans, sans-serif"
            fontSize="20"
            fontWeight="600"
            fill="#fff"
          >
            {`@${post.author}`}
          </text>
        </>
      ) : (
        <rect width="360" height="386" fill="#222" />
      )}
    </g>
  );
}

const VideoSocialPortraitTemplate: SignageTemplate = {
  id: '08-video-social',
  orientation: 'portrait',
  label: 'Video + Social (Portrait)',
  category: 'composed',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      rect: { x: 0, y: 0, w: 1080, h: 608 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'social',
      kind: 'strip',
      rect: { x: 0, y: 608, w: 1080, h: 1157 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(VideoSocialPortraitTemplate);

export default VideoSocialPortraitTemplate;
