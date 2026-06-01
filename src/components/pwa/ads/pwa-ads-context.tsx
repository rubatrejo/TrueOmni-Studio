'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { Ad } from '@/lib/config';

/**
 * Contexto que lleva el catálogo de ads (`features.advertisements.ads`) desde el
 * layout server `(pwa)/layout.tsx` (que llama `getConfig`) hasta el `PwaAdsSlot`
 * montado en `MobileCanvas` (client). Default `[]` → sin ads, no crashea.
 */
const PwaAdsContext = createContext<readonly Ad[]>([]);

export function PwaAdsProvider({ ads, children }: { ads: readonly Ad[]; children: ReactNode }) {
  return <PwaAdsContext.Provider value={ads}>{children}</PwaAdsContext.Provider>;
}

export function usePwaAds(): readonly Ad[] {
  return useContext(PwaAdsContext);
}
