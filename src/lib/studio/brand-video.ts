import { buildYouTubeEmbedUrl, isYouTubeUrl } from './youtube';

/**
 * Shape del `brandVideo` de branding (kiosk + signage/video-wall comparten
 * el mismo contrato). `src` puede ser un data URL, una URL de Blob (`https://`),
 * un `/path` local o una URL de YouTube.
 */
export interface BrandVideoConfig {
  kind?: 'upload' | 'youtube' | string;
  src?: string;
}

/** Fuente normalizada lista para reproducir como fallback de un slot de video. */
export type BrandVideoSource =
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'video'; src: string }
  | null;

/**
 * Normaliza el `brandVideo` del branding a una fuente reproducible para usar
 * como fallback en los slots de video vacíos de Digital Display y Video Wall.
 *
 *   - YouTube (kind 'youtube' o URL detectada) → `{ kind: 'youtube', embedUrl }`
 *     que se embebe vía `<iframe>` (el `<video>` HTML no reproduce páginas de YT).
 *   - Cualquier otra fuente con `src` no vacío → `{ kind: 'video', src }`.
 *   - Sin `src` → `null` (el slot conserva su placeholder/negro original).
 */
export function resolveBrandVideoSource(bv: BrandVideoConfig | undefined | null): BrandVideoSource {
  const src = bv?.src?.trim();
  if (!src) return null;
  if (bv?.kind === 'youtube' || isYouTubeUrl(src)) {
    const embedUrl = buildYouTubeEmbedUrl(src);
    return embedUrl ? { kind: 'youtube', embedUrl } : null;
  }
  return { kind: 'video', src };
}
