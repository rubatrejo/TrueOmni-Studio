'use client';

import { AdCloseButton } from '@/components/ads/ad-close-button';
import { useImageCornerTheme } from '@/components/ads/use-image-corner-theme';
import type { Ad } from '@/lib/config';

import { useDevice } from '../device-context';

/**
 * Bottom ad PWA — strip bottom-fixed dentro del canvas 390. No bloquea. z-70
 * (queda sobre el bottom nav mientras esté visible, como el kiosk). A sangre
 * completa sin bordes: alto 146px, imagen que llena el área SIN deformarse
 * (`object-fit: cover` — recorta el excedente en vez de estirar).
 *
 * En **tablet** la caja del ad se **acota a un ancho máximo y se centra** (la
 * imagen va pensada para ~390px y a todo el ancho del tablet se veía forzada);
 * los lados se rellenan con el color de marca. El phone NO cambia.
 */
export function PwaAdBottom({ ad, onDismiss }: { ad: Ad; onDismiss: () => void }) {
  const detected = useImageCornerTheme(ad.image);
  const theme = ad.theme ?? detected;
  const { isTablet, isLandscape } = useDevice();
  const maxW = isTablet ? (isLandscape ? 720 : 560) : undefined;
  return (
    <div
      role="complementary"
      aria-label={ad.alt ?? 'Advertisement'}
      className="absolute inset-x-0 bottom-0 flex justify-center overflow-hidden"
      style={{
        height: 146,
        zIndex: 70,
        backgroundColor: isTablet ? 'hsl(var(--brand-primary))' : undefined,
      }}
    >
      <div style={{ position: 'relative', height: '100%', width: '100%', maxWidth: maxW }}>
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
      </div>
      <AdCloseButton theme={theme} size={32} style={{ top: 12, right: 12 }} onClick={onDismiss} />
    </div>
  );
}
