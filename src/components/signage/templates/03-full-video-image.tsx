import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Template `03-full-video-image` — Video / Image fullscreen 1920×925.
 *
 * Replica `designs/signage/03-full-video-image.svg`. Rect 1920×1080 con la
 * imagen (o video) full-bleed; el viewBox `0 155 1920 925` clipea la franja
 * del header. Play icon centrado verbatim del SVG (path circular blanco
 * opacity 0.8).
 *
 * El Play_Icon se muestra siempre — es decorativo, no funcional. El video
 * (cuando es asset video) reproduce muted/loop autoplay en background.
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
  // Path verbatim del SVG fuente. Path id="play" — círculo radio 75 con
  // triángulo de play interior. translate(885 543) lo centra en 1920×1080.
  return (
    <g transform="translate(885 543)">
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

  if (asset.kind === 'video') {
    // Video: usamos foreignObject porque <video> es HTML, no SVG. El video
    // reproduce autoplay+loop. `muted` se ata a `display.settings.audio` (DS14):
    // por defecto false → video silenciado, lo que permite autoplay sin
    // gesture. Si el cliente pone audio:true debe asegurar que el navegador
    // del kiosko tenga la flag de autoplay con sonido habilitada.
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
        <foreignObject x="0" y="0" width="1920" height="1080">
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
          id="vi-fullbleed"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          viewBox="0 0 1280 720"
        >
          <image width="1280" height="720" href={asset.url} />
        </pattern>
      </defs>
      {/* Rect 1920×1080 (full screen). El viewBox clipea el top 155px. */}
      <rect width="1920" height="1080" fill="url(#vi-fullbleed)" />
      <PlayIconOverlay />
    </svg>
  );
}

const FullVideoImageTemplate: SignageTemplate = {
  id: '03-full-video-image',
  orientation: 'landscape',
  label: 'Full Video / Image',
  category: 'fullscreen',
  slots: [
    {
      key: 'main',
      kind: 'fullscreen',
      rect: { x: 0, y: 0, w: 1920, h: 925 },
      acceptedModules: ['video-image'],
    },
  ],
  Render,
};

registerTemplate(FullVideoImageTemplate);

export default FullVideoImageTemplate;
