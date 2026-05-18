'use client';

import { EventCardSvg, resolveAssetUrl, SocialGradientDefs } from '../_shared/_card-svg';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/** Template 4×2 `04-video-image-ad-events` — XD Slide 4. SIMÉTRICO: cada
 *  sidebar (col 0 y col 3) tiene Ad arriba + 3 Events abajo. Video centro. */
const BODY_Y = 335;
const AD_H = 1080;
const EVENTS_Y = BODY_Y + AD_H;
const EVENTS_H = 745;
const CARD_H = Math.round(EVENTS_H / 3);

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
    { x: 0, key: 'l' },
    { x: 5760, key: 'r' },
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
        {sides.flatMap((s) => [
          <g key={`${s.key}-ad`} transform={`translate(${s.x} ${BODY_Y})`}>
            <rect width="1920" height={AD_H} fill="#0a0a0a" />
            {adUrl && !adIsVideo ? (
              <image
                href={adUrl}
                x="0"
                y="0"
                width="1920"
                height={AD_H}
                preserveAspectRatio="xMidYMid slice"
              />
            ) : null}
          </g>,
          ...[0, 1, 2].map((i) => (
            <EventCardSvg
              key={`${s.key}-ev-${i}`}
              x={s.x}
              y={EVENTS_Y + i * CARD_H}
              w={1920}
              h={CARD_H}
              event={events[i] ?? null}
              clientSlug={client.slug}
            />
          )),
        ])}
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
              left: 0,
              top: BODY_Y,
              width: 1920,
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
              left: 5760,
              top: BODY_Y,
              width: 1920,
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
