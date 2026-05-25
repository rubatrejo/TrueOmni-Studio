'use client';

import { resolveAssetUrl, SocialCardSvg, SocialGradientDefs } from '../_shared/_card-svg';
import { BrandVideoFallback } from '../_shared/brand-video-fallback';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 2×2 `06-video-image-ad-social-wall` — pixel-perfect XD
 * `2x2/Slide 6 - 2x2 Video-Image + Ad + Social Wall.svg`.
 *
 * Layout verbatim XD (canvas 3840×2160):
 *   - Header full width y=0..335.
 *   - Ad col 0 top:     x=0 y=335 w=1916 h=750 (banner horizontal).
 *   - Video col 0 bot:  x=0 y=1080 w=1920 h=1080.
 *   - Social col 1 full body (mismo layout que slide 5):
 *       · Row 0 (y=336):  3 cards LARGE 640×744 (x=1920/2560/3200).
 *       · Row 1 (y=1080): 3 cards SMALL 640×540 (x=1920/2560/3200).
 *       · Row 2 (y=1620): 3 cards SMALL 640×540 (x=1920/2560/3200).
 */
const AD_X = 0;
const AD_Y = 335;
const AD_W = 1916;
const AD_H = 750;
const VIDEO_X = 0;
const VIDEO_Y = 1080;
const VIDEO_W = 1920;
const VIDEO_H = 1080;
const SOCIAL_X = 1920;
const LARGE_W = 640;
const LARGE_H = 744;
const SMALL_W = 640;
const SMALL_H = 540;
const ROW0_Y = 336;
const ROW1_Y = 1080;
const ROW2_Y = 1620;

function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const videoMod = findSlot(slots, 'video');
  const adMod = findSlot(slots, 'ad');
  const socialMod = findSlot(slots, 'social');

  const videoUrl =
    videoMod?.kind === 'video-image' ? resolveAssetUrl(client.slug, videoMod.asset.url) : null;
  const isVideo = videoMod?.kind === 'video-image' && videoMod.asset.kind === 'video';
  const adUrl = adMod?.kind === 'ads' ? resolveAssetUrl(client.slug, adMod.asset.url) : null;
  const adIsVideo = adMod?.kind === 'ads' && adMod.asset.kind === 'video';

  const maxPosts = socialMod?.kind === 'social' ? socialMod.maxPosts : 9;
  const posts = (client.social?.posts ?? []).slice(0, Math.min(maxPosts, 9));

  return (
    <>
      <svg
        className="absolute inset-0"
        width="3840"
        height="2160"
        viewBox="0 0 3840 2160"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <SocialGradientDefs />
        <rect width="3840" height="2160" fill="#000" />

        {/* Ad banner col 0 top */}
        <g transform={`translate(${AD_X} ${AD_Y})`}>
          <rect width={AD_W} height={AD_H} fill="#0a0a0a" />
          {adUrl && !adIsVideo ? (
            <image
              href={adUrl}
              x="0"
              y="0"
              width={AD_W}
              height={AD_H}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : null}
        </g>

        {/* Video col 0 bot */}
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

        {/* Social col 1 — Row 0: 3 large cards 640×744 */}
        {[0, 1, 2].map((i) => (
          <SocialCardSvg
            key={`r0-${i}`}
            x={SOCIAL_X + i * LARGE_W}
            y={ROW0_Y}
            w={LARGE_W}
            h={LARGE_H}
            post={posts[i] ?? null}
            clientSlug={client.slug}
            largeUsername
          />
        ))}
        {/* Row 1: 3 small cards 640×540 */}
        {[0, 1, 2].map((i) => (
          <SocialCardSvg
            key={`r1-${i}`}
            x={SOCIAL_X + i * SMALL_W}
            y={ROW1_Y}
            w={SMALL_W}
            h={SMALL_H}
            post={posts[3 + i] ?? null}
            clientSlug={client.slug}
            largeUsername={false}
          />
        ))}
        {/* Row 2: 3 small cards 640×540 */}
        {[0, 1, 2].map((i) => (
          <SocialCardSvg
            key={`r2-${i}`}
            x={SOCIAL_X + i * SMALL_W}
            y={ROW2_Y}
            w={SMALL_W}
            h={SMALL_H}
            post={posts[6 + i] ?? null}
            clientSlug={client.slug}
            largeUsername={false}
          />
        ))}

        {/* Play icon centrado en video col 0 bot (y=1080..2160 → mid 1620) */}
        <g transform="translate(804 1464)">
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
      {!videoUrl ? (
        <BrandVideoFallback
          brandVideo={client.branding.brandVideo}
          rect={{ left: VIDEO_X, top: VIDEO_Y, width: VIDEO_W, height: VIDEO_H }}
        />
      ) : null}

      {adUrl && adIsVideo ? (
        <video
          src={adUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            left: AD_X,
            top: AD_Y,
            width: AD_W,
            height: AD_H,
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
  grid: '2x2',
  slots: [
    {
      key: 'ad',
      kind: 'sidebar',
      cellRect: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['ads'],
    },
    {
      key: 'video',
      kind: 'hero',
      cellRect: { row: 1, col: 0, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'social',
      kind: 'sidebar',
      cellRect: { row: 0, col: 1, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
