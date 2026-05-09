/**
 * Formatters de fecha/hora para el módulo signage. Locale + timezone aware
 * vía `Intl.DateTimeFormat`. Devuelven exactamente los strings que el SVG
 * del header espera reproducir (ej: "3:08 PM", "Mon Apr 15", "FRI").
 *
 * Nota: `Intl.DateTimeFormat` puede devolver caracteres Unicode whitespace
 * distintos entre el ICU de Node (server) y el del navegador (client) —
 * típicamente narrow no-break space (U+202F) y no-break space (U+00A0) en
 * locales como `es-ES` antes/después de "a. m." / "p. m.". Esto provoca
 * hydration mismatch en SSR. Normalizamos a regular space (ASCII 0x20).
 */

export function normalizeIntlWhitespace(str: string): string {
  //   = non-break space,   = narrow no-break space,   = thin space.
  return str.replace(/[   ]/g, ' ');
}

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
  return normalizeIntlWhitespace(fmt.format(date));
}

export function formatSignageDate(date: Date, locale: string, timezone: string): string {
  const fmt = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  });
  // Algunos locales devuelven con coma (en-US: "Mon, Apr 15"). El SVG no lleva
  // coma → la quitamos para reproducir verbatim.
  return normalizeIntlWhitespace(fmt.format(date)).replace(',', '');
}

/**
 * Devuelve el día de la semana abreviado en uppercase 3-letras (FRI, SAT, SUN
 * en `en`; VIE, SÁB, DOM en `es`). El SVG usa esta forma exactamente.
 */
export function formatDayAbbr(date: Date, locale: string, timezone: string): string {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: timezone });
  return normalizeIntlWhitespace(fmt.format(date)).toUpperCase().slice(0, 3);
}
