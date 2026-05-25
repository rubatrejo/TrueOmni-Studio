import { SignageBrandVideoOverlay } from './_shared/brand-video-overlay';
import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `03-full-video-image` — portrait 1080×1920.
 *
 * Replica `designs/signage/portrait/03-full-video-image.svg`. El video del
 * SVG fuente está montado con `<g id="Video" transform="translate(-1167)">`
 * y un rect `videoplayback width="3414" height="1920"` con fill pattern
 * viewBox `0 0 1280 720`. Esto centra horizontalmente un video 16:9 sobre
 * un canvas portrait, recortando los laterales (el centro del video queda
 * en el centro del canvas).
 *
 * Play_Icon (verbatim): translate(1632 960) dentro del grupo Video con
 * offset -1167 → translate efectivo (465 960). Path `play` circular
 * idéntico al landscape.
 */

interface VideoImageAsset {
  url: string;
  kind: 'video' | 'image';
}

function getAsset(clientSlug: string, slots: SignageTemplateRenderProps['slots']): VideoImageAsset {
  const mod = slots.find((s) => s.module.kind === 'video-image');
  if (mod && mod.module.kind === 'video-image' && mod.module.asset.url) {
    const url = mod.module.asset.url;
    return {
      url:
        url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')
          ? url
          : `/signage-assets/${clientSlug}/${url}`,
      kind: mod.module.asset.kind,
    };
  }
  return {
    url: `/signage-assets/${clientSlug}/assets/video-image/pool.png`,
    kind: 'image',
  };
}

function PlayIconOverlay() {
  // Path verbatim del SVG fuente. translate(1632 960) dentro de Video que
  // tiene transform(-1167 0) → translate efectivo (465 960).
  return (
    <g transform="translate(465 960)">
      <path
        d="M75,150a75,75,0,1,1,75-75A75.085,75.085,0,0,1,75,150ZM55.435,42.391v65.218L110.869,75Z"
        fill="hsl(var(--signage-text-on-brand))"
        fillOpacity="0.8"
      />
    </g>
  );
}

function Render({ client, display, slots }: SignageTemplateRenderProps) {
  const asset = getAsset(client.slug, slots);
  const audioEnabled = display.settings.audio === true;
  const videoMod = slots.find((s) => s.module.kind === 'video-image');
  const hasVideoAsset = !!(
    videoMod &&
    videoMod.module.kind === 'video-image' &&
    videoMod.module.asset.url
  );

  if (asset.kind === 'video') {
    // Video: foreignObject porque <video> es HTML. Centramos el video como
    // el SVG: ocupa 3414×1920 con translate -1167 0 (parte visible es el
    // centro). objectFit: cover ya hace lo mismo respetando 16:9, pero
    // mantenemos la geometría del XD.
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
        <foreignObject x="0" y="0" width="1080" height="1920">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={asset.url}
            autoPlay
            muted={!audioEnabled}
            loop
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </foreignObject>
        <PlayIconOverlay />
      </svg>
    );
  }

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
        {/* Pattern verbatim: viewBox 0 0 1280 720 con preserveAspectRatio slice. */}
        <pattern
          id="vi-fullbleed-portrait"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          viewBox="0 0 1280 720"
        >
          <image width="1280" height="720" href={asset.url} />
        </pattern>
      </defs>
      {/* Video group: translate(-1167) con rect 3414×1920 (el group ocupa todo
          el canvas portrait — el header se monta por encima por SignageRuntime). */}
      <g transform="translate(-1167 0)">
        <rect width="3414" height="1920" fill="url(#vi-fullbleed-portrait)" />
      </g>
      {!hasVideoAsset ? (
        <SignageBrandVideoOverlay
          brandVideo={client.branding.brandVideo}
          x={0}
          y={0}
          width={1080}
          height={1920}
          audioEnabled={display.settings.audio === true}
        />
      ) : null}
      <PlayIconOverlay />
    </svg>
  );
}

const FullVideoImagePortraitTemplate: SignageTemplate = {
  id: '03-full-video-image',
  orientation: 'portrait',
  label: 'Full Video / Image (Portrait)',
  category: 'fullscreen',
  slots: [
    {
      key: 'main',
      kind: 'fullscreen',
      rect: { x: 0, y: 0, w: 1080, h: 1765 },
      acceptedModules: ['video-image'],
    },
  ],
  Render,
};

registerTemplate(FullVideoImagePortraitTemplate);

export default FullVideoImagePortraitTemplate;
