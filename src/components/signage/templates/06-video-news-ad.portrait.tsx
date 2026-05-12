import { QRCodeSVG } from 'qrcode.react';

import { SignageNewsTicker } from '@/components/signage/news/SignageNewsTicker';

import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `06-video-news-ad` — portrait 1080×1920.
 *
 * Replica `designs/signage/portrait/06-video-news-ad.svg` y aplica el mismo
 * lenguaje del módulo News que el landscape 06: QR code a la izquierda +
 * `SignageNewsTicker` rotativo con `client.news.source.items`.
 *
 * Layout verbatim del SVG fuente:
 *  - Video at translate(-238 155) — rect 1556×875 fill pattern (centrado).
 *    Play_Icon at translate(703 363) dentro de Video → net (465, 518).
 *  - Bottom_Text group at translate(0 232):
 *    - Background rect 1080×281 at translate(0 799) → net y=1031.
 *    - QR code a la izquierda (reemplaza el newspaper icon decorativo).
 *    - News ticker rotativo a la derecha.
 *  - Display_Full_Add at translate(0 1312) — rect 1080×608.
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
  const slot = slots.find((s) => s.module.kind === 'ads');
  if (slot && slot.module.kind === 'ads' && slot.module.asset.url) {
    return buildAssetUrl(clientSlug, slot.module.asset.url);
  }
  return buildAssetUrl(clientSlug, 'assets/ads/full-ad.png');
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
 * QR code en la franja del news strip portrait. Posición: x=50, y=1080 en el
 * viewBox absoluto (50px de padding del border del rect 1080×281 que arranca
 * en y=1031; 161px de QR centrado verticalmente: 1031 + (281-161)/2 = 1091
 * pero usamos 1080 para alinear con un baseline de 60px desde top del band).
 */
function NewsQrCode({ url }: { url: string }) {
  return (
    <foreignObject x="50" y="1080" width="180" height="180">
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
  const newsItems = client.news.source.kind === 'manual' ? client.news.source.items : [];
  const newsInterval = client.news.rotationIntervalSec;

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
          id="p06-video"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          viewBox="0 0 1280 720"
        >
          <image width="1280" height="720" href={videoUrl} />
        </pattern>
        <pattern
          id="p06-ad"
          patternUnits="objectBoundingBox"
          preserveAspectRatio="xMidYMid slice"
          width="1"
          height="1"
        >
          <image preserveAspectRatio="xMidYMid slice" width="1080" height="608" href={adUrl} />
        </pattern>
      </defs>

      {/* Video translate(-238 155) rect 1556×875 */}
      <g transform="translate(-238 155)">
        <rect width="1556" height="875" fill="url(#p06-video)" />
        <PlayIconOverlay x={703} y={363} />
      </g>

      {/* News strip — background rect cyan en y=1031..1312 (1080×281) */}
      <rect x="0" y="1031" width="1080" height="281" fill="hsl(var(--signage-band-overlay))" />

      {/* QR code (reemplaza el news icon decorativo del SVG fuente) */}
      <NewsQrCode url={client.website ?? 'https://trueomni.com'} />

      {/* News ticker rotativo a la derecha del QR */}
      <foreignObject x="264" y="1049" width="780" height="245">
        <SignageNewsTicker items={newsItems} intervalSec={newsInterval} />
      </foreignObject>

      {/* Display_Full_Add translate(0 1312) rect 1080×608 */}
      <g transform="translate(0 1312)">
        <rect width="1080" height="608" fill="url(#p06-ad)" />
      </g>
    </svg>
  );
}

const VideoNewsAdPortraitTemplate: SignageTemplate = {
  id: '06-video-news-ad',
  orientation: 'portrait',
  label: 'Video + News + Ad (Portrait)',
  category: 'composed',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      rect: { x: 0, y: 0, w: 1080, h: 875 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'news',
      kind: 'strip',
      rect: { x: 0, y: 875, w: 1080, h: 281 },
      acceptedModules: ['news'],
    },
    {
      key: 'ad',
      kind: 'strip',
      rect: { x: 0, y: 1156, w: 1080, h: 608 },
      acceptedModules: ['ads'],
    },
  ],
  Render,
};

registerTemplate(VideoNewsAdPortraitTemplate);

export default VideoNewsAdPortraitTemplate;
