'use client';

import { type CSSProperties } from 'react';

import { resolveBrandVideoSource, type BrandVideoConfig } from '@/lib/studio/brand-video';

/**
 * Overlay de fallback que reproduce el `branding.brandVideo` del cliente en un
 * slot de video VACÍO (sin asset asignado) de un template de Video Wall.
 *
 * Se monta como hermano absoluto DESPUÉS del `<svg>` del template (igual que
 * el `<video>` HTML de un asset real), por lo que cubre el `<rect fill="#000">`
 * y el play-icon que el SVG pinta para el estado vacío.
 *
 * Coords en espacio de canvas (px absolutos del canvas total del wall). Si
 * `rect` se omite, cubre todo el canvas (`inset: 0`) — usado por los templates
 * fullscreen `01-video-image-full`.
 */
export function BrandVideoFallback({
  brandVideo,
  rect,
}: {
  brandVideo: BrandVideoConfig | undefined;
  rect?: { left: number; top: number; width: number; height: number };
}) {
  const resolved = resolveBrandVideoSource(brandVideo);
  if (!resolved) return null;

  const box: CSSProperties = rect
    ? { position: 'absolute', ...rect }
    : { position: 'absolute', inset: 0 };

  if (resolved.kind === 'youtube') {
    return (
      <div style={{ ...box, overflow: 'hidden' }}>
        <iframe
          src={resolved.embedUrl}
          title="Brand video"
          allow="autoplay; encrypted-media"
          style={{
            width: '100%',
            height: '100%',
            border: 0,
            transform: 'scale(1.5)',
            transformOrigin: 'center center',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  return (
    <video
      src={resolved.src}
      autoPlay
      loop
      muted
      playsInline
      style={{ ...box, objectFit: 'cover' }}
    />
  );
}
