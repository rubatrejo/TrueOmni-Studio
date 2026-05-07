/**
 * Formatters de fecha/hora para el módulo signage. Locale + timezone aware
 * vía `Intl.DateTimeFormat`. Devuelven exactamente los strings que el SVG
 * del header espera reproducir (ej: "3:08 PM", "Mon Apr 15", "FRI").
 */

export function formatSignageClock(
  date: Date,
  locale: string,
  timezone: string,
  clockFormat: '12h' | '24h',
): string {
  const fmt = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: clockFormat === '12h',
    timeZone: timezone,
  });
  return fmt.format(date);
}

export function formatSignageDate(
  date: Date,
  locale: string,
  timezone: string,
): string {
  const fmt = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  });
  // Algunos locales devuelven con coma (en-US: "Mon, Apr 15"). El SVG no lleva
  // coma → la quitamos para reproducir verbatim.
  return fmt.format(date).replace(',', '');
}

/**
 * Devuelve el día de la semana abreviado en uppercase 3-letras (FRI, SAT, SUN
 * en `en`; VIE, SÁB, DOM en `es`). El SVG usa esta forma exactamente.
 */
export function formatDayAbbr(date: Date, locale: string, timezone: string): string {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: timezone });
  return fmt.format(date).toUpperCase().slice(0, 3);
}
