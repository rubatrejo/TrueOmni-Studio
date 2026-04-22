'use client';

import type { Ad } from '@/lib/config';

import { AdCloseButton } from './ad-close-button';
import { useImageCornerTheme } from './use-image-corner-theme';

/**
 * Bottom ad — strip horizontal pegado al bottom del canvas. No bloquea.
 * Alto 185px (tamaño nativo de los diseños entregados). z-30.
 */
export function AdBottom({ ad, onDismiss }: { ad: Ad; onDismiss: () => void }) {
  const detected = useImageCornerTheme(ad.image);
  const theme = ad.theme ?? detected;
  return (
    <div
      role="complementary"
      aria-label={ad.alt ?? 'Advertisement'}
      className="absolute bottom-0 left-0 right-0 overflow-hidden"
      style={{ height: '185px', zIndex: 30 }}
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
        size={44}
        style={{ top: '14px', right: '14px' }}
        onClick={onDismiss}
      />
    </div>
  );
}
