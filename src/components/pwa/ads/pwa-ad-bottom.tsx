'use client';

import { AdCloseButton } from '@/components/ads/ad-close-button';
import { useImageCornerTheme } from '@/components/ads/use-image-corner-theme';
import type { Ad } from '@/lib/config';

/**
 * Bottom ad PWA — strip bottom-fixed dentro del canvas 390. No bloquea. z-70
 * (queda sobre el bottom nav mientras esté visible, como el kiosk). A sangre
 * completa sin bordes: alto 146px, imagen que llena el área SIN deformarse
 * (`object-fit: cover` — recorta el excedente en vez de estirar), tanto en phone
 * como en tablet.
 */
export function PwaAdBottom({ ad, onDismiss }: { ad: Ad; onDismiss: () => void }) {
  const detected = useImageCornerTheme(ad.image);
  const theme = ad.theme ?? detected;
  return (
    <div
      role="complementary"
      aria-label={ad.alt ?? 'Advertisement'}
      className="absolute inset-x-0 bottom-0 overflow-hidden"
      style={{ height: 146, zIndex: 70 }}
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
          objectFit: 'cover',
        }}
      />
      <AdCloseButton theme={theme} size={32} style={{ top: 12, right: 12 }} onClick={onDismiss} />
    </div>
  );
}
