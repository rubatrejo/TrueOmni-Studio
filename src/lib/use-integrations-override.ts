'use client';

/**
 * Hook que devuelve el último override de `integrations` recibido del Studio
 * vía `kiosk:integrations-override`, mergeado con el valor inicial del SSR.
 *
 * Hallazgo #14 del audit Studio (2026-05-05): cambiar Mapbox token / GA4 / etc.
 * en el editor no se reflejaba en el iframe sin reload. El bridge ya emite
 * el override; este hook lo consume desde los componentes runtime.
 *
 * El payload del override viene filtrado por `sendIntegrationsNow` en
 * `_lib/use-preview-bridge.ts` — apiKeys sensibles (Tavus, Bandwango,
 * CrowdRiff, Viator, Satisfi) NO cruzan al iframe. Solo Mapbox token,
 * Weather provider/city/units, GA4 id.
 */

import { useEffect, useState } from 'react';

export interface IntegrationsOverridePatch {
  mapbox?: { token: string };
  weather?: { provider: string; city: string; units: string };
  analytics?: { gaId: string };
}

const EVENT_NAME = 'kiosk:integrations-override';
const WINDOW_KEY = '__kioskIntegrationsOverride';

function readCachedOverride(): IntegrationsOverridePatch | null {
  if (typeof window === 'undefined') return null;
  const v = (window as unknown as Record<string, unknown>)[WINDOW_KEY];
  return v && typeof v === 'object' ? (v as IntegrationsOverridePatch) : null;
}

/**
 * Devuelve el patch más reciente, mergeado superficialmente con `initial`.
 *
 * @param initial Valor server-side (typicamente `config.integraciones` del
 *   kiosk activo). El hook ignora cambios subsecuentes en `initial` para
 *   evitar dependencias profundas; el bridge es la única fuente reactiva.
 */
export function useIntegrationsOverride<T extends IntegrationsOverridePatch>(
  initial: T | undefined,
): T | IntegrationsOverridePatch | undefined {
  const [override, setOverride] = useState<IntegrationsOverridePatch | null>(() =>
    readCachedOverride(),
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<unknown>).detail;
      if (detail && typeof detail === 'object') {
        setOverride(detail as IntegrationsOverridePatch);
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  if (!override) return initial;

  // Merge: el override pisa campo por campo (no profundo).
  return {
    ...(initial ?? {}),
    ...(override.mapbox !== undefined ? { mapbox: override.mapbox } : {}),
    ...(override.weather !== undefined ? { weather: override.weather } : {}),
    ...(override.analytics !== undefined ? { analytics: override.analytics } : {}),
  } as T | IntegrationsOverridePatch;
}

/**
 * Helper específico para componentes que solo necesitan el token Mapbox
 * (caso más común). Devuelve el override si está set, si no el inicial.
 */
export function useMapboxTokenOverride(initial: string | undefined): string | undefined {
  const [token, setToken] = useState<string | undefined>(() => {
    const cached = readCachedOverride();
    return cached?.mapbox?.token || initial;
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<unknown>).detail as IntegrationsOverridePatch | null;
      if (detail?.mapbox?.token !== undefined) {
        setToken(detail.mapbox.token || undefined);
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  return token;
}
