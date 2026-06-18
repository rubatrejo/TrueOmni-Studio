'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  PWA_ACTIVE_SECTION_EVENT,
  PWA_CONFIG_OVERRIDE_EVENT,
  PWA_KIOSK_MODULES_EVENT,
  getCachedPwaActiveSection,
  getCachedPwaKioskModules,
  getCachedPwaOverride,
} from '@/components/studio-bridge';
import type { PwaConfig } from '@/lib/config';
import { isPwaModuleVisible } from '@/lib/pwa-module-visibility';
import type { SystemModules } from '@/lib/studio/schema';

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
  /**
   * `systemModules` del Kiosk del cliente (fuente de la herencia de visibilidad).
   * En producción viene del server (`initialKioskSystemModules`); en el preview
   * llega por el bridge junto al slice PWA.
   */
  kioskSystemModules: Partial<SystemModules> | null;
};

const PwaBridgeContext = createContext<PwaBridgeContextValue>({
  pwa: null,
  isOverridden: false,
  activeSection: null,
  kioskSystemModules: null,
});

export function PwaBridgeProvider({
  initial,
  initialKioskSystemModules = null,
  children,
}: {
  initial: PwaConfig | null;
  /** `systemModules` del Kiosk del cliente (server-side) para la herencia. */
  initialKioskSystemModules?: Partial<SystemModules> | null;
  children: ReactNode;
}) {
  const [override, setOverride] = useState<PwaConfig | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [kioskModulesOverride, setKioskModulesOverride] = useState<Partial<SystemModules> | null>(
    null,
  );

  useEffect(() => {
    // Hidrata con el último override cacheado (cubre el caso de navegación SPA
    // dentro del iframe donde el provider monta después del último dispatch).
    const cached = getCachedPwaOverride();
    if (cached) setOverride(cached as PwaConfig);
    const cachedSection = getCachedPwaActiveSection();
    if (cachedSection) setActiveSection(cachedSection);
    const cachedKiosk = getCachedPwaKioskModules();
    if (cachedKiosk) setKioskModulesOverride(cachedKiosk as Partial<SystemModules>);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail === 'object') setOverride(detail as PwaConfig);
    };
    const sectionHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'string') setActiveSection(detail);
    };
    const kioskHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail === 'object')
        setKioskModulesOverride(detail as Partial<SystemModules>);
    };
    window.addEventListener(PWA_CONFIG_OVERRIDE_EVENT, handler);
    window.addEventListener(PWA_ACTIVE_SECTION_EVENT, sectionHandler);
    window.addEventListener(PWA_KIOSK_MODULES_EVENT, kioskHandler);
    return () => {
      window.removeEventListener(PWA_CONFIG_OVERRIDE_EVENT, handler);
      window.removeEventListener(PWA_ACTIVE_SECTION_EVENT, sectionHandler);
      window.removeEventListener(PWA_KIOSK_MODULES_EVENT, kioskHandler);
    };
  }, []);

  const pwa = override ?? initial;
  const kioskSystemModules = kioskModulesOverride ?? initialKioskSystemModules;
  return (
    <PwaBridgeContext.Provider
      value={{ pwa, isOverridden: override !== null, activeSection, kioskSystemModules }}
    >
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

/**
 * Visibilidad EFECTIVA de un módulo en la PWA, reactiva al editor:
 * override manual (`pwa.moduleVisibility`) → herencia del Kiosk (`systemModules`)
 * → default ON. Funciona en producción (config del server) y en el preview
 * (override + kioskSystemModules del bridge). Las superficies del runtime
 * (dashboard, quick-access, bottom nav, rutas) la usan para ocultar módulos off.
 */
export function usePwaModuleVisible(moduleKey: string): boolean {
  const { pwa, kioskSystemModules } = useContext(PwaBridgeContext);
  return isPwaModuleVisible(moduleKey, {
    kioskSystemModules,
    pwaModuleVisibility: pwa?.moduleVisibility ?? null,
  });
}

/**
 * Devuelve un predicado `(moduleKey) => boolean` para resolver visibilidad de
 * VARIOS módulos sin violar las reglas de hooks (lee el contexto una vez). Lo
 * usan las superficies que iteran listas (dashboard tiles, quick-access).
 */
export function usePwaModuleVisibility(): (moduleKey: string) => boolean {
  const { pwa, kioskSystemModules } = useContext(PwaBridgeContext);
  const visibility = pwa?.moduleVisibility ?? null;
  return (moduleKey: string) =>
    isPwaModuleVisible(moduleKey, { kioskSystemModules, pwaModuleVisibility: visibility });
}
