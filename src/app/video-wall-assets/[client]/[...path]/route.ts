import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

/**
 * Sirve archivos desde `clients-walls/<client>/assets/...` como rutas
 * `/video-wall-assets/<client>/...`. Espejo del handler `/signage-assets`
 * adaptado al producto video-walls.
 *
 * Fallback chain por cliente:
 *   1. `clients-walls/<client>/<relPath>`.
 *   2. `clients-walls/default/<relPath>` (cliente custom sin override).
 *   3. `clients-signage/<client>/<relPath>` (data compartida con signage,
 *      videos/ads/social/events del mismo cliente).
 *   4. `clients-signage/default/<relPath>` (seed por defecto).
 *   5. 404.
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

async function readFromRoot(root: string, slug: string, relPath: string): Promise<Buffer | null> {
  const fullPath = path.join(process.cwd(), root, slug, relPath);
  try {
    return await readFile(fullPath);
  } catch {
    return null;
  }
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

  let data = await readFromRoot('clients-walls', client, relPath);
  if (!data && client !== 'default') {
    data = await readFromRoot('clients-walls', 'default', relPath);
  }
  if (!data) {
    data = await readFromRoot('clients-signage', client, relPath);
  }
  if (!data && client !== 'default') {
    data = await readFromRoot('clients-signage', 'default', relPath);
  }
  if (!data) {
    return new NextResponse('not found', { status: 404 });
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
