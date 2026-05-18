'use client';

import { resolveAssetUrl } from '../_shared/_card-svg';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 2×2 `01-video-image-full` — pixel-perfect XD
 * `2x2/Slide 1 - 2x2 Video-Image Full.svg`.
 *
 * Canvas 3840×2160. Header full width y=0..335 (lo pinta el
 * VideoWallHeader externo). Hero full-bleed body y=335..2160.
 */
const VIDEO_X = 0;
const VIDEO_Y = 335;
const VIDEO_W = 3840;
const VIDEO_H = 1825;

function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const m = findSlot(slots, 'main');
  const url = m?.kind === 'video-image' ? resolveAssetUrl(client.slug, m.asset.url) : null;
  const isVideo = m?.kind === 'video-image' && m.asset.kind === 'video';

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
        {url && !isVideo ? (
          <image
            href={url}
            x={VIDEO_X}
            y={VIDEO_Y}
            width={VIDEO_W}
            height={VIDEO_H}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : null}
        {/* Play icon centrado en el body (XD verbatim translate(1764 1092)) */}
        <g transform="translate(1764 1092)">
          <path
            d="M156,312C69.981,312,0,242.018,0,156S69.981,0,156,0,312,69.981,312,156,242.018,312,156,312ZM115.3,88.173V223.825L230.607,156Z"
            fill="#fff"
            opacity="0.8"
          />
        </g>
      </svg>
      {url && isVideo ? (
        <video
          src={url}
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
  id: '01-video-image-full',
  label: '01 · Full Video / Image',
  category: 'fullscreen',
  grid: '2x2',
  slots: [
    {
      key: 'main',
      kind: 'fullscreen',
      cellRect: { row: 0, col: 0, rowSpan: 2, colSpan: 2 },
      acceptedModules: ['video-image'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
