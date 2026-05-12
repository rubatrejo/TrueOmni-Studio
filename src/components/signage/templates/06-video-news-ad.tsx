import { QRCodeSVG } from 'qrcode.react';

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

/**
 * QR code que enlaza a la web del cliente. Reemplaza el icono de periódico
 * del SVG fuente — invita al usuario a escanear y visitar la página oficial.
 * Renderea via foreignObject porque QRCodeSVG es HTML/SVG component externo.
 */
function NewsQrCode({ url }: { url: string }) {
  return (
    <foreignObject x="48" y="850" width="180" height="180">
      <div className="flex h-full w-full items-center justify-center rounded-[12px] bg-signage-text-on-brand p-3">
        <QRCodeSVG
          value={url}
          size={156}
          level="M"
          bgColor="transparent"
          fgColor="hsl(var(--signage-brand-primary))"
          marginSize={0}
        />
      </div>
    </foreignObject>
  );
}

function Render({ client, slots }: SignageTemplateRenderProps) {
  const videoUrl = getVideoUrl(client.slug, slots);
  const adUrl = getAdUrl(client.slug, slots);
  // Para DS8 con source manual, items vienen directamente del client.news.
  // Cuando rss/api: el page.tsx debe pre-resolver via resolveNewsItems() y
  // pasarlos como prop. Sub-fase tardía añade el cableo runtime.
  const newsItems = client.news.source.kind === 'manual' ? client.news.source.items : [];
  const newsInterval = client.news.rotationIntervalSec;

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

      {/* Bottom News — background rect cyan + QR + foreignObject con ticker.
          QR ocupa la franja izquierda donde antes iba el icono periódico. */}
      <rect
        width="1144"
        height="281"
        transform="translate(0 799)"
        fill="hsl(var(--signage-band-overlay))"
      />
      <NewsQrCode url={client.website ?? 'https://trueomni.com'} />
      <foreignObject x="264" y="817" width="852" height="245">
        <SignageNewsTicker items={newsItems} intervalSec={newsInterval} />
      </foreignObject>
    </svg>
  );
}

const VideoNewsAdTemplate: SignageTemplate = {
  id: '06-video-news-ad',
  orientation: 'landscape',
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
