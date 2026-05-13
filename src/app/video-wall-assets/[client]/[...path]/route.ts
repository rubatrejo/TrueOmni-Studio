import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

/**
 * Sirve archivos desde `clients-walls/<client>/...` como rutas
 * `/video-wall-assets/<client>/...`.
 *
 * Fallback chain por cliente:
 *   1. `clients-walls/<client>/<relPath>` (own).
 *   2. `clients-walls/default/<relPath>` (cliente custom sin override).
 *   3. Redirect 302 → `/signage-assets/<client>/<relPath>` (data
 *      compartida con signage — events/social/ads/video-image que el
 *      cliente ya pobló para signage también sirven aquí).
 *
 * Nota: no leemos `clients-signage/` directamente para no inflar el
 * bundle de la función serverless (~1.5GB de assets entre signage +
 * walls excede el límite Vercel de 300MB). El redirect mantiene el
 * fallback funcional sin duplicar tracing.
 */

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  ico: 'image/x-icon',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

async function readWallsAsset(slug: string, relPath: string): Promise<Buffer | null> {
  const fullPath = path.join(process.cwd(), 'clients-walls', slug, relPath);
  try {
    return await readFile(fullPath);
  } catch {
    return null;
  }
}

/**
 * Probe fs para signage assets sin leer el archivo entero — basta con saber si
 * existe para decidir entre redirect 302 (sí existe) o 404 directo (no existe
 * en ningún lado). Usar `access`/`stat` es más barato que `readFile` para esto.
 *
 * G7 (audit 2026-05-12): antes hacíamos redirect 302 ciego a signage-assets
 * cuando el archivo no estaba en clients-walls. Si tampoco estaba ahí, el
 * browser veía 302 → 404 (ruido). Ahora chequeamos primero y devolvemos 404
 * directo si no existe en ninguna parte.
 */
async function signageAssetExists(slug: string, relPath: string): Promise<boolean> {
  const { access } = await import('node:fs/promises');
  const candidates = [
    path.join(process.cwd(), 'clients-signage', slug, relPath),
    slug !== 'default' ? path.join(process.cwd(), 'clients-signage', 'default', relPath) : null,
  ].filter((p): p is string => p !== null);

  for (const p of candidates) {
    try {
      await access(p);
      return true;
    } catch {
      // sigue al siguiente candidato
    }
  }
  return false;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ client: string; path: string[] }> },
): Promise<NextResponse> {
  const { client, path: segments } = await params;
  const relPath = segments.join('/');

  if (relPath.includes('..') || client.includes('..')) {
    return new NextResponse('forbidden', { status: 403 });
  }

  let data = await readWallsAsset(client, relPath);
  if (!data && client !== 'default') {
    data = await readWallsAsset('default', relPath);
  }
  if (!data) {
    // G7: chequea fs signage antes de redirigir. Si no existe ahí tampoco,
    // devolvemos 404 directo en vez de 302 → 404 (que ensucia DevTools).
    const existsInSignage = await signageAssetExists(client, relPath);
    if (!existsInSignage) {
      return new NextResponse('not found', { status: 404 });
    }
    // Sí existe: redirect 302 a signage-assets (mismos assets, otro endpoint).
    return NextResponse.redirect(new URL(`/signage-assets/${client}/${relPath}`, _req.url), 302);
  }

  const ext = relPath.split('.').pop()?.toLowerCase() ?? '';
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

  const cacheControl =
    process.env.NODE_ENV === 'production'
      ? 'public, max-age=3600, stale-while-revalidate=86400'
      : 'no-store, must-revalidate';

  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    },
  });
}
