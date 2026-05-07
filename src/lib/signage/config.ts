import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { cache } from 'react';

import {
  SignageClientFileSchema,
  SignageClientResolvedSchema,
  SignageDisplayConfigSchema,
  SignageEventSchema,
  SignageNewsConfigSchema,
  SignageSocialDataSchema,
  type SignageClientResolved,
  type SignageDisplayConfig,
} from './schema';

/**
 * Loaders fs-only del producto signage. DS0 → cero KV.
 *
 * Cuando el milestone Studio (DSS0+) entre en juego, se añade un primer paso
 * KV con fallback a fs aquí mismo, sin cambiar la firma pública.
 *
 * Slug "default" se usa como fallback final (mismo patrón del kiosk).
 */

const SIGNAGE_ROOT = (): string => path.join(process.cwd(), 'clients-signage');

async function readJson(absPath: string): Promise<unknown> {
  const raw = await readFile(absPath, 'utf-8');
  return JSON.parse(raw) as unknown;
}

async function fileExists(absPath: string): Promise<boolean> {
  try {
    await readFile(absPath, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

async function readClientFiles(slug: string) {
  const root = SIGNAGE_ROOT();
  const clientJsonPath = path.join(root, slug, 'client.json');
  const eventsPath = path.join(root, slug, 'events.json');
  const socialPath = path.join(root, slug, 'social.json');
  const newsPath = path.join(root, slug, 'news.json');

  const [clientRaw, eventsRaw, socialRaw, newsRaw] = await Promise.all([
    readJson(clientJsonPath),
    readJson(eventsPath),
    readJson(socialPath),
    readJson(newsPath),
  ]);

  return {
    client: SignageClientFileSchema.parse(clientRaw),
    events: SignageEventSchema.array().parse(eventsRaw),
    social: SignageSocialDataSchema.parse(socialRaw),
    news: SignageNewsConfigSchema.parse(newsRaw),
  };
}

/**
 * Resuelve el cliente signage activo combinando client.json + events/social/news.
 * Si el slug no existe, hace fallback a "default" (cliente de plantilla del repo).
 */
export const loadSignageClient = cache(
  async (slug: string): Promise<SignageClientResolved | null> => {
    try {
      const files = await readClientFiles(slug);
      return SignageClientResolvedSchema.parse({
        ...files.client,
        events: files.events,
        social: files.social,
        news: files.news,
      });
    } catch (err) {
      // Fallback a default si el slug no resolvió.
      if (slug !== 'default') {
        // eslint-disable-next-line no-console
        console.warn(
          `[signage] cliente "${slug}" no encontrado o inválido, usando "default". (${(err as Error).message})`,
        );
        try {
          const files = await readClientFiles('default');
          return SignageClientResolvedSchema.parse({
            ...files.client,
            events: files.events,
            social: files.social,
            news: files.news,
            // Mantener el slug solicitado para que el runtime sepa qué pidió.
            slug,
          });
        } catch {
          return null;
        }
      }
      return null;
    }
  },
);

/**
 * Resuelve un display concreto. NO hace fallback a otro display: si no existe,
 * la página debe responder notFound().
 */
export const loadSignageDisplay = cache(
  async (clientSlug: string, displaySlug: string): Promise<SignageDisplayConfig | null> => {
    const root = SIGNAGE_ROOT();
    const displayPath = path.join(
      root,
      clientSlug,
      'displays',
      displaySlug,
      'display.json',
    );
    if (!(await fileExists(displayPath))) {
      // Intento secundario: si el client cayó a default, mirar también default/displays/<displaySlug>.
      const fallbackPath = path.join(root, 'default', 'displays', displaySlug, 'display.json');
      if (clientSlug !== 'default' && (await fileExists(fallbackPath))) {
        const raw = await readJson(fallbackPath);
        return SignageDisplayConfigSchema.parse(raw);
      }
      return null;
    }
    const raw = await readJson(displayPath);
    return SignageDisplayConfigSchema.parse(raw);
  },
);

/**
 * Lee el contenido raw de tokens.css del cliente signage. Inyectable como
 * <style> en el server component del runtime para aplicar la paleta del cliente.
 * Fallback a default si no existe el archivo del cliente.
 */
export const loadSignageTokensCss = cache(async (slug: string): Promise<string> => {
  const root = SIGNAGE_ROOT();
  const clientPath = path.join(root, slug, 'tokens.css');
  try {
    return await readFile(clientPath, 'utf-8');
  } catch {
    if (slug !== 'default') {
      // eslint-disable-next-line no-console
      console.warn(`[signage] tokens.css de "${slug}" no encontrado, usando "default".`);
      return readFile(path.join(root, 'default', 'tokens.css'), 'utf-8');
    }
    throw new Error(`[signage] no se pudo cargar clients-signage/${slug}/tokens.css`);
  }
});
