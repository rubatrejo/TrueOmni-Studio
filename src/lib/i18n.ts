/**
 * Helpers client-safe del sistema multi-idioma.
 *
 * NO importa `node:fs` ni nada server-only para que pueda ser usado desde
 * client components. Las funciones server-only (`loadLocale`, `loadAllLocales`)
 * viven en `src/lib/i18n-server.ts`.
 */

export type LocaleStrings = Record<string, string>;

/**
 * Resuelve una key con fallback chain: `selected → defaultLocale → en → key`.
 * En modo dev emite un `console.warn` cuando la key cae al fallback.
 */
export function resolveString(
  key: string,
  active: LocaleStrings,
  defaultLocale: LocaleStrings,
  english: LocaleStrings,
  options?: { activeName?: string },
): string {
  if (key in active) return active[key]!;
  if (key in defaultLocale) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[i18n] key "${key}" missing in "${options?.activeName ?? 'active'}" — using default locale fallback`,
      );
    }
    return defaultLocale[key]!;
  }
  if (key in english) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[i18n] key "${key}" missing — using English fallback`);
    }
    return english[key]!;
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[i18n] key "${key}" not found in any locale`);
  }
  return key;
}

/** Mapa de locale → label nativo para el dropdown del kiosk. */
export const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ja: '日本語',
};
