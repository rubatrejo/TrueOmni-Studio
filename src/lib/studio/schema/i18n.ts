import { z } from 'zod';

/* ────────────────────────────────────────────────────────────────────────── */
/*  i18n bundle (vive en KV bajo `i18n:<slug>`, separado del KioskConfig)    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Locales por defecto al crear un kiosk nuevo. El operador puede añadir
 * cualquier ISO 639-1 vía el AddLanguageModal del Studio. **`en` es
 * canonical** y no se puede borrar (enforced en UI + backend).
 */
export const DEFAULT_LOCALES = ['en', 'es', 'fr', 'de', 'pt', 'ja'] as const;

/**
 * @deprecated Usar `DEFAULT_LOCALES` para factory defaults o `Object.keys(bundle)`
 *             para iterar locales reales del kiosk activo. `LOCALES` solo se
 *             mantiene como alias de back-compat — el sistema soporta locales
 *             dinámicos desde 2026-05.
 */
export const LOCALES = DEFAULT_LOCALES;

/**
 * Type loose: cualquier código ISO 639-1 (string). Antes era un union estricto
 * de los 6 default locales; ahora el operador puede añadir cualquier idioma.
 * Para validar formato ISO usar `LOCALE_CODE_REGEX` de `locale-catalog.ts`.
 */
export type Locale = string;

const LocaleStringsSchema = z.record(z.string(), z.string().max(2000));
export type LocaleStrings = z.infer<typeof LocaleStringsSchema>;

/**
 * Bundle dinámico: cualquier locale code es key válida. El kiosk runtime
 * (`i18n-provider.tsx`) ya itera con `Object.keys` y hace fallback a
 * `defaultLocale` y luego a `en` para keys missing.
 */
export const I18nBundleSchema = z.record(z.string(), LocaleStringsSchema);
export type I18nBundle = z.infer<typeof I18nBundleSchema>;

export function defaultI18nBundle(): I18nBundle {
  return { en: {}, es: {}, fr: {}, de: {}, pt: {}, ja: {} };
}
