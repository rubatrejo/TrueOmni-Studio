'use client';

import { AdCloseButton } from '@/components/ads/ad-close-button';
import { useImageCornerTheme } from '@/components/ads/use-image-corner-theme';
import type { Ad } from '@/lib/config';

import { useDevice } from '../device-context';

/**
 * Popup ad PWA — interstitial bloqueante centrado dentro del canvas 390. Backdrop
 * `rgba(0,0,0,0.75)`, z-80 (sobre hero/bottom). Solo la X cierra (el backdrop no).
 * Card con la imagen a su aspecto nativo (max-width 340 / max-height del canvas).
 */
export function PwaAdPopup({ ad, onDismiss }: { ad: Ad; onDismiss: () => void }) {
  const detected = useImageCornerTheme(ad.image);
  const theme = ad.theme ?? detected;
  const { isTablet } = useDevice();
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ad.alt ?? 'Advertisement'}
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 80, backgroundColor: 'rgba(0,0,0,0.75)' }}
    >
      <div
        className="relative overflow-hidden rounded-[16px]"
        style={{
          // La card se ajusta al tamaño NATIVO de la imagen (ancho/alto auto),
          // acotada por `maxWidth`/`maxHeight`. En tablet el tope es mayor (560px)
          // para que el ad luzca prominente, pero NUNCA se fuerza el ancho: así
          // la imagen conserva su proporción y no se estira/upscalea. Phone: tope
          // original (340px).
          maxWidth: isTablet ? 560 : 340,
          maxHeight: isTablet ? '82%' : '86%',
          boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ad.image}
          alt={ad.alt ?? ''}
          draggable={false}
          className="block"
          style={{
            display: 'block',
            height: 'auto',
            width: 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        />
        <AdCloseButton
          theme={theme}
          size={isTablet ? 48 : 38}
          style={{ top: 12, right: 12 }}
          onClick={onDismiss}
        />
      </div>
    </div>
  );
}
