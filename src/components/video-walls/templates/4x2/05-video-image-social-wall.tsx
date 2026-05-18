'use client';

import { resolveAssetUrl, SocialCardSvg, SocialGradientDefs } from '../_shared/_card-svg';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 4×2 `05-video-image-social-wall` — pixel-perfect XD
 * `4x2/Slide 5 - 4x2 Image + Social.svg`.
 *
 * Layout verbatim XD (cada sidebar):
 *   - Row 0 (y=336): 3 cards LARGE 640×744  (x=0/640/1280).
 *   - Row 1 (y=1080): 4 cards SMALL 480×540 (x=0/480/960/1440).
 *   - Row 2 (y=1620): 4 cards SMALL 480×540 (x=0/480/960/1440).
 *   - 11 cards únicos por sidebar (mirror izq=der).
 *
 * Video centro x=1920 y=335 w=3840 h=1825 (cols 1-2).
 */
const VIDEO_X = 1920;
const VIDEO_Y = 335;
const VIDEO_W = 3840;
const VIDEO_H = 1825;
const LARGE_W = 640;
const LARGE_H = 744;
const SMALL_W = 480;
const SMALL_H = 540;
const ROW0_Y = 336;
const ROW1_Y = 1080;
const ROW2_Y = 1620;
const LEFT_X = 0;
const RIGHT_X = 5760;

function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const videoMod = findSlot(slots, 'video');
  const videoUrl =
    videoMod?.kind === 'video-image' ? resolveAssetUrl(client.slug, videoMod.asset.url) : null;
  const isVideo = videoMod?.kind === 'video-image' && videoMod.asset.kind === 'video';

  const socialMod = findSlot(slots, 'social');
  const maxPosts = socialMod?.kind === 'social' ? socialMod.maxPosts : 11;
  const posts = (client.social?.posts ?? []).slice(0, Math.min(maxPosts, 11));

  const sides: { x: number; key: 'l' | 'r' }[] = [
    { x: LEFT_X, key: 'l' },
    { x: RIGHT_X, key: 'r' },
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

        {/* Video centro (cols 1-2) */}
        <g transform={`translate(${VIDEO_X} ${VIDEO_Y})`}>
          <rect width={VIDEO_W} height={VIDEO_H} fill="#000" />
          {videoUrl && !isVideo ? (
            <image
              href={videoUrl}
              x="0"
              y="0"
              width={VIDEO_W}
              height={VIDEO_H}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : null}
        </g>

        {sides.flatMap((s) => [
          /* Row 0: 3 large cards 640×744 */
          ...[0, 1, 2].map((i) => (
            <SocialCardSvg
              key={`${s.key}-r0-${i}`}
              x={s.x + i * LARGE_W}
              y={ROW0_Y}
              w={LARGE_W}
              h={LARGE_H}
              post={posts[i] ?? null}
              clientSlug={client.slug}
              largeUsername
            />
          )),
          /* Row 1: 4 small cards 480×540 */
          ...[0, 1, 2, 3].map((i) => (
            <SocialCardSvg
              key={`${s.key}-r1-${i}`}
              x={s.x + i * SMALL_W}
              y={ROW1_Y}
              w={SMALL_W}
              h={SMALL_H}
              post={posts[3 + i] ?? null}
              clientSlug={client.slug}
              largeUsername={false}
            />
          )),
          /* Row 2: 4 small cards 480×540 */
          ...[0, 1, 2, 3].map((i) => (
            <SocialCardSvg
              key={`${s.key}-r2-${i}`}
              x={s.x + i * SMALL_W}
              y={ROW2_Y}
              w={SMALL_W}
              h={SMALL_H}
              post={posts[7 + i] ?? null}
              clientSlug={client.slug}
              largeUsername={false}
            />
          )),
        ])}

        {/* Play icon centrado sobre video */}
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
            left: VIDEO_X,
            top: VIDEO_Y,
            width: VIDEO_W,
            height: VIDEO_H,
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
