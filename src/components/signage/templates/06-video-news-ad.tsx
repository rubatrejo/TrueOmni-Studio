import { SignageNewsTicker } from '@/components/signage/news/SignageNewsTicker';

import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `06-video-news-ad` — composed 3-zone con módulo News:
 *  - Top-left: Video/Image (1144×644)
 *  - Right: Ad vertical (776×925) clipeado de imagen 1295×925 (Olympic)
 *  - Bottom-left: News card cyan (1144×281) con icon newspaper + texto rotativo
 *
 * El módulo News rota items cada `client.news.rotationIntervalSec`. Soporta
 * source `manual` (items en news.json), `rss` (feed externo), `api` (JSON
 * endpoint). Los items resueltos se pasan al `<SignageNewsTicker>` client
 * component que se encarga de la rotación.
 *
 * IMPORTANTE: las news items vienen pre-resueltas en el `client` resolved.
 * El loader (en page.tsx) debe haber llamado `resolveNewsItems()` antes.
 * Para DS8 lo simplificamos: el cliente signage ya tiene `news.source.items`
 * directamente cuando es manual; rss/api se resolverán cuando el cliente
 * configure feeds reales (sub-fase tardía cablea el resolve en page.tsx).
 */

function buildAssetUrl(clientSlug: string, relPath: string): string {
  if (relPath.startsWith('http://') || relPath.startsWith('https://') || relPath.startsWith('/')) {
    return relPath;
  }
  return `/signage-assets/${clientSlug}/${relPath}`;
}

function getVideoUrl(clientSlug: string, slots: SignageTemplateRenderProps['slots']): string {
  const slot = slots.find((s) => s.module.kind === 'video-image');
  if (slot && slot.module.kind === 'video-image' && slot.module.asset.url) {
    return buildAssetUrl(clientSlug, slot.module.asset.url);
  }
  return buildAssetUrl(clientSlug, 'assets/video-image/pool.png');
}

function getAdUrl(clientSlug: string, slots: SignageTemplateRenderProps['slots']): string {
  const slot = slots.find((s) => s.slotKey === 'right-ad' && s.module.kind === 'ads');
  if (slot && slot.module.kind === 'ads' && slot.module.asset.url) {
    return buildAssetUrl(clientSlug, slot.module.asset.url);
  }
  return buildAssetUrl(clientSlug, 'assets/ads/right-vertical-olympic.png');
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

function NewspaperIcon() {
  // Path verbatim del SVG (Icon_core-newspaper) translate(48.875 871.937).
  return (
    <g transform="translate(48.875 871.937)">
      <path
        d="M25.561,5.063V112.311a6.788,6.788,0,1,1-13.576,0v-80.1H1.125v80.1a17.668,17.668,0,0,0,17.648,17.648H146.385a17.668,17.668,0,0,0,17.648-17.648V5.063ZM153.173,112.311a6.8,6.8,0,0,1-6.788,6.788H35.064a17.554,17.554,0,0,0,1.358-6.788V15.923H153.173Z"
        fill="hsl(var(--signage-text-on-brand))"
      />
      <path
        d="M52.376,21.94H46.013a4.527,4.527,0,1,0,0,9.055h6.363a4.527,4.527,0,1,0,0-9.055Z"
        fill="hsl(var(--signage-text-on-brand))"
      />
      <path
        d="M52.376,40.04H46.013a4.527,4.527,0,1,0,0,9.054h6.363a4.527,4.527,0,1,0,0-9.054Z"
        fill="hsl(var(--signage-text-on-brand))"
      />
      <path
        d="M52.376,58.14H46.013a4.527,4.527,0,1,0,0,9.054h6.363a4.527,4.527,0,1,0,0-9.054Z"
        fill="hsl(var(--signage-text-on-brand))"
      />
      <path
        d="M89.485,58.14H67.762a4.527,4.527,0,1,0,0,9.054H89.485a4.527,4.527,0,0,0,0-9.054Z"
        fill="hsl(var(--signage-text-on-brand))"
      />
      <path
        d="M129.62,21.94H68.214a4.527,4.527,0,1,0,0,9.055H129.62a4.527,4.527,0,1,0,0-9.055Z"
        fill="hsl(var(--signage-text-on-brand))"
      />
      <path
        d="M125.092,40.04H68.214a4.527,4.527,0,1,0,0,9.054h56.879a4.527,4.527,0,1,0,0-9.054Z"
        fill="hsl(var(--signage-text-on-brand))"
      />
      <path
        d="M129.62,76.24H46.013a4.527,4.527,0,1,0,0,9.055H129.62a4.527,4.527,0,1,0,0-9.055Z"
        fill="hsl(var(--signage-text-on-brand))"
      />
      <path
        d="M129.62,94.34H46.013a4.527,4.527,0,1,0,0,9.054H129.62a4.527,4.527,0,1,0,0-9.054Z"
        fill="hsl(var(--signage-text-on-brand))"
      />
    </g>
  );
}

function Render({ client, slots }: SignageTemplateRenderProps) {
  const videoUrl = getVideoUrl(client.slug, slots);
  const adUrl = getAdUrl(client.slug, slots);
  // Para DS8 con source manual, items vienen directamente del client.news.
  // Cuando rss/api: el page.tsx debe pre-resolver via resolveNewsItems() y
  // pasarlos como prop. Sub-fase tardía añade el cableo runtime.
  const newsItems =
    client.news.source.kind === 'manual' ? client.news.source.items : [];
  const newsInterval = client.news.rotationIntervalSec;

  return (
    <svg
      viewBox="0 155 1920 925"
      width="1920"
      height="925"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="block"
    >
      <defs>
        <pattern
          id="vna-video"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          viewBox="0 0 1280 720"
        >
          <image width="1280" height="720" href={videoUrl} />
        </pattern>
        <clipPath id="vna-clip-ad">
          <rect width="776" height="925" transform="translate(1144 155)" />
        </clipPath>
      </defs>

      {/* Video — translate(0 155), rect 1144×644 */}
      <g transform="translate(0 155)">
        <rect width="1144" height="644" fill="url(#vna-video)" />
        <PlayIconOverlay x={497} y={247} />
      </g>

      {/* Right vertical ad — image clipped a (1144 155 776×925).
          Image natural se renderea a 1295×925 dentro del clip path. */}
      <g clipPath="url(#vna-clip-ad)">
        <image
          width="1295"
          height="925"
          transform="translate(892 155)"
          href={adUrl}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>

      {/* Bottom News — background rect cyan + icon + foreignObject con ticker */}
      <rect width="1144" height="281" transform="translate(0 799)" fill="#1796d6" />
      <NewspaperIcon />
      <foreignObject x="264" y="817" width="852" height="245">
        <SignageNewsTicker items={newsItems} intervalSec={newsInterval} />
      </foreignObject>
    </svg>
  );
}

const VideoNewsAdTemplate: SignageTemplate = {
  id: '06-video-news-ad',
  label: 'Video + News + Ad',
  category: 'composed',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      rect: { x: 0, y: 0, w: 1144, h: 644 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'right-ad',
      kind: 'sidebar',
      rect: { x: 1144, y: 0, w: 776, h: 925 },
      acceptedModules: ['ads'],
    },
    {
      key: 'news',
      kind: 'strip',
      rect: { x: 0, y: 644, w: 1144, h: 281 },
      acceptedModules: ['news'],
    },
  ],
  Render,
};

registerTemplate(VideoNewsAdTemplate);

export default VideoNewsAdTemplate;
