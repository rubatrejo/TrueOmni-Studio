import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

/**
 * Sirve archivos desde `clients-signage/<client>/assets/...` como rutas
 * `/signage-assets/<client>/...`. Espejo del route handler `/assets` del kiosk
 * adaptado al producto signage (multi-cliente por URL en lugar de env var).
 *
 * Fallback a `clients-signage/default/...` si el cliente activo no tiene el
 * asset. 404 si no existe en ninguno.
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

async function readAssetForSlug(slug: string, relPath: string): Promise<Buffer | null> {
  const fullPath = path.join(process.cwd(), 'clients-signage', slug, relPath);
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

  let data = await readAssetForSlug(client, relPath);
  if (!data && client !== 'default') {
    data = await readAssetForSlug('default', relPath);
  }
  if (!data) {
    return new NextResponse('not found', { status: 404 });
  }

  const ext = relPath.split('.').pop()?.toLowerCase() ?? '';
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
