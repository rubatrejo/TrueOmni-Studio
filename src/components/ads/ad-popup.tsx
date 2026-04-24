'use client';

import type { Ad } from '@/lib/config';

import { AdCloseButton } from './ad-close-button';
import { useImageCornerTheme } from './use-image-corner-theme';

/**
 * Popup ad — modal bloqueante centrado (imagen portrait con QR dentro).
 *
 * - Backdrop semitransparente fijo dentro del canvas (absolute inset-0).
 * - Sólo la X cierra (backdrop no cierra al tocar).
 * - Tap en la imagen = no hace nada.
 * - z-60 — sobre todo excepto el FavoriteAddedToast (z-70).
 * - La X se pinta por encima del asset (el PNG ya no trae la X).
 * - Color de la X se decide por `ad.theme` (`dark` = blanca, `light` = negra).
 */
export function AdPopup({ ad, onDismiss }: { ad: Ad; onDismiss: () => void }) {
  const detected = useImageCornerTheme(ad.image);
  const theme = ad.theme ?? detected;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ad.alt ?? 'Advertisement'}
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 80, backgroundColor: 'rgba(0,0,0,0.75)' }}
    >
      <div
        className="relative overflow-hidden rounded-[18px]"
        style={{
          maxWidth: '1000px',
          maxHeight: '1700px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ad.image}
          alt={ad.alt ?? ''}
          className="block"
          style={{ display: 'block', height: 'auto', maxWidth: '100%' }}
          draggable={false}
        />
        <AdCloseButton
          theme={theme}
          size={56}
          style={{ top: '18px', right: '18px' }}
          onClick={onDismiss}
        />
      </div>
    </div>
  );
}
