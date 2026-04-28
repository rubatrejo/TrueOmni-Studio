'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook de reset por inactividad del kiosk.
 *
 * Comportamiento:
 *   1. Cuenta segundos sin interacción (mousemove, click, touch, key, scroll).
 *   2. Cuando llega a `idleSeconds`, dispara el modal de aviso.
 *   3. El modal tiene un countdown de `warningSeconds`. Cualquier
 *      interacción durante el aviso lo descarta y reinicia el contador.
 *   4. Si el countdown llega a 0 sin interacción, llama `onTimeout`.
 *
 * El consumer (`<IdleTimeoutOverlay>`) controla qué hace al timeout:
 *   - Resetear el locale al default.
 *   - Navegar a `/` (idle/Billboard).
 *
 * @param idleSeconds tiempo total sin interacción antes de mostrar aviso.
 * @param warningSeconds duración del countdown del aviso.
 * @param onTimeout callback cuando llega a 0 sin interacción.
 */
export function useIdleReset({
  idleSeconds,
  warningSeconds,
  onTimeout,
  enabled = true,
}: {
  idleSeconds: number;
  warningSeconds: number;
  onTimeout: () => void;
  enabled?: boolean;
}) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(warningSeconds);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const clearAll = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownTickRef.current) clearInterval(countdownTickRef.current);
    idleTimerRef.current = null;
    countdownTickRef.current = null;
  }, []);

  const dismiss = useCallback(() => {
    setShowWarning(false);
    setSecondsLeft(warningSeconds);
    clearAll();
    if (!enabled) return;
    idleTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, idleSeconds * 1000);
  }, [idleSeconds, warningSeconds, clearAll, enabled]);

  // Inicia el contador de inactividad al montar.
  useEffect(() => {
    if (!enabled) {
      clearAll();
      setShowWarning(false);
      return;
    }
    idleTimerRef.current = setTimeout(() => setShowWarning(true), idleSeconds * 1000);
    return clearAll;
  }, [idleSeconds, enabled, clearAll]);

  // Listeners de actividad. Cualquier interacción reinicia el timer.
  useEffect(() => {
    if (!enabled) return;
    const reset = () => {
      // Solo reinicia si el aviso NO está visible. Si está visible, la
      // interacción se considera explícita y la maneja el componente vía dismiss.
      if (showWarning) return;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setShowWarning(true), idleSeconds * 1000);
    };
    const events: (keyof DocumentEventMap)[] = [
      'mousemove',
      'mousedown',
      'touchstart',
      'keydown',
      'scroll',
      'click',
    ];
    events.forEach((e) => document.addEventListener(e, reset, { passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, reset));
  }, [idleSeconds, showWarning, enabled]);

  // Tick del countdown cuando el aviso está visible.
  useEffect(() => {
    if (!showWarning) return;
    setSecondsLeft(warningSeconds);
    countdownTickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (countdownTickRef.current) {
            clearInterval(countdownTickRef.current);
            countdownTickRef.current = null;
          }
          // Disparamos timeout en microtask siguiente para no romper el render.
          queueMicrotask(() => onTimeoutRef.current());
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (countdownTickRef.current) clearInterval(countdownTickRef.current);
    };
  }, [showWarning, warningSeconds]);

  return { showWarning, secondsLeft, dismiss };
}
