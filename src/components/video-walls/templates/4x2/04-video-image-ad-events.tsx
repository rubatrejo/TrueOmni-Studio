'use client';

import { EventCardSvg, resolveAssetUrl, SocialGradientDefs } from '../_shared/_card-svg';
import { BrandVideoFallback } from '../_shared/brand-video-fallback';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * Template 4×2 `04-video-image-ad-events` — pixel-perfect XD
 * `4x2/Slide 4 - 4x2 Video-Image + Ad + Events.svg`.
 *
 * Layout verbatim XD:
 *   - Header full width y=0..335.
 *   - Video centro x=1920 y=335 w=3840 h=1825 (cols 1-2).
 *   - Sidebar IZQ (x=0) y DER (x=5760), espejados:
 *       · Ad     y=330, w=1916, h=750 (banner horizontal).
 *       · Events y=1080, 3 cards 640×1080 horizontales (x=0/640/1280).
 *   - 3 event cards únicos por sidebar (mirror izq=der).
 */
const VIDEO_X = 1920;
const VIDEO_Y = 335;
const VIDEO_W = 3840;
const VIDEO_H = 1825;
const AD_Y = 330;
const AD_W = 1916;
const AD_H = 750;
const EVENTS_Y = 1080;
const EVENTS_H = 1080;
const CARD_W = 640;
const LEFT_X = 0;
const RIGHT_X = 5760;

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

  const sides: { x: number; key: 'l' | 'r' }[] = [
    { x: LEFT_X, key: 'l' },
    { x: RIGHT_X, key: 'r' },
  ];

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

        {/* Video centro (cols 1-2) */}
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

        {/* Sidebars: ad top + 3 events bottom (mirror) */}
        {sides.flatMap((s) => [
          <g key={`${s.key}-ad`} transform={`translate(${s.x} ${AD_Y})`}>
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
          </g>,
          ...[0, 1, 2].map((i) => (
            <EventCardSvg
              key={`${s.key}-ev-${i}`}
              x={s.x + i * CARD_W}
              y={EVENTS_Y}
              w={CARD_W}
              h={EVENTS_H}
              event={events[i] ?? null}
              clientSlug={client.slug}
            />
          )),
        ])}

        {/* Play icon centrado sobre video */}
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
        <>
          <video
            src={adUrl}
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              left: LEFT_X,
              top: AD_Y,
              width: AD_W,
              height: AD_H,
              objectFit: 'cover',
            }}
          />
          <video
            src={adUrl}
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              left: RIGHT_X,
              top: AD_Y,
              width: AD_W,
              height: AD_H,
              objectFit: 'cover',
            }}
          />
        </>
      ) : null}
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '04-video-image-ad-events',
  label: '04 · Video + Ad + Events',
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
      key: 'ad',
      kind: 'sidebar',
      cellRect: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['ads'],
    },
    {
      key: 'events',
      kind: 'sidebar',
      cellRect: { row: 1, col: 0, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['events'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
