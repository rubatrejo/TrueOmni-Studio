'use client';

import { EventCardSvg, resolveAssetUrl, SocialGradientDefs } from '../_shared/_card-svg';
import { BrandVideoFallback } from '../_shared/brand-video-fallback';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 2×2 `04-video-image-ad-events` — pixel-perfect XD
 * `2x2/Slide 4 - 2x2 Video-Image + Ad + Events.svg`.
 *
 * Layout verbatim XD (canvas 3840×2160):
 *   - Header full width y=0..335.
 *   - Top row (y=335, h=745): Events horizontal full-width.
 *       · Listing izq: 3 cards 640×745 (x=0/640/1280).
 *       · Listing der: 3 cards 640×745 (x=1920/2560/3200).
 *       · 6 events totales (izq y der pueden ser idénticos en mirror
 *         o usar idx 0-2 izq + idx 3-5 der). Aquí mirror izq=der.
 *   - Bottom row (y=1080, h=1080):
 *       · Video col 0: x=0 y=1080 w=1920 h=1080.
 *       · Ad BIG SQUARE col 1: x=1920 y=1080 w=1920 h=1080.
 */
const EVENTS_Y = 335;
const EVENTS_H = 745;
const CARD_W = 640;
const VIDEO_X = 0;
const VIDEO_Y = 1080;
const VIDEO_W = 1920;
const VIDEO_H = 1080;
const AD_X = 1920;
const AD_Y = 1080;
const AD_W = 1920;
const AD_H = 1080;

function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const videoMod = findSlot(slots, 'video');
  const adMod = findSlot(slots, 'ad');
  const eventsMod = findSlot(slots, 'events');

  const videoUrl =
    videoMod?.kind === 'video-image' ? resolveAssetUrl(client.slug, videoMod.asset.url) : null;
  const isVideo = videoMod?.kind === 'video-image' && videoMod.asset.kind === 'video';
  const adUrl = adMod?.kind === 'ads' ? resolveAssetUrl(client.slug, adMod.asset.url) : null;
  const adIsVideo = adMod?.kind === 'ads' && adMod.asset.kind === 'video';

  const maxItems = eventsMod?.kind === 'events' ? eventsMod.maxItems : 3;
  const events = (client.events ?? []).slice(0, Math.min(maxItems, 3));

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

        {/* Events row top: 6 cards = 3 izq + 3 der (mirror) */}
        {[0, 1, 2].map((i) => (
          <EventCardSvg
            key={`l-${i}`}
            x={i * CARD_W}
            y={EVENTS_Y}
            w={CARD_W}
            h={EVENTS_H}
            event={events[i] ?? null}
            clientSlug={client.slug}
          />
        ))}
        {[0, 1, 2].map((i) => (
          <EventCardSvg
            key={`r-${i}`}
            x={1920 + i * CARD_W}
            y={EVENTS_Y}
            w={CARD_W}
            h={EVENTS_H}
            event={events[i] ?? null}
            clientSlug={client.slug}
          />
        ))}

        {/* Video col 0 bottom */}
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

        {/* Ad Big Square col 1 bottom */}
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

        {/* Play icon centrado en video bot (col 0, y=1080..2160 → mid 1620) */}
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
  id: '04-video-image-ad-events',
  label: '04 · Video + Ad + Events',
  category: 'composed',
  grid: '2x2',
  slots: [
    {
      key: 'events',
      kind: 'sidebar',
      cellRect: { row: 0, col: 0, rowSpan: 1, colSpan: 2 },
      acceptedModules: ['events'],
    },
    {
      key: 'video',
      kind: 'hero',
      cellRect: { row: 1, col: 0, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'ad',
      kind: 'sidebar',
      cellRect: { row: 1, col: 1, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['ads'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
