'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  PWA_ACTIVE_SECTION_EVENT,
  PWA_CONFIG_OVERRIDE_EVENT,
  getCachedPwaActiveSection,
  getCachedPwaOverride,
} from '@/components/studio-bridge';
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
  /** Sección del editor PWA activa ahora mismo, o `null` fuera del Studio. */
  activeSection: string | null;
};

const PwaBridgeContext = createContext<PwaBridgeContextValue>({
  pwa: null,
  isOverridden: false,
  activeSection: null,
});

export function PwaBridgeProvider({
  initial,
  children,
}: {
  initial: PwaConfig | null;
  children: ReactNode;
}) {
  const [override, setOverride] = useState<PwaConfig | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    // Hidrata con el último override cacheado (cubre el caso de navegación SPA
    // dentro del iframe donde el provider monta después del último dispatch).
    const cached = getCachedPwaOverride();
    if (cached) setOverride(cached as PwaConfig);
    const cachedSection = getCachedPwaActiveSection();
    if (cachedSection) setActiveSection(cachedSection);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail === 'object') setOverride(detail as PwaConfig);
    };
    const sectionHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'string') setActiveSection(detail);
    };
    window.addEventListener(PWA_CONFIG_OVERRIDE_EVENT, handler);
    window.addEventListener(PWA_ACTIVE_SECTION_EVENT, sectionHandler);
    return () => {
      window.removeEventListener(PWA_CONFIG_OVERRIDE_EVENT, handler);
      window.removeEventListener(PWA_ACTIVE_SECTION_EVENT, sectionHandler);
    };
  }, []);

  const pwa = override ?? initial;
  return (
    <PwaBridgeContext.Provider value={{ pwa, isOverridden: override !== null, activeSection }}>
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
 * Sección del editor PWA activa ahora mismo (`null` fuera del Studio). Permite
 * que una pantalla congele un comportamiento de runtime SOLO cuando se la está
 * editando, sin romper el flujo del preview en el resto de secciones (F-PWA-2).
 */
export function usePwaActiveSection(): string | null {
  return useContext(PwaBridgeContext).activeSection;
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
