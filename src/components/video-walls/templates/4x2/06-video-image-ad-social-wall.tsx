'use client';

import { resolveAssetUrl, SocialCardSvg, SocialGradientDefs } from '../_shared/_card-svg';
import { findSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';


/** Template 4×2 `06-video-image-ad-social-wall` — XD Slide 6. SIMÉTRICO:
 *  Cada sidebar (col 0 y col 3) tiene Ad arriba + Social 2×2 grid abajo.
 *  Video centro (cols 1-2). */
const BODY_Y = 335;
const AD_H = 1080;
const SOCIAL_Y = BODY_Y + AD_H;
const SOCIAL_H = 745;
const TILE_W = 960;
const TILE_H = Math.round(SOCIAL_H / 2);

function Render({ client, slots }: VideoWallTemplateRenderProps) {
  const videoMod = findSlot(slots, 'video');
  const adMod = findSlot(slots, 'ad');
  const socialMod = findSlot(slots, 'social');

  const videoUrl =
    videoMod?.kind === 'video-image' ? resolveAssetUrl(client.slug, videoMod.asset.url) : null;
  const isVideo = videoMod?.kind === 'video-image' && videoMod.asset.kind === 'video';
  const adUrl = adMod?.kind === 'ads' ? resolveAssetUrl(client.slug, adMod.asset.url) : null;
  const adIsVideo = adMod?.kind === 'ads' && adMod.asset.kind === 'video';

  const maxPosts = socialMod?.kind === 'social' ? socialMod.maxPosts : 4;
  const posts = (client.social?.posts ?? []).slice(0, Math.min(maxPosts, 4));

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
          ...Array.from({ length: 4 }).map((_, i) => {
            const c = i % 2;
            const r = Math.floor(i / 2);
            return (
              <SocialCardSvg
                key={`${s.key}-soc-${i}`}
                x={s.x + c * TILE_W}
                y={SOCIAL_Y + r * TILE_H}
                w={TILE_W}
                h={TILE_H}
                post={posts[i] ?? null}
                clientSlug={client.slug}
                largeUsername={false}
              />
            );
          }),
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
  id: '06-video-image-ad-social-wall',
  label: '06 · Video + Ad + Social Wall',
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
      key: 'social',
      kind: 'sidebar',
      cellRect: { row: 1, col: 0, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
