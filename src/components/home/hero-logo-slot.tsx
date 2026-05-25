'use client';

import { memo, useEffect, useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { KIOSK_HERO_OVERRIDE_EVENT, getCachedHeroOverride } from '@/components/studio-bridge';
import { HERO_LOGO_SIZE_PX, type BillboardLogoSize } from '@/lib/studio/schema';

/**
 * Slot del logo del Hero Header del Home (y módulos que heredan el header).
 *
 * Client component para poder escuchar `kiosk:hero-override` del bridge y
 * reaccionar al tamaño elegido en el Studio (Home Dashboard → Hero header →
 * Logo size) sin republish. El tamaño escala el slot (ratio 4:1, default M =
 * 360×90); el `<TrueOmniLogo>` se ajusta dentro alineado a la izquierda.
 *
 * En runtime de kiosk normal (sin Studio), el bridge nunca dispara → se queda
 * con el `initialSize` del SSR (config publicado). Cero overhead.
 */
export const HeroLogoSlot = memo(function HeroLogoSlot({
  initialSize = 'M',
}: {
  initialSize?: BillboardLogoSize;
}) {
  const [size, setSize] = useState<BillboardLogoSize>(initialSize);

  useEffect(() => {
    const cached = getCachedHeroOverride();
    if (cached.heroLogoSize) setSize(cached.heroLogoSize);

    const onOverride = (event: Event) => {
      const detail = (event as CustomEvent<{ heroLogoSize?: BillboardLogoSize }>).detail;
      if (detail?.heroLogoSize) setSize(detail.heroLogoSize);
    };
    window.addEventListener(KIOSK_HERO_OVERRIDE_EVENT, onOverride);
    return () => window.removeEventListener(KIOSK_HERO_OVERRIDE_EVENT, onOverride);
  }, []);

  const { w, h } = HERO_LOGO_SIZE_PX[size];

  return (
    <div
      className="absolute flex items-center justify-start"
      style={{ left: '65px', top: '38px', width: `${w}px`, height: `${h}px` }}
    >
      <TrueOmniLogo slot="default" align="left" className="h-full w-full text-white" />
    </div>
  );
});
