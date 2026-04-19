import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { cache } from 'react';

import { DEFAULT_CLIENT_SLUG, getClientSlug } from './client-env';

async function readTokens(slug: string): Promise<string> {
  const filePath = path.join(process.cwd(), 'clients', slug, 'tokens.css');
  return readFile(filePath, 'utf-8');
}

/**
 * Devuelve el contenido de `clients/{slug}/tokens.css` para inyectarlo
 * como `<style>` en el root layout. Cacheado por render.
 * Fallback a `default` si el cliente activo no tiene tokens propios.
 */
export const getClientTokensCss = cache(async (): Promise<string> => {
  const slug = getClientSlug();
  try {
    return await readTokens(slug);
  } catch {
    if (slug !== DEFAULT_CLIENT_SLUG) {
      console.warn(`[kiosk] tokens de "${slug}" no encontrados, usando "${DEFAULT_CLIENT_SLUG}".`);
      return readTokens(DEFAULT_CLIENT_SLUG);
    }
    throw new Error(`[kiosk] no se pudo cargar clients/${slug}/tokens.css`);
  }
});
