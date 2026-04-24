'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCountdownResult {
  /** Valor actual del countdown. `null` cuando no corre. */
  value: number | null;
  running: boolean;
  /** Dispara un countdown desde `seconds`. Llama `onDone` cuando llega a 0. */
  start: (seconds: number, onDone: () => void) => void;
  /** Cancela un countdown en curso sin llamar `onDone`. */
  cancel: () => void;
}

/**
 * Countdown regresivo con tick de 1 segundo. Cancelable. Usado por el Photo
 * Booth entre `'live'` y `'capturing'`.
 */
export function useCountdown(): UseCountdownResult {
  const [value, setValue] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef<(() => void) | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    doneRef.current = null;
    setValue(null);
  }, []);

  const start = useCallback(
    (seconds: number, onDone: () => void) => {
      cancel();
      doneRef.current = onDone;
      setValue(seconds);
      timerRef.current = setInterval(() => {
        setValue((v) => {
          if (v === null) return null;
          if (v <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            doneRef.current?.();
            doneRef.current = null;
            return null;
          }
          return v - 1;
        });
      }, 1000);
    },
    [cancel],
  );

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return { value, running: value !== null, start, cancel };
}
