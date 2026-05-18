'use client';

import { resolveAssetUrl, SocialCardSvg, SocialGradientDefs } from '../_shared/_card-svg';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/** Template 4×2 `05-video-image-social-wall` — XD Slide 5. SIMÉTRICO:
 *  Social 2×4 grid en col 0 + Video centro + Social 2×4 grid en col 3
 *  (mirror). 8 posts únicos espejados a ambos lados. */
const BODY_Y = 335;
const BODY_H = 1825;
const SIDEBAR_W = 1920;
const SOCIAL_COLS = 2;
const SOCIAL_ROWS = 4;
const TILE_W = SIDEBAR_W / SOCIAL_COLS; // 960
const TILE_H = BODY_H / SOCIAL_ROWS; // ~456

function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const videoMod = findSlot(slots, 'video');
  const videoUrl =
    videoMod?.kind === 'video-image' ? resolveAssetUrl(client.slug, videoMod.asset.url) : null;
  const isVideo = videoMod?.kind === 'video-image' && videoMod.asset.kind === 'video';

  const socialMod = findSlot(slots, 'social');
  const maxPosts = socialMod?.kind === 'social' ? socialMod.maxPosts : 8;
  const posts = (client.social?.posts ?? []).slice(0, Math.min(maxPosts, 8));

  const sides: { x: number; key: 'l' | 'r' }[] = [
    { x: 0, key: 'l' },
    { x: 5760, key: 'r' },
  ];

  return (
    <>
      <svg
        className="absolute inset-0"
        width="7680"
        height="2160"
        viewBox="0 0 7680 2160"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <SocialGradientDefs />
        <rect width="7680" height="2160" fill="#000" />
        <g transform="translate(1920 335)">
          <rect width="3840" height="1825" fill="#000" />
          {videoUrl && !isVideo ? (
            <image
              href={videoUrl}
              x="0"
              y="0"
              width="3840"
              height="1825"
              preserveAspectRatio="xMidYMid slice"
            />
          ) : null}
        </g>
        {sides.flatMap((s) =>
          Array.from({ length: SOCIAL_COLS * SOCIAL_ROWS }).map((_, i) => {
            const c = i % SOCIAL_COLS;
            const r = Math.floor(i / SOCIAL_COLS);
            return (
              <SocialCardSvg
                key={`${s.key}-${i}`}
                x={s.x + c * TILE_W}
                y={BODY_Y + r * TILE_H}
                w={TILE_W}
                h={TILE_H}
                post={posts[i] ?? null}
                clientSlug={client.slug}
                largeUsername={false}
              />
            );
          }),
        )}
        <g transform="translate(3684 1092)">
          <path
            d="M156,312C69.981,312,0,242.018,0,156S69.981,0,156,0,312,69.981,312,156,242.018,312,156,312ZM115.3,88.173V223.825L230.607,156Z"
            fill="#fff"
            opacity="0.8"
          />
        </g>
      </svg>
      {videoUrl && isVideo ? (
        <video
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            left: 1920,
            top: 335,
            width: 3840,
            height: 1825,
            objectFit: 'cover',
          }}
        />
      ) : null}
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '05-video-image-social-wall',
  label: '05 · Video + Social Wall',
  category: 'composed',
  grid: '4x2',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      cellRect: { row: 0, col: 1, rowSpan: 2, colSpan: 2 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'social',
      kind: 'sidebar',
      cellRect: { row: 0, col: 0, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
