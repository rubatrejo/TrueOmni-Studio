import { useEffect, useState } from 'react';

import { formatSignageClock, formatSignageDate } from '@/lib/signage/dates';

export interface SignageClockState {
  clockText: string;
  dateText: string;
}

/**
 * Hook live que devuelve `clockText` y `dateText` formateados según locale +
 * timezone del cliente signage. Refresca cada 1s para mantener el segundo
 * exacto. NO renderea nada — solo retorna strings.
 *
 * Acepta valor inicial (computed server-side) para evitar flash de hidratación.
 */
export function useSignageClock(
  initialState: SignageClockState,
  locale: string,
  timezone: string,
  clockFormat: '12h' | '24h',
): SignageClockState {
  const [state, setState] = useState<SignageClockState>(initialState);

  useEffect(() => {
    function tick() {
      const now = new Date();
      setState({
        clockText: formatSignageClock(now, locale, timezone, clockFormat),
        dateText: formatSignageDate(now, locale, timezone),
      });
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [locale, timezone, clockFormat]);

  return state;
}
