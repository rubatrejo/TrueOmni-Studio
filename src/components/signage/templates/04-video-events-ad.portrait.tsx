import { formatDayLabel, formatTime } from '@/lib/signage/text-helpers';

import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `04-video-events-ad` — portrait 1080×1920.
 *
 * Replica `designs/signage/portrait/04-video-events-ad.svg`. Layout verbatim:
 *  - Video at translate(0 155) — rect 1080×608 fill pattern viewBox 1280×720.
 *    Play_Icon at translate(465 267) dentro de Video (net 465, 422).
 *  - Display_Full_Add at translate(0 763) — rect 1080×608 fill pattern viewBox
 *    `3.468 11.486 1080 608`.
 *  - Component_37_3 at translate(0 1371) — events row con Event_2, 3, 4
 *    (mismo small tile pattern del template 01).
 *
 * Total altura body 608+608+549 = 1765 (1920 - 155 header).
 */

function urlOr(clientSlug: string, raw: string | undefined, fallback: string): string {
  const u = raw && raw.length > 0 ? raw : fallback;
  return u.startsWith('/') || u.startsWith('http') ? u : `/signage-assets/${clientSlug}/${u}`;
}

interface EventLike {
  title: string;
  startsAt: string;
  image?: string | null;
  location?: string | null;
}

function Render({ client, slots }: SignageTemplateRenderProps) {
  const videoMod = slots.find((s) => s.module.kind === 'video-image');
  const adMod = slots.find((s) => s.module.kind === 'ads');
  const videoUrl = urlOr(
    client.slug,
    videoMod && videoMod.module.kind === 'video-image' ? videoMod.module.asset.url : undefined,
    'assets/video-image/pool.png',
  );
  const adUrl = urlOr(
    client.slug,
    adMod && adMod.module.kind === 'ads' ? adMod.module.asset.url : undefined,
    'assets/ads/full-ad.png',
  );
  const e0 = client.events[0];
  const e1 = client.events[1];
  const e2 = client.events[2];
  const rowEvents: (EventLike | undefined)[] = [e0, e1, e2];

  return (
    <svg
      viewBox="0 155 1080 1765"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="block"
    >
      <defs>
        <pattern
          id="p04-video"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          viewBox="0 0 1280 720"
        >
          <image width="1280" height="720" href={videoUrl} />
        </pattern>
        <pattern
          id="p04-ad"
          patternUnits="objectBoundingBox"
          preserveAspectRatio="xMidYMid slice"
          width="1"
          height="1"
        >
          <image preserveAspectRatio="xMidYMid slice" width="1080" height="608" href={adUrl} />
        </pattern>
        {rowEvents.map((ev, i) => (
          <pattern key={i} id={`p04-evt-${i}`} width="1" height="1" viewBox="0 0 360 549">
            <image
              preserveAspectRatio="xMidYMid slice"
              width="360"
              height="549"
              href={
                ev?.image
                  ? `/signage-assets/${client.slug}/${ev.image}`
                  : `/signage-assets/${client.slug}/assets/events/${i === 0 ? 'ski' : i === 1 ? 'music' : 'dog'}.jpg`
              }
            />
          </pattern>
        ))}
      </defs>

      {/* Video translate(0 155) 1080×608 */}
      <g transform="translate(0 155)">
        <rect width="1080" height="608" fill="url(#p04-video)" />
        <g transform="translate(465 267)">
          <path
            d="M75,150a75,75,0,1,1,75-75A75.085,75.085,0,0,1,75,150ZM55.434,42.391v65.217L110.869,75Z"
            fill="#fff"
            opacity="0.8"
          />
        </g>
      </g>

      {/* Ad translate(0 763) 1080×608 */}
      <g transform="translate(0 763)">
        <rect width="1080" height="608" fill="url(#p04-ad)" />
      </g>

      {/* Events row translate(0 1371) */}
      <g transform="translate(0 1371)">
        {rowEvents.map((ev, i) =>
          ev ? (
            <SmallTile
              key={i}
              col={i as 0 | 1 | 2}
              ev={ev}
              locale={client.locale}
              patternId={`p04-evt-${i}`}
            />
          ) : null,
        )}
      </g>
    </svg>
  );
}

function SmallTile({
  col,
  ev,
  locale,
  patternId,
}: {
  col: 0 | 1 | 2;
  ev: EventLike;
  locale: string;
  patternId: string;
}) {
  const x = col * 360;
  const day = new Date(ev.startsAt).getUTCDate();
  const dayLabel = formatDayLabel(ev.startsAt, locale).weekday;
  const time = formatTime(ev.startsAt, locale);
  const [t1, t2] = wrapByLength(ev.title, 18);
  return (
    <g transform={`translate(${x} 87)`}>
      <g>
        <rect width="360" height="549" transform="translate(0 -87)" fill={`url(#${patternId})`} />
        <g transform="translate(0 362)">
          <rect width="360" height="100" fill="#1796d6" fillOpacity="0.901" />
        </g>
        <text
          transform="translate(26 392)"
          fill="#fff"
          fontSize="18"
          fontFamily="OpenSans-Bold, Open Sans"
          fontWeight="700"
        >
          <tspan x="0" y="0">
            {t1}
          </tspan>
          {t2 ? (
            <tspan x="0" y="24">
              {t2}
            </tspan>
          ) : null}
        </text>
        <text
          transform="translate(26 445)"
          fill="#fff"
          fontSize="16"
          fontFamily="OpenSans, Open Sans"
        >
          <tspan x="0" y="0">{`${time} - ${ev.location ?? 'Location'}`}</tspan>
        </text>
      </g>
      <g transform="translate(0 -57)">
        <rect width="130" height="112" fill="#b9bd39" />
        <text
          transform="translate(65 34)"
          fill="#fff"
          fontSize="20"
          fontFamily="Montserrat-Medium, Montserrat"
          fontWeight="500"
          textAnchor="middle"
        >
          <tspan x="0" y="0">
            {dayLabel}
          </tspan>
        </text>
        <text
          transform="translate(65 88)"
          fill="#fff"
          fontSize="50"
          fontFamily="OpenSans, Open Sans"
          textAnchor="middle"
        >
          <tspan x="0" y="0">
            {day}
          </tspan>
        </text>
      </g>
    </g>
  );
}

function wrapByLength(input: string, charsPerLine: number): [string, string | null] {
  if (input.length <= charsPerLine) return [input, null];
  const words = input.split(/\s+/);
  let line1 = '';
  for (const w of words) {
    if ((line1 + (line1 ? ' ' : '') + w).length > charsPerLine) break;
    line1 = line1 ? `${line1} ${w}` : w;
  }
  if (!line1) {
    return [input.slice(0, charsPerLine), input.slice(charsPerLine)];
  }
  const line2 = input.slice(line1.length).trim();
  return [line1, line2.length > 0 ? line2 : null];
}

const VideoEventsAdPortraitTemplate: SignageTemplate = {
  id: '04-video-events-ad',
  orientation: 'portrait',
  label: 'Video + Events + Ad (Portrait)',
  category: 'composed',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      rect: { x: 0, y: 0, w: 1080, h: 608 },
      acceptedModules: ['video-image'],
    },
    { key: 'ad', kind: 'strip', rect: { x: 0, y: 608, w: 1080, h: 608 }, acceptedModules: ['ads'] },
    {
      key: 'events',
      kind: 'strip',
      rect: { x: 0, y: 1216, w: 1080, h: 549 },
      acceptedModules: ['events'],
    },
  ],
  Render,
};

registerTemplate(VideoEventsAdPortraitTemplate);

export default VideoEventsAdPortraitTemplate;
