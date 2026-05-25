'use client';

import { EventCardSvg, resolveAssetUrl, SocialGradientDefs } from '../_shared/_card-svg';
import { BrandVideoFallback } from '../_shared/brand-video-fallback';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 3×2 `03-video-image-events` — pixel-perfect contra
 * `designs/video-walls/3x2/3x2 Video-Image + Events.svg`.
 *
 * Composición XD verbatim:
 *   - Splash-Background-2 translate(0 335) 3840×1825 video/image bg.
 *   - Play_Icon translate(1764 1092).
 *   - Events fila 1 (col 3, y=335..1080): 3 cards 640×745.
 *   - Events fila 2 (col 3, y=1080..2160): 3 cards 640×1080.
 */

const ROW1_Y = 335;
const ROW1_H = 745;
const ROW2_Y = 1080;
const ROW2_H = 1080;
const COL3_X = 3840;
const CARD_W = 640;

function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const videoMod = findSlot(slots, 'video');
  const videoUrl =
    videoMod?.kind === 'video-image' ? resolveAssetUrl(client.slug, videoMod.asset.url) : null;
  const isVideo = videoMod?.kind === 'video-image' && videoMod.asset.kind === 'video';

  const eventsMod = findSlot(slots, 'events');
  const maxItems = eventsMod?.kind === 'events' ? eventsMod.maxItems : 6;
  const events = (client.events ?? []).slice(0, Math.min(maxItems, 6));

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

        {[0, 1, 2].map((i) => (
          <EventCardSvg
            key={`r1-${i}`}
            x={COL3_X + i * CARD_W}
            y={ROW1_Y}
            w={CARD_W}
            h={ROW1_H}
            event={events[i] ?? null}
            clientSlug={client.slug}
          />
        ))}

        {[0, 1, 2].map((i) => (
          <EventCardSvg
            key={`r2-${i}`}
            x={COL3_X + i * CARD_W}
            y={ROW2_Y}
            w={CARD_W}
            h={ROW2_H}
            event={events[i + 3] ?? null}
            clientSlug={client.slug}
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
      {!videoUrl ? (
        <BrandVideoFallback
          brandVideo={client.branding.brandVideo}
          rect={{ left: 0, top: 335, width: 3840, height: 1825 }}
        />
      ) : null}
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '03-video-image-events',
  label: '03 · Video + Events',
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
      key: 'events',
      kind: 'sidebar',
      cellRect: { row: 0, col: 2, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['events'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
