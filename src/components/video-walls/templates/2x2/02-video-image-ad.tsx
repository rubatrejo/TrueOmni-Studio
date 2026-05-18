'use client';

import { resolveAssetUrl } from '../_shared/_card-svg';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 2×2 `02-video-image-ad` — pixel-perfect XD
 * `2x2/Slide 2 - 2x2 Video-Image + Ad.svg`.
 *
 * Layout verbatim XD (canvas 3840×2160):
 *   - Header full width y=0..335.
 *   - Video col 0: x=0 y=335 w=1920 h=1825.
 *   - Ad BIG SQUARE col 1: x=1920 y=335 w=1920 h=1825.
 *
 * Antes era `02-quad-mix` (4 tiles mezclados). El XD del wall 2×2
 * Slide 2 es un ad de tipo "Big Square" (no banner horizontal) que
 * cubre toda la columna derecha.
 */
const VIDEO_X = 0;
const VIDEO_Y = 335;
const VIDEO_W = 1920;
const VIDEO_H = 1825;
const AD_X = 1920;
const AD_Y = 335;
const AD_W = 1920;
const AD_H = 1825;

function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const videoMod = findSlot(slots, 'video');
  const adMod = findSlot(slots, 'ad');

  const videoUrl =
    videoMod?.kind === 'video-image' ? resolveAssetUrl(client.slug, videoMod.asset.url) : null;
  const isVideo = videoMod?.kind === 'video-image' && videoMod.asset.kind === 'video';
  const adUrl = adMod?.kind === 'ads' ? resolveAssetUrl(client.slug, adMod.asset.url) : null;
  const adIsVideo = adMod?.kind === 'ads' && adMod.asset.kind === 'video';

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
        <rect width="3840" height="2160" fill="#000" />

        {/* Video col 0 */}
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

        {/* Ad Big Square col 1 */}
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

        {/* Play icon centrado en video col 0 — XD verbatim translate(804 1092) */}
        <g transform="translate(804 1092)">
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
  id: '02-video-image-ad',
  label: '02 · Video + Ad',
  category: 'composed',
  grid: '2x2',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      cellRect: { row: 0, col: 0, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'ad',
      kind: 'sidebar',
      cellRect: { row: 0, col: 1, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['ads'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
