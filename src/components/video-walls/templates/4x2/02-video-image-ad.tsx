'use client';

import { resolveAssetUrl } from '../_shared/_card-svg';
import { BrandVideoFallback } from '../_shared/brand-video-fallback';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 4×2 `02-video-image-ad` — pixel-perfect XD `4x2/Slide 2`.
 * Video cols 0-2 (5760×1825) + Ad col 3 (1920×1825), debajo del header.
 */
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
        width="7680"
        height="2160"
        viewBox="0 0 7680 2160"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="7680" height="2160" fill="#000" />
        {/* Video cols 0-2 */}
        <g transform="translate(0 335)">
          <rect width="5760" height="1825" fill="#000" />
          {videoUrl && !isVideo ? (
            <image
              href={videoUrl}
              x="0"
              y="0"
              width="5760"
              height="1825"
              preserveAspectRatio="xMidYMid slice"
            />
          ) : null}
        </g>
        {/* Ad col 3 */}
        <g transform="translate(5760 335)">
          <rect width="1920" height="1825" fill="#0a0a0a" />
          {adUrl && !adIsVideo ? (
            <image
              href={adUrl}
              x="0"
              y="0"
              width="1920"
              height="1825"
              preserveAspectRatio="xMidYMid slice"
            />
          ) : null}
        </g>
        {/* Play icon centrado en el video block (cols 0-2 = 5760 wide) */}
        <g transform="translate(2724 1092)">
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
            width: 5760,
            height: 1825,
            objectFit: 'cover',
          }}
        />
      ) : null}
      {!videoUrl ? (
        <BrandVideoFallback
          brandVideo={client.branding.brandVideo}
          rect={{ left: 0, top: 335, width: 5760, height: 1825 }}
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
            left: 5760,
            top: 335,
            width: 1920,
            height: 1825,
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
  grid: '4x2',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      cellRect: { row: 0, col: 0, rowSpan: 2, colSpan: 3 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'ad',
      kind: 'sidebar',
      cellRect: { row: 0, col: 3, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['ads'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
