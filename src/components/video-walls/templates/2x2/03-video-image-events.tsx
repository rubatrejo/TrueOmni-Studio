'use client';

import { EventCardSvg, resolveAssetUrl, SocialGradientDefs } from '../_shared/_card-svg';
import { BrandVideoFallback } from '../_shared/brand-video-fallback';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 2×2 `03-video-image-events` — pixel-perfect XD
 * `2x2/Slide 3 - 2x2 Video-Image + Events.svg`.
 *
 * Layout verbatim XD (canvas 3840×2160):
 *   - Header full width y=0..335.
 *   - Video col 0: x=0 y=335 w=1920 h=1825.
 *   - Events col 1 (x=1920):
 *       · Row top y=335,  h=745  → 3 cards 640×745  (x=1920/2560/3200).
 *       · Row bot y=1080, h=1080 → 3 cards 640×1080 (x=1920/2560/3200).
 *   - 6 event cards en col 1 (top usa events[0..3], bot usa events[3..6]).
 */
const VIDEO_X = 0;
const VIDEO_Y = 335;
const VIDEO_W = 1920;
const VIDEO_H = 1825;
const EVENTS_X = 1920;
const ROW1_Y = 335;
const ROW1_H = 745;
const ROW2_Y = 1080;
const ROW2_H = 1080;
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
        width="3840"
        height="2160"
        viewBox="0 0 3840 2160"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <SocialGradientDefs />
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

        {/* Events col 1: row top (3 cards 640×745) + row bot (3 cards 640×1080) */}
        {[0, 1, 2].map((i) => (
          <EventCardSvg
            key={`r1-${i}`}
            x={EVENTS_X + i * CARD_W}
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
            x={EVENTS_X + i * CARD_W}
            y={ROW2_Y}
            w={CARD_W}
            h={ROW2_H}
            event={events[i + 3] ?? null}
            clientSlug={client.slug}
          />
        ))}

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
      {!videoUrl ? (
        <BrandVideoFallback
          brandVideo={client.branding.brandVideo}
          rect={{ left: VIDEO_X, top: VIDEO_Y, width: VIDEO_W, height: VIDEO_H }}
        />
      ) : null}
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '03-video-image-events',
  label: '03 · Video + Events',
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
      key: 'events',
      kind: 'sidebar',
      cellRect: { row: 0, col: 1, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['events'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
