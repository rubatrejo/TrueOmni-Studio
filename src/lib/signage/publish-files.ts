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
 * **DSS7.5** — `buildSignageThemePublishFiles`: `client.json` + `tokens.css`
 *   con overrides de branding aplicados + i18n bags.
 *
 * Assets binarios (logos, video, image en module overrides) se publican como
 * Blob URLs en el JSON; el sub-fase de Vercel Blob los emite directamente.
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
 *  - `clients-signage/<slug>/tokens.css` — base del fs + overrides de
 *    `branding.tokens` aplicados como bloque `:root` extra al final.
 *    Garantiza que después del merge, el runtime SSR refleja los nuevos
 *    colores sin necesitar el bridge applier.
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

  const tokensContent = await buildTokensCss(clientSlug, clientFile);
  if (tokensContent) {
    files.push({
      path: `clients-signage/${clientSlug}/tokens.css`,
      content: tokensContent,
    });
  }

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

/**
 * Lee `clients-signage/<slug>/tokens.css` (con fallback a `default/`) y
 * concatena un bloque `:root` con los overrides de `branding.tokens`. Si no
 * hay base ni overrides, devuelve cadena vacía (no se publica el archivo).
 */
async function buildTokensCss(
  clientSlug: string,
  clientFile: SignageClientFile,
): Promise<string> {
  let baseCss = '';
  const candidates = [
    path.join(process.cwd(), 'clients-signage', clientSlug, 'tokens.css'),
    path.join(process.cwd(), 'clients-signage', 'default', 'tokens.css'),
  ];
  for (const p of candidates) {
    try {
      baseCss = await readFile(p, 'utf-8');
      break;
    } catch {
      // try next
    }
  }

  const tokens = clientFile.branding.tokens ?? {};
  const decls = Object.entries(tokens).map(
    ([k, v]) => `  --signage-${k}: ${v};`,
  );

  if (!baseCss && decls.length === 0) return '';

  if (decls.length === 0) {
    return baseCss.endsWith('\n') ? baseCss : `${baseCss}\n`;
  }

  const overridesBlock = `\n/* ===== overrides editados desde el Studio ===== */\n:root {\n${decls.join('\n')}\n}\n`;
  return `${baseCss.replace(/\s+$/, '')}\n${overridesBlock}`;
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
