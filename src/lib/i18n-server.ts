/**
 * Loader server-only de traducciones por idioma.
 *
 * Usa `node:fs` — solo se importa desde Server Components / layout.
 * No importar desde Client Components.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { LocaleStrings } from './i18n';

/**
 * Carga el JSON de un locale desde `clients/{slug}/i18n/{locale}.json`.
 * Devuelve `{}` si el archivo no existe (deja que el fallback chain actúe).
 */
export async function loadLocale(slug: string, locale: string): Promise<LocaleStrings> {
  const filePath = path.join(process.cwd(), 'clients', slug, 'i18n', `${locale}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as LocaleStrings;
  } catch {
    return {};
  }
}

/**
 * Carga TODOS los locales disponibles para un cliente.
 * Devuelve un mapa `{ en: {...}, es: {...}, ... }`.
 */
export async function loadAllLocales(
  slug: string,
  available: readonly string[],
): Promise<Record<string, LocaleStrings>> {
  const entries = await Promise.all(
    available.map(async (locale) => [locale, await loadLocale(slug, locale)] as const),
  );
  return Object.fromEntries(entries);
}
