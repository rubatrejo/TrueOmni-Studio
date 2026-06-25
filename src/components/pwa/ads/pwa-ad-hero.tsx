'use client';

import { AdCloseButton } from '@/components/ads/ad-close-button';
import { useImageCornerTheme } from '@/components/ads/use-image-corner-theme';
import type { Ad } from '@/lib/config';

import { useDevice } from '../device-context';

/**
 * Hero ad PWA — banner top-fixed dentro del canvas 390. No bloquea. z-70 (sobre el
 * contenido y el header). Cubre la MISMA área que la imagen del hero del Dashboard
 * (390×255) a sangre completa, sin bordes: la imagen llena el área SIN deformarse
 * (`object-fit: cover` — recorta el excedente en vez de estirar).
 *
 * En **tablet** el canvas es mucho más ancho (834/1194px), así que la imagen del
 * ad (pensada para ~390px) ocupaba todo el ancho y se veía recortada/forzada.
 * Aquí la caja del ad se **acota a un ancho máximo y se centra**; los lados se
 * rellenan con el color de marca (header). El phone NO cambia (ancho completo).
 */
export function PwaAdHero({ ad, onDismiss }: { ad: Ad; onDismiss: () => void }) {
  const detected = useImageCornerTheme(ad.image);
  const theme = ad.theme ?? detected;
  const { isTablet, isLandscape } = useDevice();
  const maxW = isTablet ? (isLandscape ? 720 : 560) : undefined;
  return (
    <div
      role="complementary"
      aria-label={ad.alt ?? 'Advertisement'}
      className="absolute inset-x-0 top-0 flex justify-center overflow-hidden"
      style={{
        height: 255,
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
      <AdCloseButton theme={theme} size={34} style={{ top: 12, right: 12 }} onClick={onDismiss} />
    </div>
  );
}
