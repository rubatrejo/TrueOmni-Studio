'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { PWA_CONFIG_OVERRIDE_EVENT, getCachedPwaOverride } from '@/components/studio-bridge';
import type { PwaConfig } from '@/lib/config';

/**
 * Provider del override reactivo del slice `features.pwa`.
 *
 * En runtime normal la PWA lee su config del server (prop `initial`) y este
 * provider es transparente. Cuando la PWA corre embebida en el iframe del
 * editor PWA del Studio, el `StudioBridge` despacha `PWA_CONFIG_OVERRIDE_EVENT`
 * con el slice completo en cada edición; el provider lo guarda y las pantallas
 * que consumen `usePwaSection(...)` se re-renderizan con el valor nuevo sin
 * recargar el iframe.
 *
 * Las pantallas se migran a este hook de forma incremental — mientras una
 * pantalla siga leyendo su config por props del server, simplemente no verá
 * el preview live (pero sí el branding/locale, que van por el StudioBridge).
 */

type PwaBridgeContextValue = {
  /** Slice `features.pwa` efectivo: override del Studio si existe, si no el del server. */
  pwa: PwaConfig | null;
  /** True si hay un override activo (estamos dentro del editor). */
  isOverridden: boolean;
};

const PwaBridgeContext = createContext<PwaBridgeContextValue>({ pwa: null, isOverridden: false });

export function PwaBridgeProvider({
  initial,
  children,
}: {
  initial: PwaConfig | null;
  children: ReactNode;
}) {
  const [override, setOverride] = useState<PwaConfig | null>(null);

  useEffect(() => {
    // Hidrata con el último override cacheado (cubre el caso de navegación SPA
    // dentro del iframe donde el provider monta después del último dispatch).
    const cached = getCachedPwaOverride();
    if (cached) setOverride(cached as PwaConfig);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail === 'object') setOverride(detail as PwaConfig);
    };
    window.addEventListener(PWA_CONFIG_OVERRIDE_EVENT, handler);
    return () => window.removeEventListener(PWA_CONFIG_OVERRIDE_EVENT, handler);
  }, []);

  const pwa = override ?? initial;
  return (
    <PwaBridgeContext.Provider value={{ pwa, isOverridden: override !== null }}>
      {children}
    </PwaBridgeContext.Provider>
  );
}

/** Slice `features.pwa` efectivo (override del Studio o el del server). */
export function usePwaConfig(): PwaConfig | null {
  return useContext(PwaBridgeContext).pwa;
}

/**
 * True si la PWA corre embebida en el editor del Studio con un override activo.
 * Útil para suprimir comportamientos de runtime que estorban al editar (p. ej.
 * el auto-advance del Welcome splash hacia Login).
 */
export function usePwaIsOverridden(): boolean {
  return useContext(PwaBridgeContext).isOverridden;
}

/**
 * Lee una sección del slice PWA con preview live. `fallback` es el valor que
 * la pantalla ya recibe por props del server — se usa cuando no hay override
 * (runtime normal) o la sección no está presente en el override.
 */
export function usePwaSection<K extends keyof PwaConfig>(
  key: K,
  fallback: PwaConfig[K],
): PwaConfig[K] {
  const { pwa } = useContext(PwaBridgeContext);
  const fromBridge = pwa?.[key];
  return (fromBridge ?? fallback) as PwaConfig[K];
}
