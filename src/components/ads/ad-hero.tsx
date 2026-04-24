'use client';

import type { Ad } from '@/lib/config';

import { AdCloseButton } from './ad-close-button';
import { useImageCornerTheme } from './use-image-corner-theme';

/**
 * Hero ad — cubre los 1080×620 del hero header del módulo actual.
 * No bloquea el resto de la UI (toolbar + contenido siguen usables). z-20.
 *
 * La imagen se estira exactamente al área del hero (sin object-cover, sin
 * padding, sin aire residual) para respetar el ratio del asset entregado.
 */
export function AdHero({ ad, onDismiss }: { ad: Ad; onDismiss: () => void }) {
  const detected = useImageCornerTheme(ad.image);
  const theme = ad.theme ?? detected;
  return (
    <div
      role="complementary"
      aria-label={ad.alt ?? 'Advertisement'}
      className="absolute inset-x-0 top-0 overflow-hidden"
      style={{ height: '620px', zIndex: 70, backgroundColor: '#000' }}
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
      <AdCloseButton
        theme={theme}
        size={52}
        style={{ top: '20px', right: '20px' }}
        onClick={onDismiss}
      />
    </div>
  );
}
