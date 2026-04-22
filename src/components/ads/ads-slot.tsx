'use client';

import type { Ad } from '@/lib/config';

import { AdBottom } from './ad-bottom';
import { AdHero } from './ad-hero';
import { AdPopup } from './ad-popup';
import { useAds } from './use-ads';

/**
 * Orquestador de ads por ruta. Se monta como sibling del módulo dentro del
 * `KioskCanvas` en cada page que quiera ads (dashboard, módulos, detail).
 *
 * Lee `usePathname()` y el catálogo declarado en
 * `config.features.advertisements.ads` para decidir qué ads renderizar.
 */
export function AdsSlot({ ads }: { ads: readonly Ad[] }) {
  const { popupAd, heroAd, bottomAd, dismiss } = useAds(ads);
  return (
    <>
      {heroAd ? <AdHero ad={heroAd} onDismiss={() => dismiss(heroAd.id)} /> : null}
      {bottomAd ? <AdBottom ad={bottomAd} onDismiss={() => dismiss(bottomAd.id)} /> : null}
      {popupAd ? <AdPopup ad={popupAd} onDismiss={() => dismiss(popupAd.id)} /> : null}
    </>
  );
}
