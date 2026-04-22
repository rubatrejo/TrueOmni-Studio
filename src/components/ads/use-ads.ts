'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import { AD_DISMISSED_STORAGE_KEY, getAdsForRoute } from '@/lib/ads';
import type { Ad } from '@/lib/config';

/**
 * Store global de ads dismissed en `sessionStorage`. Misma arquitectura que
 * `createFavoritesStore` en `src/lib/favorites.ts` pero con forma
 * `Record<string, true>` en lugar de `Set<string>` (lookup directo por id).
 */

type DismissedMap = Readonly<Record<string, true>>;
const EMPTY: DismissedMap = Object.freeze({});

let currentState: DismissedMap = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

const notify = () => {
  for (const l of listeners) l();
};

const subscribe = (l: () => void): (() => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const getSnapshot = () => currentState;
const getServerSnapshot = () => EMPTY;

const readFromStorage = (): DismissedMap => {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.sessionStorage.getItem(AD_DISMISSED_STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return EMPTY;
    const out: Record<string, true> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v === true) out[k] = true;
    }
    return Object.freeze(out);
  } catch {
    return EMPTY;
  }
};

const writeToStorage = (state: DismissedMap) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(AD_DISMISSED_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage lleno o deshabilitado — ignorar */
  }
};

const hydrateIfNeeded = () => {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  const fromStorage = readFromStorage();
  if (Object.keys(fromStorage).length > 0) {
    currentState = fromStorage;
    notify();
  }
};

/** Marca un ad como dismissed hasta el fin de la sesión. */
export function dismissAd(id: string): void {
  if (currentState[id]) return;
  const next = Object.freeze({ ...currentState, [id]: true as const });
  currentState = next;
  writeToStorage(next);
  notify();
}

export interface UseAdsResult {
  popupAd: Ad | null;
  heroAd: Ad | null;
  bottomAd: Ad | null;
  /** Cierra el ad con ese id (lo persiste en sessionStorage). */
  dismiss: (id: string) => void;
}

/**
 * Resuelve qué ads mostrar en la ruta actual, respetando los que el usuario
 * ya cerró en esta sesión.
 */
export function useAds(ads: readonly Ad[]): UseAdsResult {
  const pathname = usePathname() ?? '';
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    hydrateIfNeeded();
  }, []);

  const result = useMemo(() => {
    const { popup, hero, bottom } = getAdsForRoute(ads, pathname);
    const visible = (ad: Ad | null) => (ad && !dismissed[ad.id] ? ad : null);
    return {
      popupAd: visible(popup),
      heroAd: visible(hero),
      bottomAd: visible(bottom),
    };
  }, [ads, pathname, dismissed]);

  const dismiss = useCallback((id: string) => dismissAd(id), []);

  return { ...result, dismiss };
}
