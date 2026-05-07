import { normalizeIntlWhitespace } from './dates';

/**
 * Helpers de texto/fecha compartidos por templates de signage que renderean
 * eventos. Originalmente duplicados verbatim en `01-full-events.tsx` y
 * `04-video-events-ad.tsx`; factorados aquí tras DS15 (tech debt).
 */

export interface DayLabel {
  weekday: string;
  day: string;
}

/**
 * Parsea un ISO local sin sufijo de timezone como wall-clock del cliente
 * (NO convierte zonas). El operador espera que `2026-05-09T11:00:00` se
 * muestre como `11:00 am` independientemente de la zona del servidor o del
 * navegador. Para lograrlo: parseamos como UTC y formateamos como UTC, y
 * lo que pintamos es la hora literal del ISO.
 */
export function parseAsWallClock(iso: string): Date {
  const hasTz = /Z|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasTz ? iso : iso + 'Z');
}

export function formatDayLabel(iso: string, locale: string): DayLabel {
  const date = parseAsWallClock(iso);
  return {
    weekday: normalizeIntlWhitespace(
      new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(date),
    ),
    day: normalizeIntlWhitespace(
      new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone: 'UTC' }).format(date),
    ),
  };
}

export function formatTime(iso: string, locale: string): string {
  const date = parseAsWallClock(iso);
  return normalizeIntlWhitespace(
    new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    }).format(date),
  )
    .replace(' AM', ' am')
    .replace(' PM', ' pm');
}

/**
 * Wrap de un title corto a 2 líneas. Si cabe en `maxChars` queda 1 línea;
 * si no, parte en el último espacio antes de `maxChars`.
 */
export function wrapTitle(title: string, maxChars: number): [string, string] {
  if (title.length <= maxChars) return [title, ''];
  const breakIdx = title.lastIndexOf(' ', maxChars);
  if (breakIdx === -1) return [title.slice(0, maxChars), title.slice(maxChars)];
  return [title.slice(0, breakIdx), title.slice(breakIdx + 1)];
}
