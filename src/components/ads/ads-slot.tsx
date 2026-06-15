'use client';

import { useEffect, useState } from 'react';

import type { Ad } from '@/lib/config';

import { readSystemModulesCache } from '../system-modules-cache';

import { AdBottom } from './ad-bottom';
import { AdHero } from './ad-hero';
import { AdPopup } from './ad-popup';
import { useAds } from './use-ads';

type SystemModulesDetail = { ads: boolean; languages: boolean; aiAvatar: boolean };

/**
 * Orquestador de ads por ruta. Se monta como sibling del módulo dentro del
 * `KioskCanvas` en cada page que quiera ads (dashboard, módulos, detail).
 *
 * Lee `usePathname()` y el catálogo declarado en
 * `config.features.advertisements.ads` para decidir qué ads renderizar.
 *
 * También respeta el override `studio:modules-update.systemModules.ads` para
 * permitir apagar todos los ads en vivo desde el Studio.
 */
export function AdsSlot({ ads }: { ads: readonly Ad[] }) {
  const { popupAd, heroAd, bottomAd, dismiss } = useAds(ads);
  // Estado inicial desde el cache: respeta el toggle aunque el slot monte
  // después del evento de override (navegación interna del preview).
  const [hidden, setHidden] = useState(() => readSystemModulesCache()?.ads === false);

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
      {heroAd ? <AdHero ad={heroAd} onDismiss={() => dismiss(heroAd.id)} /> : null}
      {bottomAd ? <AdBottom ad={bottomAd} onDismiss={() => dismiss(bottomAd.id)} /> : null}
      {popupAd ? <AdPopup ad={popupAd} onDismiss={() => dismiss(popupAd.id)} /> : null}
    </>
  );
}
