'use client';

import { resolveAssetUrl, SocialCardSvg, SocialGradientDefs } from '../_shared/_card-svg';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 3×2 `06-video-image-ad-social-wall` — pixel-perfect contra
 * `designs/video-walls/3x2/3x2 Video-Image + Ad + Social Wall.svg`.
 *
 * Composición XD verbatim:
 *   - Splash-Background-2 translate(0 335) 3840×1825 video/image bg.
 *   - Play_Icon translate(1766 1092).
 *   - Video_Wall_Add_Horizontal translate(3844 330) 1916×750 ad horizontal.
 *   - Splash-Social-Listing translate(3840 1080) — grid 4×2 de 480×540:
 *       Row 1 y=1080..1620: 4 cards 480×540 a x=3840/4320/4800/5280.
 *       Row 2 y=1620..2160: 4 cards 480×540 a x=3840/4320/4800/5280.
 */

const COL3_X = 3840;
const CARD_W = 480;
const CARD_H = 540;
const ROW1_Y = 1080;
const ROW2_Y = 1620;

function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const videoMod = findSlot(slots, 'video');
  const videoUrl =
    videoMod?.kind === 'video-image' ? resolveAssetUrl(client.slug, videoMod.asset.url) : null;
  const isVideo = videoMod?.kind === 'video-image' && videoMod.asset.kind === 'video';

  const adMod = findSlot(slots, 'ad');
  const adUrl = adMod?.kind === 'ads' ? resolveAssetUrl(client.slug, adMod.asset.url) : null;
  const isAdVideo = adMod?.kind === 'ads' && adMod.asset.kind === 'video';

  const socialMod = findSlot(slots, 'social');
  const maxPosts = socialMod?.kind === 'social' ? socialMod.maxPosts : 8;
  const posts = (client.social?.posts ?? []).slice(0, Math.min(maxPosts, 8));

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

        {/* Ad horizontal translate(3844 330) — 1916×750 */}
        <g transform="translate(3844 330)">
          <rect width="1916" height="750" fill="#000" />
          {adUrl && !isAdVideo ? (
            <image
              href={adUrl}
              x="0"
              y="0"
              width="1916"
              height="750"
              preserveAspectRatio="xMidYMid slice"
            />
          ) : null}
        </g>

        {/* Social grid 4×2: row 1 */}
        {[0, 1, 2, 3].map((i) => (
          <SocialCardSvg
            key={`r1-${i}`}
            x={COL3_X + i * CARD_W}
            y={ROW1_Y}
            w={CARD_W}
            h={CARD_H}
            post={posts[i] ?? null}
            clientSlug={client.slug}
            largeUsername={false}
          />
        ))}

        {/* Social grid 4×2: row 2 */}
        {[0, 1, 2, 3].map((i) => (
          <SocialCardSvg
            key={`r2-${i}`}
            x={COL3_X + i * CARD_W}
            y={ROW2_Y}
            w={CARD_W}
            h={CARD_H}
            post={posts[4 + i] ?? null}
            clientSlug={client.slug}
            largeUsername={false}
          />
        ))}

        {/* Play Icon translate(1766 1092) — verbatim XD */}
        <g transform="translate(1766 1092)">
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
      {adUrl && isAdVideo ? (
        <video
          src={adUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            left: 3844,
            top: 330,
            width: 1916,
            height: 750,
            objectFit: 'cover',
          }}
        />
      ) : null}
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '06-video-image-ad-social-wall',
  label: '06 · Video + Ad + Social Wall',
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
      key: 'ad',
      kind: 'tile',
      cellRect: { row: 0, col: 2, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['ads'],
    },
    {
      key: 'social',
      kind: 'tile',
      cellRect: { row: 1, col: 2, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
