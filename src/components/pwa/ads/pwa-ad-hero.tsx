'use client';

import { AdCloseButton } from '@/components/ads/ad-close-button';
import { useImageCornerTheme } from '@/components/ads/use-image-corner-theme';
import type { Ad } from '@/lib/config';

/**
 * Hero ad PWA — banner top-fixed dentro del canvas 390. No bloquea. z-70 (sobre el
 * contenido y el header). Cubre la MISMA área que la imagen del hero del Dashboard
 * (390×255) a sangre completa, sin bordes: la imagen (ya recortada, sin margen
 * transparente) se estira al área (`object-fit: fill`). La X la pinta `AdCloseButton`.
 */
export function PwaAdHero({ ad, onDismiss }: { ad: Ad; onDismiss: () => void }) {
  const detected = useImageCornerTheme(ad.image);
  const theme = ad.theme ?? detected;
  return (
    <div
      role="complementary"
      aria-label={ad.alt ?? 'Advertisement'}
      className="absolute inset-x-0 top-0 overflow-hidden"
      style={{ height: 255, zIndex: 70 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ad.image}
        alt={ad.alt ?? ''}
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'fill',
        }}
      />
      <AdCloseButton theme={theme} size={34} style={{ top: 12, right: 12 }} onClick={onDismiss} />
    </div>
  );
}
