'use client';

import { BrandVideoFallback } from '../_shared/brand-video-fallback';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 3×2 `02-video-image-ad` — pixel-perfect contra
 * `designs/video-walls/3x2/3x2 Video-Image + Ad.svg`.
 *
 * Composición XD verbatim del body (header + bezels los pinta el runtime):
 *   - Splash-Background-2 translate(0 335) rect 3840×1825 fill pattern
 *     viewBox `0 2566.712 3840 1825` image 3840×5760.
 *   - Play_Icon translate(1766 1092) path play 312×312 opacity 0.8.
 *   - Video_Wall_Add_Big_Square translate(3842 329) rect 1918×1834 fill
 *     pattern-2 viewBox `0 0 1200 1103` image 1200×1103.
 */
function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const videoMod = findSlot(slots, 'video');
  const videoUrl =
    videoMod?.kind === 'video-image' ? resolveUrl(client.slug, videoMod.asset.url) : null;
  const isVideo = videoMod?.kind === 'video-image' && videoMod.asset.kind === 'video';

  const adMod = findSlot(slots, 'ad');
  const adUrl = adMod?.kind === 'ads' ? resolveUrl(client.slug, adMod.asset.url) : null;
  const isAdVideo = adMod?.kind === 'ads' && adMod.asset.kind === 'video';

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
        <rect width="5760" height="2160" fill="#fff" />

        {/* Splash-Background-2 translate(0 335) — 3840×1825, video/image bg */}
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

        {/* Video_Wall_Add_Big_Square translate(3842 329) — 1918×1834 ad vertical */}
        <g transform="translate(3842 329)">
          <rect width="1918" height="1834" fill="#000" />
          {adUrl && !isAdVideo ? (
            <image
              href={adUrl}
              x="0"
              y="0"
              width="1918"
              height="1834"
              preserveAspectRatio="xMidYMid slice"
            />
          ) : null}
        </g>

        {/* Play Icon translate(1766 1092), 312×312, opacity 0.8 — verbatim XD */}
        <g transform="translate(1766 1092)">
          <path
            d="M156,312C69.981,312,0,242.018,0,156S69.981,0,156,0,312,69.981,312,156,242.018,312,156,312ZM115.3,88.173V223.825L230.607,156Z"
            fill="#fff"
            opacity="0.8"
          />
        </g>
      </svg>

      {/* Video HTML overlay — coords absolutas del canvas */}
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
      {!videoUrl ? (
        <BrandVideoFallback
          brandVideo={client.branding.brandVideo}
          rect={{ left: 0, top: 335, width: 3840, height: 1825 }}
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
            left: 3842,
            top: 329,
            width: 1918,
            height: 1834,
            objectFit: 'cover',
          }}
        />
      ) : null}
    </>
  );
}
function resolveUrl(slug: string, raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith('http') || raw.startsWith('/') || raw.startsWith('data:')) return raw;
  return `/video-wall-assets/${slug}/${raw}`;
}

const Template: VideoWallTemplate = {
  id: '02-video-image-ad',
  label: '02 · Video + Ad',
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
      kind: 'sidebar',
      cellRect: { row: 0, col: 2, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['ads'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
