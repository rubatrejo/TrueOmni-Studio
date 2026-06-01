/**
 * Helpers de fechas para el módulo Events.
 *
 * Todas las fechas se manipulan como ISO 'YYYY-MM-DD' (sin hora) para evitar
 * problemas de timezone al comparar días. Las funciones que pasan por `Date`
 * usan UTC para los cálculos aritméticos (add days, add weeks) de forma que
 * el resultado no derive por DST.
 */

const WEEKDAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const WEEKDAYS_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Construye `YYYY-MM-DD` desde componentes UTC. */
function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Descompone un ISO 'YYYY-MM-DD' en {y, m, d}. */
function parseIso(iso: string): { y: number; m: number; d: number } {
  const [yStr, mStr, dStr] = iso.split('-');
  return { y: Number(yStr), m: Number(mStr), d: Number(dStr) };
}

/** Fecha "hoy" como ISO 'YYYY-MM-DD', en el timezone dado (default local). */
export function todayISO(timezone?: string): string {
  const now = new Date();
  if (timezone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    // en-CA produce 'YYYY-MM-DD'
    return parts;
  }
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Día de la semana 0..6 (domingo=0) para un ISO. */
export function weekdayOf(iso: string): number {
  const { y, m, d } = parseIso(iso);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Devuelve ISO + delta días (UTC arithmetic). */
export function addDays(iso: string, delta: number): string {
  const { y, m, d } = parseIso(iso);
  const t = Date.UTC(y, m - 1, d + delta);
  const dt = new Date(t);
  return toIso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** Devuelve ISO + delta semanas. */
export function addWeeks(iso: string, delta: number): string {
  return addDays(iso, delta * 7);
}

/** Domingo de la semana que contiene `iso`. */
export function weekStartOf(iso: string): string {
  const weekday = weekdayOf(iso);
  return addDays(iso, -weekday);
}

/** Los 7 ISOs de la semana que empieza en `weekStart` (domingo..sábado). */
export function eachDayOfWeek(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/** "FEBRUARY 6 – FEBRUARY 12" (mayúsculas, sin año). */
export function formatWeekRange(weekStart: string): string {
  const end = addDays(weekStart, 6);
  const { y: sy, m: sm, d: sd } = parseIso(weekStart);
  const { y: ey, m: em, d: ed } = parseIso(end);
  const startLabel = `${MONTHS_LONG[sm - 1]} ${sd}`;
  const endLabel = sm === em && sy === ey ? `${ed}` : `${MONTHS_LONG[em - 1]} ${ed}`;
  return `${startLabel.toUpperCase()} – ${endLabel.toUpperCase()}`;
}

/** Componentes del day label: "Thursday" + 27. */
export function formatDayLabel(iso: string): { weekdayLong: string; dayNumber: number } {
  const { d } = parseIso(iso);
  const idx = weekdayOf(iso);
  return { weekdayLong: WEEKDAYS_LONG[idx], dayNumber: d };
}

/** Label pill: 'SUN', 'MON'… */
export function weekdayShort(iso: string): string {
  return WEEKDAYS_SHORT[weekdayOf(iso)];
}

/** "February 27, 2026" — para el detail. */
export function formatEventDateLong(iso: string): string {
  const { y, m, d } = parseIso(iso);
  return `${MONTHS_LONG[m - 1]} ${d}, ${y}`;
}

/** "Feb 27" — para cards compactas si se usa. */
export function formatEventDateShort(iso: string): string {
  const { m, d } = parseIso(iso);
  return `${MONTHS_SHORT[m - 1]} ${d}`;
}

/** "October 7" — mes largo + día, sin año (para la card/detail). */
export function formatEventDateMonthDay(iso: string): string {
  const { m, d } = parseIso(iso);
  return `${MONTHS_LONG[m - 1]} ${d}`;
}

/** Componentes del marcador de la timeline: 7 + "OCT" (mes corto en mayúsculas). */
export function formatTimelineDate(iso: string): { day: number; monthShort: string } {
  const { m, d } = parseIso(iso);
  return { day: d, monthShort: MONTHS_SHORT[m - 1].toUpperCase() };
}

/** "Wednesday, October 7, 8:00 PM" — línea de fecha/hora de la card de evento. */
export function formatEventCardWhen(iso: string, startHHMM: string): string {
  const { weekdayLong } = formatDayLabel(iso);
  const time = formatTime12(startHHMM).toUpperCase();
  return `${weekdayLong}, ${formatEventDateMonthDay(iso)}, ${time}`;
}

/** "7:00 pm · 10:00 pm" / "7:00 – 10:00 PM" helpers. */
export function formatTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "7:00 – 10:00 PM" — rango unificado (usa el suffix del fin). */
export function formatTimeRange(startHHMM: string, endHHMM: string): string {
  const start = formatTime12(startHHMM);
  const end = formatTime12(endHHMM);
  const startHour = Number(startHHMM.split(':')[0]);
  const endHour = Number(endHHMM.split(':')[0]);
  const startSuffix = startHour >= 12 ? 'pm' : 'am';
  const endSuffix = endHour >= 12 ? 'pm' : 'am';
  if (startSuffix === endSuffix) {
    // "7:00 – 10:00 PM"
    const startNoSuffix = start.replace(/\s[ap]m$/i, '');
    return `${startNoSuffix} – ${end.toUpperCase()}`;
  }
  return `${start.toUpperCase()} – ${end.toUpperCase()}`;
}
