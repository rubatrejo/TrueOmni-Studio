'use client';

import { useEffect, useState } from 'react';

import { useAds } from '@/components/ads/use-ads';

import { PwaAdBottom } from './pwa-ad-bottom';
import { PwaAdHero } from './pwa-ad-hero';
import { PwaAdPopup } from './pwa-ad-popup';
import { usePwaAds } from './pwa-ads-context';

type SystemModulesDetail = { ads: boolean; languages: boolean; aiAvatar: boolean };

/**
 * Orquestador de ads de la PWA. Montado dentro de `MobileCanvas` (presente en
 * todas las pantallas) → los ads quedan sobre el contenido y el bottom nav. El
 * catálogo llega por contexto (`usePwaAds`, inyectado por `(pwa)/layout`); `useAds`
 * resuelve qué ad mostrar según la ruta (`usePathname`) y respeta el dismiss por
 * sesión. Misma lógica que el `AdsSlot` del kiosk, con componentes a medida móvil.
 */
export function PwaAdsSlot() {
  const ads = usePwaAds();
  const { popupAd, heroAd, bottomAd, dismiss } = useAds(ads);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onSys = (e: Event) => {
      const detail = (e as CustomEvent<SystemModulesDetail>).detail;
      if (typeof detail?.ads === 'boolean') setHidden(!detail.ads);
    };
    window.addEventListener('kiosk:system-modules-override', onSys);
    return () => window.removeEventListener('kiosk:system-modules-override', onSys);
  }, []);

  if (hidden) return null;

  return (
    <>
      {heroAd ? <PwaAdHero ad={heroAd} onDismiss={() => dismiss(heroAd.id)} /> : null}
      {bottomAd ? <PwaAdBottom ad={bottomAd} onDismiss={() => dismiss(bottomAd.id)} /> : null}
      {popupAd ? <PwaAdPopup ad={popupAd} onDismiss={() => dismiss(popupAd.id)} /> : null}
    </>
  );
}
