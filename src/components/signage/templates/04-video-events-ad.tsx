import { formatDayLabel, formatTime, wrapTitle } from '@/lib/signage/text-helpers';

import { SignageBrandVideoOverlay } from './_shared/brand-video-overlay';
import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `04-video-events-ad` — composed 3-zone:
 *  - Top-left: Video/Image (1145×644)
 *  - Bottom-left: Ad horizontal (1144×281)
 *  - Right column: Events (sub-hero + 3 small cards) idéntico a la columna
 *    derecha de `01-full-events`
 *
 * Replica `designs/signage/04-video-events-ad.svg`. Reusa los assets ya
 * extraídos en sub-fases anteriores: `video-image/pool.png` (DS5),
 * `ads/bottom-banner.jpg` (NEW DS6) y los `events/*.jpg` (DS3).
 */

function getVideoUrl(clientSlug: string, slots: SignageTemplateRenderProps['slots']): string {
  const mod = slots.find((s) => s.module.kind === 'video-image');
  if (mod && mod.module.kind === 'video-image' && mod.module.asset.url) {
    const url = mod.module.asset.url;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url;
    return `/signage-assets/${clientSlug}/${url}`;
  }
  return `/signage-assets/${clientSlug}/assets/video-image/pool.png`;
}
function getAdUrl(clientSlug: string, slots: SignageTemplateRenderProps['slots']): string {
  const mod = slots.find((s) => s.module.kind === 'ads');
  if (mod && mod.module.kind === 'ads' && mod.module.asset.url) {
    const url = mod.module.asset.url;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return url;
    return `/signage-assets/${clientSlug}/${url}`;
  }
  return `/signage-assets/${clientSlug}/assets/ads/bottom-banner.jpg`;
}

function PlayIconOverlay({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M75,150a75,75,0,1,1,75-75A75.085,75.085,0,0,1,75,150ZM55.434,42.391v65.217L110.869,75Z"
        fill="hsl(var(--signage-text-on-brand))"
        fillOpacity="0.8"
      />
    </g>
  );
}

function Render({ client, slots }: SignageTemplateRenderProps) {
  // Sub-hero + 3 small cards: skip hero (events[0]), use events[1..4].
  const e1 = client.events[1];
  const e2 = client.events[2];
  const e3 = client.events[3];
  const e4 = client.events[4];

  if (!e1 || !e2 || !e3 || !e4) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-signage-warning text-signage-text">
        <p className="text-2xl">Template 04-video-events-ad requires ≥5 events</p>
      </div>
    );
  }

  const labels = [e1, e2, e3, e4].map((e) => formatDayLabel(e.startsAt, client.locale));
  const times = [e1, e2, e3, e4].map((e) => formatTime(e.startsAt, client.locale));
  const [t2line1, t2line2] = wrapTitle(e2.title, 18);
  const [t3line1, t3line2] = wrapTitle(e3.title, 18);
  const [t4line1, t4line2] = wrapTitle(e4.title, 18);

  const videoUrl = getVideoUrl(client.slug, slots);
  const adUrl = getAdUrl(client.slug, slots);
  const videoMod = slots.find((s) => s.module.kind === 'video-image');
  const hasVideoAsset = !!(
    videoMod &&
    videoMod.module.kind === 'video-image' &&
    videoMod.module.asset.url
  );

  return (
    <svg
      viewBox="0 155 1920 925"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="block"
    >
      <defs>
        <pattern
          id="vea-video"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          viewBox="0 0 1280 720"
        >
          <image width="1280" height="720" href={videoUrl} />
        </pattern>
        <pattern id="vea-ad" width="1" height="1" viewBox="0 22.154 1144 281">
          <image preserveAspectRatio="xMidYMid slice" width="1144" height="448.712" href={adUrl} />
        </pattern>
        <pattern id="vea-subhero" width="1" height="1" viewBox="0 0 774 463">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="774"
            height="463"
            href={`/signage-assets/${client.slug}/${e1.image ?? 'assets/events/baseball.jpg'}`}
          />
        </pattern>
        <pattern id="vea-small-2" width="1" height="1" viewBox="0 0 258 462">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="258"
            height="462"
            href={`/signage-assets/${client.slug}/${e2.image ?? 'assets/events/ski.jpg'}`}
          />
        </pattern>
        <pattern id="vea-small-3" width="1" height="1" viewBox="0 0 495.399 462">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="495.399"
            height="462"
            href={`/signage-assets/${client.slug}/${e3.image ?? 'assets/events/music.jpg'}`}
          />
        </pattern>
        <clipPath id="vea-clip-mask-3">
          <rect width="258" height="462" />
        </clipPath>
        <pattern id="vea-small-4" width="1" height="1" viewBox="0 0 258 462">
          <image
            preserveAspectRatio="xMidYMid slice"
            width="258"
            height="462"
            href={`/signage-assets/${client.slug}/${e4.image ?? 'assets/events/dog.jpg'}`}
          />
        </pattern>
      </defs>

      {/* ======================================================================
          ZONA 1: Video — translate(0 155), rect 1145×644
          ====================================================================== */}
      <g transform="translate(0 155)">
        <rect width="1145" height="644" fill="url(#vea-video)" />
        {!hasVideoAsset ? (
          <SignageBrandVideoOverlay
            brandVideo={client.branding.brandVideo}
            width={1145}
            height={644}
          />
        ) : null}
        <PlayIconOverlay x={497} y={288} />
      </g>

      {/* ======================================================================
          ZONA 2: Bottom Ad — translate(0 799), rect 1144×281
          ====================================================================== */}
      <g transform="translate(0 799)">
        <rect width="1144" height="281" fill="url(#vea-ad)" />
      </g>

      {/* ======================================================================
          ZONA 3: Right column events (Component_37_1 translate 1145 155)
          Idéntico al right column de 01-full-events.
          ====================================================================== */}
      <g transform="translate(1145 155)">
        {/* Event_1 sub-hero — translate(-160 -58.5) */}
        <g transform="translate(-160 -58.5)">
          <g transform="translate(160 58.5)">
            <rect width="774" height="463" fill="url(#vea-subhero)" />
            <rect
              width="774"
              height="100"
              transform="translate(0 363)"
              fill="hsl(var(--signage-band-overlay))"
              fillOpacity="0.897"
            />
            <text
              transform="translate(30 380)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="22"
              className="signage-font-body"
              fontWeight="700"
            >
              <tspan x="0" y="24">
                {e1.title}
              </tspan>
            </text>
            <text
              transform="translate(30 420)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="20"
              className="signage-font-body"
            >
              <tspan x="0" y="21">
                {times[0]} - {e1.location ?? 'Location'}
              </tspan>
            </text>
          </g>
          <g transform="translate(160 30)">
            <rect
              width="160"
              height="138.588"
              transform="translate(0 58.5)"
              fill="hsl(var(--signage-events-accent))"
            />
            <text
              transform="translate(80 96.5)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="24"
              className="signage-font-display"
              fontWeight="500"
              textAnchor="middle"
            >
              <tspan x="0" y="0">
                {labels[0]?.weekday}
              </tspan>
            </text>
            <text
              transform="translate(80 170.5)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="68"
              className="signage-font-body"
              textAnchor="middle"
            >
              <tspan x="0" y="0">
                {labels[0]?.day}
              </tspan>
            </text>
          </g>
        </g>

        {/* Event_2 small (ski) — translate(-156 349.5) */}
        <g transform="translate(-156 349.5)">
          <g transform="translate(151 113.5)">
            <rect width="258" height="462" transform="translate(5)" fill="url(#vea-small-2)" />
            <g transform="translate(258.5 2)">
              <rect
                width="258"
                height="100"
                transform="translate(-253.5 359.871)"
                fill="hsl(var(--signage-band-overlay))"
                fillOpacity="0.904"
              />
            </g>
            <text
              transform="translate(30 446)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="16"
              className="signage-font-body"
            >
              <tspan x="0" y="0">
                {times[1]} - {e2.location ?? 'Location'}
              </tspan>
            </text>
            <text
              transform="translate(30 390)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="18"
              className="signage-font-body"
              fontWeight="700"
            >
              <tspan x="0" y="0">
                {t2line1}
              </tspan>
              {t2line2 ? (
                <tspan x="0" y="24">
                  {t2line2}
                </tspan>
              ) : null}
            </text>
          </g>
          <g transform="translate(156 -180)">
            <rect
              width="130"
              height="112"
              transform="translate(0 323.5)"
              fill="hsl(var(--signage-events-accent))"
            />
            <text
              transform="translate(65 357.5)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="20"
              className="signage-font-display"
              fontWeight="500"
              textAnchor="middle"
            >
              <tspan x="0" y="0">
                {labels[1]?.weekday}
              </tspan>
            </text>
            <text
              transform="translate(65 411.5)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="50"
              className="signage-font-body"
              textAnchor="middle"
            >
              <tspan x="0" y="0">
                {labels[1]?.day}
              </tspan>
            </text>
          </g>
        </g>

        {/* Event_3 small (music) con clipPath — translate(98 -183.5) */}
        <g transform="translate(98 -183.5)">
          <g transform="translate(160 646.5)">
            <g clipPath="url(#vea-clip-mask-3)">
              <rect
                width="495.399"
                height="462"
                transform="translate(-165.787)"
                fill="url(#vea-small-3)"
              />
            </g>
            <g transform="translate(262.501)">
              <rect
                width="258"
                height="100"
                transform="translate(-262.5 362)"
                fill="hsl(var(--signage-band-overlay))"
                fillOpacity="0.8"
              />
            </g>
            <text
              transform="translate(29 390)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="18"
              className="signage-font-body"
              fontWeight="700"
            >
              <tspan x="0" y="0">
                {t3line1}
              </tspan>
              {t3line2 ? (
                <tspan x="0" y="24">
                  {t3line2}
                </tspan>
              ) : null}
            </text>
            <text
              transform="translate(29 440)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="16"
              className="signage-font-body"
            >
              <tspan x="0" y="0">
                {times[2]} - {e3.location ?? 'Location'}
              </tspan>
            </text>
          </g>
          <g transform="translate(160 30)">
            <rect
              width="130"
              height="112"
              transform="translate(0 646.5)"
              fill="hsl(var(--signage-events-accent))"
            />
            <text
              transform="translate(65 680.5)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="20"
              className="signage-font-display"
              fontWeight="500"
              textAnchor="middle"
            >
              <tspan x="0" y="0">
                {labels[2]?.weekday}
              </tspan>
            </text>
            <text
              transform="translate(65 734.5)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="50"
              className="signage-font-body"
              textAnchor="middle"
            >
              <tspan x="0" y="0">
                {labels[2]?.day}
              </tspan>
            </text>
          </g>
        </g>

        {/* Event_4 small (dog) — translate(356 -448.5) */}
        <g transform="translate(356 -448.5)">
          <g transform="translate(160 911.5)">
            <rect width="258" height="462" fill="url(#vea-small-4)" />
            <g transform="translate(262.532)">
              <rect
                width="258"
                height="100"
                transform="translate(-262.532 362)"
                fill="hsl(var(--signage-band-overlay))"
                fillOpacity="0.901"
              />
            </g>
            <text
              transform="translate(26 392)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="18"
              className="signage-font-body"
              fontWeight="700"
            >
              <tspan x="0" y="0">
                {t4line1}
              </tspan>
              {t4line2 ? (
                <tspan x="0" y="24">
                  {t4line2}
                </tspan>
              ) : null}
            </text>
            <text
              transform="translate(26 445)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="16"
              className="signage-font-body"
            >
              <tspan x="0" y="0">
                {times[3]} - {e4.location ?? 'Location'}
              </tspan>
            </text>
          </g>
          <g transform="translate(160 30)">
            <rect
              width="130"
              height="112"
              transform="translate(0 911.5)"
              fill="hsl(var(--signage-events-accent))"
            />
            <text
              transform="translate(65 945.5)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="20"
              className="signage-font-display"
              fontWeight="500"
              textAnchor="middle"
            >
              <tspan x="0" y="0">
                {labels[3]?.weekday}
              </tspan>
            </text>
            <text
              transform="translate(65 999.5)"
              fill="hsl(var(--signage-text-on-brand))"
              fontSize="50"
              className="signage-font-body"
              textAnchor="middle"
            >
              <tspan x="0" y="0">
                {labels[3]?.day}
              </tspan>
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}

const VideoEventsAdTemplate: SignageTemplate = {
  id: '04-video-events-ad',
  orientation: 'landscape',
  label: 'Video + Events + Ad',
  category: 'composed',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      rect: { x: 0, y: 0, w: 1145, h: 644 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'ad',
      kind: 'strip',
      rect: { x: 0, y: 644, w: 1144, h: 281 },
      acceptedModules: ['ads'],
    },
    {
      key: 'events',
      kind: 'sidebar',
      rect: { x: 1145, y: 0, w: 775, h: 925 },
      acceptedModules: ['events'],
    },
  ],
  Render,
};

registerTemplate(VideoEventsAdTemplate);

export default VideoEventsAdTemplate;
