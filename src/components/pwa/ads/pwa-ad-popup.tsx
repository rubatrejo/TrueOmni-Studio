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
          // Tablet: ancho FIJO (no solo `maxWidth`, que dejaría el popup en el
          // tamaño nativo de la imagen — chico). 500px = modal centrado con
          // márgenes claros, en la misma familia que los demás popups (~400px)
          // pero un poco más prominente por ser un ad visual. Phone: tope original.
          width: isTablet ? 500 : undefined,
          maxWidth: isTablet ? '88%' : 340,
          maxHeight: isTablet ? '88%' : '86%',
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
            width: isTablet ? '100%' : 'auto',
            maxWidth: '100%',
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
