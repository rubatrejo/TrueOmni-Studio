import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { cache } from 'react';

import { kvSignageI18n } from './kv-store';

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

    // Acumulamos de menos específico a más específico para que el más
    // específico gane (merge con prioridad inversa).
    const merged: Record<string, string> = {};

    // 1. Base FS: default+en, default+locale, slug+en, slug+locale.
    const fsCandidates = [
      path.join(root, 'default', 'i18n', 'en.json'),
      path.join(root, 'default', 'i18n', `${locale}.json`),
      path.join(root, slug, 'i18n', 'en.json'),
      path.join(root, slug, 'i18n', `${locale}.json`),
    ];
    for (const candidate of fsCandidates) {
      const bag = await tryReadJson(candidate);
      if (bag) Object.assign(merged, bag);
    }

    // 2. KV override (DSS8): si existe `signage:i18n:<slug>:<locale>` se mergea
    //    encima del fs. Permite editar desde el Studio sin tocar fs.
    try {
      const kvBag = await kvSignageI18n.get(slug, locale);
      if (kvBag) Object.assign(merged, kvBag);
    } catch {
      // KV unreachable: fs ya nos dio una respuesta.
    }

    return merged;
  },
);
