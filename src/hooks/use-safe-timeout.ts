'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * `setTimeout` seguro para callbacks que hacen `setState`/navegan tras un delay: cancela
 * el timer pendiente si se vuelve a llamar y, sobre todo, en el unmount del componente
 * (evita actualizar estado de un componente desmontado) — C6 de la auditoría.
 *
 * Un solo timer activo a la vez por instancia (suficiente para los popups/overlays de
 * la PWA). Devuelve `schedule(fn, ms)`.
 */
export function useSafeTimeout(): (fn: () => void, ms: number) => void {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (ref.current) clearTimeout(ref.current);
    },
    [],
  );

  return useCallback((fn: () => void, ms: number) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(fn, ms);
  }, []);
}
