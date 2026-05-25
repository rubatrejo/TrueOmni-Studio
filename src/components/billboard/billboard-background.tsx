'use client';

import { buildYouTubeEmbedUrl, isYouTubeUrl } from '@/lib/studio/youtube';

/**
 * Background compartido por los 4 billboards idle (B0/B1/B2/B3).
 *
 * Resuelve tres tipos de fuente con un solo punto de verdad:
 *   - `type: 'image'`  → `<img>`.
 *   - `type: 'video'` con URL de archivo (MP4/WebM, data URL, /path) → `<video>`.
 *   - `type: 'video'` con URL de YouTube → `<iframe>` embed (el `<video>` HTML
 *     no reproduce páginas de YouTube). Cubre el flujo "▶ Use brand video"
 *     del Billboard editor y el Idle Background de Branding → Media cuando el
 *     operador pega una URL de YouTube.
 *
 * El contenedor padre debe ser `relative`/`absolute` + `overflow-hidden`: el
 * iframe se escala 1.5× (mismo heurístico que el Hero Header) para cubrir el
 * área sin franjas negras, ya que el iframe conserva su ratio 16:9 fijo.
 */
export function BillboardBackground({
  src,
  type,
  className = 'absolute inset-0 h-full w-full object-cover',
}: {
  src: string;
  type: 'image' | 'video';
  className?: string;
}) {
  const isYouTube = type === 'video' && !!src && isYouTubeUrl(src);
  const ytEmbedUrl = isYouTube ? buildYouTubeEmbedUrl(src) : null;

  if (ytEmbedUrl) {
    return (
      <iframe
        key={src}
        src={ytEmbedUrl}
        title="Billboard video"
        allow="autoplay; encrypted-media"
        className="absolute inset-0 h-full w-full border-0"
        style={{
          transform: 'scale(1.5)',
          transformOrigin: 'center center',
          pointerEvents: 'none',
        }}
      />
    );
  }

  if (type === 'video') {
    return <video key={src} src={src} autoPlay loop muted playsInline className={className} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img key={src} src={src} alt="" className={className} />;
}
