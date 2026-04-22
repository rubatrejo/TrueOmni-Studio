import type { DayOpen, EventItem, Listing } from './config';
import { formatTime12 } from './events-date';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
type DayKey = (typeof DAY_KEYS)[number];

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
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

function formatHourFractional(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return formatTime12(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
}

/**
 * Deriva "Open until 11:00 pm" para un listing si `openHours` está disponible y
 * hoy está abierto. Si no, cae a `listing.hours` raw (p.ej. "7 am – 11 pm").
 */
export function openTodayLabel(listing: Listing, prefix = 'Open until', now = new Date()): string {
  if (!listing.openHours) return listing.hours;
  const todayKey = DAY_KEYS[now.getDay()] as DayKey;
  const today: DayOpen | undefined = listing.openHours[todayKey];
  if (!today) return listing.hours;
  const [, close] = today;
  return `${prefix} ${formatHourFractional(close)}`;
}

/** "Fri, Dec 10 · 7 pm" para cards y burbujas del Map. */
export function eventDateLabel(ev: EventItem): string {
  const [yStr, mStr, dStr] = ev.date.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  const weekday = WEEKDAYS_SHORT[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const month = MONTHS_SHORT[m - 1];
  const time = formatTime12(ev.startTime);
  return `${weekday}, ${month} ${d} · ${time}`;
}
