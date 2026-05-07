import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { loadSignageI18n } from './i18n';
import { kvSignageClient } from './kv-store';
import {
  SignageClientFileSchema,
  type SignageClientFile,
  type SignageDisplayConfig,
} from './schema';

/**
 * Builders del set de PublishFile[] que `publishToGitHub` recibe.
 *
 * **DSS7** — `buildSignageDisplayPublishFiles`: solo `display.json`.
 * **DSS7.5** — `buildSignageThemePublishFiles`: `client.json` + i18n bags.
 *
 * `tokens.css` y assets binarios quedan fuera del scope DSS7.5 (no hay editor
 * de tokens en el Studio; assets binarios llegan en sub-fase Vercel Blob).
 */

export interface PublishFile {
  path: string;
  content: string;
}

/** Locales soportados por el editor i18n del Studio (mismo set que el route). */
export const VALID_SIGNAGE_LOCALES = ['en', 'es', 'fr', 'de', 'pt', 'ja'] as const;

export function buildSignageDisplayPublishFiles(
  clientSlug: string,
  displaySlug: string,
  display: SignageDisplayConfig,
): PublishFile[] {
  const path = `clients-signage/${clientSlug}/displays/${displaySlug}/display.json`;
  const content = `${JSON.stringify(display, null, 2)}\n`;
  return [{ path, content }];
}

/**
 * Construye el bundle de archivos del theme:
 *  - `clients-signage/<slug>/client.json` (KV first, fallback fs).
 *  - `clients-signage/<slug>/i18n/<locale>.json` para cada locale con bag
 *    no-vacío. Usa `loadSignageI18n` (merge fs+KV) para que el fs publicado
 *    refleje la verdad efectiva del runtime.
 *
 * Lanza si el cliente no existe ni en KV ni en fs.
 */
export async function buildSignageThemePublishFiles(
  clientSlug: string,
): Promise<PublishFile[]> {
  const files: PublishFile[] = [];

  const clientFile = await resolveClientFile(clientSlug);
  files.push({
    path: `clients-signage/${clientSlug}/client.json`,
    content: `${JSON.stringify(clientFile, null, 2)}\n`,
  });

  for (const locale of VALID_SIGNAGE_LOCALES) {
    const bag = await loadSignageI18n(clientSlug, locale);
    if (Object.keys(bag).length === 0) continue;
    files.push({
      path: `clients-signage/${clientSlug}/i18n/${locale}.json`,
      content: `${JSON.stringify(bag, null, 2)}\n`,
    });
  }

  return files;
}

async function resolveClientFile(slug: string): Promise<SignageClientFile> {
  try {
    const kvClient = await kvSignageClient.get(slug);
    if (kvClient) return kvClient;
  } catch {
    // KV unreachable: caemos al fs.
  }

  const fsPath = path.join(process.cwd(), 'clients-signage', slug, 'client.json');
  try {
    const raw = await readFile(fsPath, 'utf-8');
    return SignageClientFileSchema.parse(JSON.parse(raw));
  } catch (err) {
    throw new Error(
      `[signage] cliente "${slug}" no existe ni en KV ni en fs (${(err as Error).message})`,
    );
  }
}
