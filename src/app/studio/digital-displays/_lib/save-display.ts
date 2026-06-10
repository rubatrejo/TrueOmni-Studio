'use client';

import { useEffect, useRef } from 'react';

import type { SignageDisplayConfig } from '@/lib/signage/schema';

/**
 * Helpers de persistencia del display draft al KV via API (DSS4).
 *
 * - `saveDisplay(client, display)` envía PUT a la API y devuelve la response.
 * - `useDebouncedAutosave` agenda un save 1s después del último cambio del
 *   draft, siempre que `dirty` sea true. Cancela ticks pendientes ante
 *   nuevos cambios.
 */

export interface SaveDisplayResult {
  ok: boolean;
  error?: string;
}

export async function saveDisplay(
  clientSlug: string,
  display: SignageDisplayConfig,
): Promise<SaveDisplayResult> {
  try {
    const res = await fetch(
      `/api/studio/signage/displays/${encodeURIComponent(clientSlug)}/${encodeURIComponent(display.slug)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display }),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Hook autosave: cuando `dirty` es true, agenda `onSave` con debounce.
 * Si el draft cambia antes del timeout, cancela el anterior y agenda otro.
 */
export function useDebouncedAutosave(
  trigger: unknown,
  dirty: boolean,
  onSave: () => void,
  delayMs: number = 1000,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // F-SIGNAGE-7: el efecto solo depende de [trigger, dirty], así que sin este
  // ref el setTimeout cerraría sobre la PRIMERA versión de `onSave` (closure
  // stale) y podría persistir un draft viejo. El ref se actualiza cada render
  // para que al disparar el debounce se llame siempre la última `onSave`.
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  useEffect(() => {
    if (!dirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onSaveRef.current();
    }, delayMs);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, dirty]);
}
