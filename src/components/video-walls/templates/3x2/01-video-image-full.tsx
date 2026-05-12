'use client';

import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 3×2 `01-video-image-full` — pixel-perfect contra
 * `designs/video-walls/3x2/3x2 Video-Image Full.svg`.
 *
 * Composición XD verbatim del body (header + bezels pintados por el
 * runtime):
 *   - Splash-Background-2: `<rect width="5760" height="2160" fill="url(#pattern)"/>`
 *     pattern viewBox 0 4138.818 5760 2160 con image 5760×8640 (slice).
 *   - Play_Icon: `transform="translate(2724 1092)"` path play 312×312
 *     opacity 0.8 fill white.
 */
function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const videoMod = findSlot(slots, 'main');
  const url = videoMod?.kind === 'video-image' ? resolveUrl(client.slug, videoMod.asset.url) : null;
  const isVideo = videoMod?.kind === 'video-image' && videoMod.asset.kind === 'video';

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
        <defs>
          {url && !isVideo ? (
            <pattern id="vw-01-pattern" width="1" height="1" viewBox="0 4138.818 5760 2160">
              <image preserveAspectRatio="xMidYMid slice" width="5760" height="8640" href={url} />
            </pattern>
          ) : null}
        </defs>
        <rect width="5760" height="2160" fill="#fff" />
        {url && !isVideo ? (
          <rect width="5760" height="2160" fill="url(#vw-01-pattern)" />
        ) : (
          <rect width="5760" height="2160" fill="#000" />
        )}
        {/* Play Icon — translate(2724 1092), 312×312, opacity 0.8 */}
        <g transform="translate(2724 1092)">
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
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
    </>
  );
}

function resolveUrl(clientSlug: string, raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith('http') || raw.startsWith('/') || raw.startsWith('data:')) return raw;
  return `/video-wall-assets/${clientSlug}/${raw}`;
}

const Template: VideoWallTemplate = {
  id: '01-video-image-full',
  label: '01 · Full Video / Image',
  category: 'fullscreen',
  grid: '3x2',
  slots: [
    {
      key: 'main',
      kind: 'fullscreen',
      cellRect: { row: 0, col: 0, rowSpan: 2, colSpan: 3 },
      acceptedModules: ['video-image'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
