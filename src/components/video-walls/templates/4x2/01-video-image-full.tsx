'use client';

import { resolveAssetUrl } from '../_shared/_card-svg';
import { BrandVideoFallback } from '../_shared/brand-video-fallback';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 4×2 `01-video-image-full` — pixel-perfect XD `4x2/Slide 1`.
 * Canvas 7680×2160. Hero full-bleed bajo header (HEADER_H=335).
 */
function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const m = findSlot(slots, 'main');
  const url = m?.kind === 'video-image' ? resolveAssetUrl(client.slug, m.asset.url) : null;
  const isVideo = m?.kind === 'video-image' && m.asset.kind === 'video';

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
        <rect width="7680" height="2160" fill="#000" />
        {url && !isVideo ? (
          <image
            href={url}
            x="0"
            y="335"
            width="7680"
            height="1825"
            preserveAspectRatio="xMidYMid slice"
          />
        ) : null}
        {/* Play icon centrado en el body (y=335..2160) */}
        <g transform="translate(3684 1092)">
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
            left: 0,
            top: 335,
            width: 7680,
            height: 1825,
            objectFit: 'cover',
          }}
        />
      ) : null}
      {!url ? (
        <BrandVideoFallback
          brandVideo={client.branding.brandVideo}
          rect={{ left: 0, top: 335, width: 7680, height: 1825 }}
        />
      ) : null}
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '01-video-image-full',
  label: '01 · Full Video / Image',
  category: 'fullscreen',
  grid: '4x2',
  slots: [
    {
      key: 'main',
      kind: 'fullscreen',
      cellRect: { row: 0, col: 0, rowSpan: 2, colSpan: 4 },
      acceptedModules: ['video-image'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
