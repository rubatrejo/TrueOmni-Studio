import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { cache } from 'react';

/**
 * Loader fs-only del bag i18n del producto signage (DS14).
 *
 * Resolución (primer match gana):
 *  1. `clients-signage/<slug>/i18n/<locale>.json`
 *  2. `clients-signage/<slug>/i18n/en.json`
 *  3. `clients-signage/default/i18n/<locale>.json`
 *  4. `clients-signage/default/i18n/en.json`
 *
 * Si nada existe, retorna `{}` (las claves caerán al fallback en el hook
 * `useSignageT`). Cachea con `cache()` por petición.
 */

const SIGNAGE_ROOT = (): string => path.join(process.cwd(), 'clients-signage');

async function tryReadJson(absPath: string): Promise<Record<string, string> | null> {
  try {
    const raw = await readFile(absPath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
    return null;
  } catch {
    return null;
  }
}

export const loadSignageI18n = cache(
  async (slug: string, locale: string): Promise<Record<string, string>> => {
    const root = SIGNAGE_ROOT();
    const candidates = [
      path.join(root, slug, 'i18n', `${locale}.json`),
      path.join(root, slug, 'i18n', 'en.json'),
      path.join(root, 'default', 'i18n', `${locale}.json`),
      path.join(root, 'default', 'i18n', 'en.json'),
    ];

    // Acumulamos de menos específico a más específico para que el más
    // específico gane (merge con prioridad inversa).
    const merged: Record<string, string> = {};
    for (let i = candidates.length - 1; i >= 0; i--) {
      const bag = await tryReadJson(candidates[i] ?? '');
      if (bag) Object.assign(merged, bag);
    }
    return merged;
  },
);
