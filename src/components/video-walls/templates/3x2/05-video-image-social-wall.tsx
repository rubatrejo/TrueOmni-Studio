'use client';

import { resolveAssetUrl, SocialCardSvg, SocialGradientDefs } from '../_shared/_card-svg';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';


/**
 * Template 3×2 `05-video-image-social-wall` — pixel-perfect contra
 * `designs/video-walls/3x2/3x2 - Video-Image + Social Wall.svg`.
 *
 * Composición XD verbatim:
 *   - Splash-Background-2 translate(0 335) 3840×1825 video/image bg.
 *   - Play_Icon translate(1764 1092).
 *   - Splash-Social-Listing translate(3840 336) — 11 social cards:
 *       Row 1 y=336..1080 (h=744): 3 cards 640×744 a x=3840/4480/5120.
 *       Row 2 y=1080..1620 (h=540): 4 cards 480×540 a x=3840/4320/4800/5280.
 *       Row 3 y=1620..2160 (h=540): 4 cards 480×540 a x=3840/4320/4800/5280.
 *   - Cada card: image bg + linearGradient overlay top transparent →
 *     bottom #004f8b + @username text fontSize 30 (row 1) o 20 (row 2/3)
 *     OpenSans-Bold #fff letter-spacing 0.026em.
 */

const COL3_X = 3840;

const ROW1_Y = 336;
const ROW1_H = 744;
const ROW1_W = 640;

const ROW23_H = 540;
const ROW23_W = 480;
const ROW2_Y = 1080;
const ROW3_Y = 1620;

function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const videoMod = findSlot(slots, 'video');
  const videoUrl =
    videoMod?.kind === 'video-image' ? resolveAssetUrl(client.slug, videoMod.asset.url) : null;
  const isVideo = videoMod?.kind === 'video-image' && videoMod.asset.kind === 'video';

  const socialMod = findSlot(slots, 'social');
  const maxPosts = socialMod?.kind === 'social' ? socialMod.maxPosts : 11;
  const posts = (client.social?.posts ?? []).slice(0, Math.min(maxPosts, 11));

  return (
    <>
      <svg
        className="absolute inset-0"
        width="5760"
        height="2160"
        viewBox="0 0 5760 2160"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <SocialGradientDefs />
        <rect width="5760" height="2160" fill="#fff" />

        {/* Splash-Background-2 translate(0 335) — 3840×1825 video/image bg */}
        <g transform="translate(0 335)">
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

        {/* Row 1 (y=336..1080): 3 cards 640×744 */}
        {[0, 1, 2].map((i) => (
          <SocialCardSvg
            key={`r1-${i}`}
            x={COL3_X + i * ROW1_W}
            y={ROW1_Y}
            w={ROW1_W}
            h={ROW1_H}
            post={posts[i] ?? null}
            clientSlug={client.slug}
            largeUsername
          />
        ))}

        {/* Row 2 (y=1080..1620): 4 cards 480×540 */}
        {[0, 1, 2, 3].map((i) => (
          <SocialCardSvg
            key={`r2-${i}`}
            x={COL3_X + i * ROW23_W}
            y={ROW2_Y}
            w={ROW23_W}
            h={ROW23_H}
            post={posts[3 + i] ?? null}
            clientSlug={client.slug}
            largeUsername={false}
          />
        ))}

        {/* Row 3 (y=1620..2160): 4 cards 480×540 */}
        {[0, 1, 2, 3].map((i) => (
          <SocialCardSvg
            key={`r3-${i}`}
            x={COL3_X + i * ROW23_W}
            y={ROW3_Y}
            w={ROW23_W}
            h={ROW23_H}
            post={posts[7 + i] ?? null}
            clientSlug={client.slug}
            largeUsername={false}
          />
        ))}

        {/* Play Icon translate(1764 1092) — verbatim XD */}
        <g transform="translate(1764 1092)">
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
            left: 0,
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
  grid: '3x2',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      cellRect: { row: 0, col: 0, rowSpan: 2, colSpan: 2 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'social',
      kind: 'sidebar',
      cellRect: { row: 0, col: 2, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
