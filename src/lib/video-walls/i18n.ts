import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { cache } from 'react';

import { kvVideoWallI18n } from './kv-store';

/**
 * i18n loader del producto video-walls.
 *
 * Patrón idéntico a `signage/i18n.ts`:
 *   1. KV `videowall:i18n:{client}:{locale}`.
 *   2. fs `clients-walls/<client>/i18n/<locale>.json`.
 *   3. Fallback default-locale del cliente (en).
 */

const VIDEO_WALL_ROOT = (): string => path.join(process.cwd(), 'clients-walls');

async function readJson(absPath: string): Promise<Record<string, string> | null> {
  try {
    const raw = await readFile(absPath, 'utf-8');
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
}

export const loadVideoWallI18n = cache(
  async (clientSlug: string, locale: string): Promise<Record<string, string>> => {
    // 1. KV.
    try {
      const kvBag = await kvVideoWallI18n.get(clientSlug, locale);
      if (kvBag) return kvBag;
    } catch {
      // KV miss.
    }

    // 2. fs cliente.
    const root = VIDEO_WALL_ROOT();
    const own = await readJson(path.join(root, clientSlug, 'i18n', `${locale}.json`));
    if (own) return own;

    // 3. fs default cliente del proyecto.
    const ownDefault = await readJson(path.join(root, clientSlug, 'i18n', 'en.json'));
    if (ownDefault) return ownDefault;

    // 4. fs default repo.
    const fallback = await readJson(path.join(root, 'default', 'i18n', `${locale}.json`));
    if (fallback) return fallback;
    const fallbackEn = await readJson(path.join(root, 'default', 'i18n', 'en.json'));
    return fallbackEn ?? {};
  },
);
