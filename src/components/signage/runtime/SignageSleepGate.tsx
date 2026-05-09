'use client';

import { useEffect, useRef, useState } from 'react';

import { isInSleepWindow, msUntilNextMinute } from '@/lib/signage/schedule';
import type { SignageDisplaySettings } from '@/lib/signage/schema';

/**
 * `<SignageSleepGate>` — overlay black-screen cuando el display está dentro
 * de su `sleepSchedule` window (DS14).
 *
 * Re-evalúa cada minuto alineado al boundary HH:MM:00 (mismo patrón que el
 * dayparting). Cubre header + body con z-50: un display dormido es uniforme.
 *
 * Si `sleepSchedule.enabled === false` o el schema no define `sleepSchedule`,
 * el componente no renderiza nada (overhead nulo).
 *
 * Insertarlo como hermano del flex container del runtime, que debe ser
 * `position: relative`.
 */
export interface SignageSleepGateProps {
  sleepSchedule: SignageDisplaySettings['sleepSchedule'];
  timezone: string;
}

export function SignageSleepGate({ sleepSchedule, timezone }: SignageSleepGateProps) {
  const enabled = sleepSchedule?.enabled === true;
  const startTime = sleepSchedule?.startTime;
  const endTime = sleepSchedule?.endTime;

  const [isAsleep, setIsAsleep] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !startTime || !endTime) {
      setIsAsleep(false);
      return;
    }

    const start = startTime;
    const end = endTime;

    function evaluate() {
      setIsAsleep(isInSleepWindow(new Date(), timezone, start, end));
    }

    evaluate();
    let cancelled = false;

    function schedule() {
      const delay = msUntilNextMinute(new Date());
      tickRef.current = window.setTimeout(() => {
        if (cancelled) return;
        evaluate();
        schedule();
      }, delay);
    }

    schedule();

    return () => {
      cancelled = true;
      if (tickRef.current !== null) {
        window.clearTimeout(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [enabled, startTime, endTime, timezone]);

  if (!isAsleep) return null;
  return (
    <div className="absolute inset-0 z-50 bg-black" aria-hidden="true" data-signage-sleep="true" />
  );
}
