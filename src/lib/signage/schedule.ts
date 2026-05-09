/**
 * Dayparting helpers para el módulo signage (DS13).
 *
 * Evalúa si un slide debe mostrarse en un momento dado, respetando el
 * wall-clock del cliente (`client.timezone`). Soporta los 3 kinds del schema:
 *
 *  - `always`     → siempre activo.
 *  - `hours`      → ventana HH:MM dentro del día. Soporta wrap medianoche.
 *                   Si `daysOfWeek` está presente, también valida el día (0=Sun..6=Sat).
 *  - `date-range` → ventana de fechas YYYY-MM-DD inclusive en ambos extremos.
 *
 * También expone `getNowFromSearch` para soportar el dev override
 * `?clock=HH:MM&day=YYYY-MM-DD` que se usa en QA del gate (DS15).
 */
import type { SignageSlideSchedule } from './schema';

interface WallClockParts {
  /** YYYY-MM-DD en timezone del cliente. */
  isoDay: string;
  /** HH:MM en timezone del cliente, 24h. */
  hhmm: string;
  /** 0=Sun..6=Sat. */
  weekday: number;
}

/**
 * Extrae los componentes wall-clock de un Date en una timezone específica.
 * Usa `Intl.DateTimeFormat` con `formatToParts` para evitar parsing manual.
 */
function getWallClockParts(now: Date, timezone: string): WallClockParts {
  const dateFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const weekdayFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });

  // en-CA → "YYYY-MM-DD"
  const isoDay = dateFmt.format(now);

  // en-GB con hour12:false → "HH:MM" (excepto 24:00 que algunos engines devuelven en lugar de 00:00)
  const rawTime = timeFmt.format(now);
  const hhmm = rawTime.startsWith('24:') ? `00:${rawTime.slice(3)}` : rawTime;

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = weekdayMap[weekdayFmt.format(now)] ?? 0;

  return { isoDay, hhmm, weekday };
}

/**
 * Compara dos strings HH:MM lexicográficamente. Como ambos están en formato
 * 24h zero-padded, el orden lex coincide con el cronológico.
 */
export function isInTimeWindow(now: string, start: string, end: string): boolean {
  if (start === end) {
    // Ventana degenerada: tratar como "siempre".
    return true;
  }
  if (start < end) {
    return now >= start && now < end;
  }
  // Wrap medianoche (ej. 22:00 → 06:00).
  return now >= start || now < end;
}

export function isSlideActive(
  schedule: SignageSlideSchedule,
  now: Date,
  timezone: string,
): boolean {
  if (schedule.kind === 'always') return true;

  const { isoDay, hhmm, weekday } = getWallClockParts(now, timezone);

  if (schedule.kind === 'hours') {
    if (!schedule.startTime || !schedule.endTime) return true;
    if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
      if (!schedule.daysOfWeek.includes(weekday)) return false;
    }
    return isInTimeWindow(hhmm, schedule.startTime, schedule.endTime);
  }

  if (schedule.kind === 'date-range') {
    const start = schedule.startDate;
    const end = schedule.endDate;
    if (start && isoDay < start) return false;
    if (end && isoDay > end) return false;
    // Si dentro del rango además hay startTime/endTime, aplicar como en 'hours'.
    if (schedule.startTime && schedule.endTime) {
      return isInTimeWindow(hhmm, schedule.startTime, schedule.endTime);
    }
    return true;
  }

  return true;
}

/**
 * Lee dev override `?clock=HH:MM` y `?day=YYYY-MM-DD` para fabricar un `Date`
 * que represente el wall-clock dado en `timezone`. Si solo `clock` está, usa
 * el día actual. Si solo `day` está, usa 12:00 de ese día. Sin parámetros →
 * `new Date()`.
 *
 * Implementación: construye una fecha UTC con los componentes que, una vez
 * formateados en `timezone`, devuelven el wall-clock requerido. Hace ajuste
 * iterativo (1 iteración basta porque los offsets de TZ son constantes en
 * tramos de horas, salvo DST transition; aceptable para dev override).
 */
export function getNowFromSearch(searchParams: URLSearchParams | null, timezone: string): Date {
  if (!searchParams) return new Date();
  const clock = searchParams.get('clock');
  const day = searchParams.get('day');
  if (!clock && !day) return new Date();

  const now = new Date();
  const baseDay = day ?? getWallClockParts(now, timezone).isoDay;
  const [hh, mm] = (clock ?? '12:00').split(':');
  const hours = Number.parseInt(hh ?? '12', 10);
  const minutes = Number.parseInt(mm ?? '00', 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return now;

  // Construir candidate UTC asumiendo que el wall-clock de la TZ es ~ UTC.
  // Luego ajustar por la diferencia detectada al re-formatear en TZ.
  const [yyyy, mo, dd] = baseDay.split('-').map((s) => Number.parseInt(s, 10));
  if (!yyyy || !mo || !dd) return now;
  const candidate = new Date(Date.UTC(yyyy, mo - 1, dd, hours, minutes, 0, 0));
  const parts = getWallClockParts(candidate, timezone);
  const [actualHh, actualMm] = parts.hhmm.split(':').map((s) => Number.parseInt(s, 10));
  const targetMinutes = hours * 60 + minutes;
  const actualMinutes = (actualHh ?? 0) * 60 + (actualMm ?? 0);
  const driftMinutes = targetMinutes - actualMinutes;
  if (driftMinutes === 0) return candidate;
  return new Date(candidate.getTime() + driftMinutes * 60_000);
}

/**
 * Calcula los ms hasta el inicio del siguiente minuto. Útil para alinear el
 * tick de re-evaluación al boundary del minuto exacto.
 */
export function msUntilNextMinute(now: Date): number {
  const seconds = now.getSeconds();
  const ms = now.getMilliseconds();
  return (60 - seconds) * 1000 - ms;
}

/**
 * Devuelve true si el wall-clock actual en `timezone` cae dentro de la ventana
 * sleep `[startTime, endTime)`. Reusable para `<SignageSleepGate>`.
 */
export function isInSleepWindow(
  now: Date,
  timezone: string,
  startTime: string,
  endTime: string,
): boolean {
  const { hhmm } = getWallClockParts(now, timezone);
  return isInTimeWindow(hhmm, startTime, endTime);
}
