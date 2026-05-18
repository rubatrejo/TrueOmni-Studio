'use client';

import { EventCardSvg, resolveAssetUrl, SocialGradientDefs } from '../_shared/_card-svg';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 4×2 `03-video-image-events` — pixel-perfect XD `4x2/Slide 3`.
 * SIMÉTRICO: Events 3 cards col 0 + Video centro cols 1-2 + Events 3 cards
 * col 3 (espejo, mismos eventos).
 */
const BODY_Y = 335;
const BODY_H = 1825;
const CARD_W = 1920;
const CARD_H = Math.round(BODY_H / 3); // ~608

function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const videoMod = findSlot(slots, 'video');
  const videoUrl =
    videoMod?.kind === 'video-image' ? resolveAssetUrl(client.slug, videoMod.asset.url) : null;
  const isVideo = videoMod?.kind === 'video-image' && videoMod.asset.kind === 'video';

  const eventsMod = findSlot(slots, 'events');
  const maxItems = eventsMod?.kind === 'events' ? eventsMod.maxItems : 3;
  const events = (client.events ?? []).slice(0, Math.min(maxItems, 3));

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
        <SocialGradientDefs />
        <rect width="7680" height="2160" fill="#000" />

        {/* Video centro (cols 1-2): x=1920, w=3840 */}
        <g transform="translate(1920 335)">
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

        {/* Events sidebar IZQUIERDO (col 0): 3 cards stacked */}
        {[0, 1, 2].map((i) => (
          <EventCardSvg
            key={`l-${i}`}
            x={0}
            y={BODY_Y + i * CARD_H}
            w={CARD_W}
            h={CARD_H}
            event={events[i] ?? null}
            clientSlug={client.slug}
          />
        ))}

        {/* Events sidebar DERECHO (col 3): 3 cards stacked — MIRROR */}
        {[0, 1, 2].map((i) => (
          <EventCardSvg
            key={`r-${i}`}
            x={5760}
            y={BODY_Y + i * CARD_H}
            w={CARD_W}
            h={CARD_H}
            event={events[i] ?? null}
            clientSlug={client.slug}
          />
        ))}

        {/* Play icon centrado en video block */}
        <g transform="translate(3684 1092)">
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
            left: 1920,
            top: 335,
            width: 3840,
            height: 1825,
            objectFit: 'cover',
          }}
        />
      ) : null}
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '03-video-image-events',
  label: '03 · Video + Events',
  category: 'composed',
  grid: '4x2',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      cellRect: { row: 0, col: 1, rowSpan: 2, colSpan: 2 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'events',
      kind: 'sidebar',
      cellRect: { row: 0, col: 0, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['events'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
