import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { DEFAULT_CLIENT_SLUG, getClientSlug } from '@/lib/client-env';

/**
 * Sirve archivos desde `clients/{KIOSK_CLIENT}/assets/*` como rutas
 * `/assets/*`. Fallback a `clients/default/assets/*` si el cliente activo
 * no tiene el asset. 404 si no existe en ninguno.
 *
 * Esto sustituye al patrón de `public/` estándar de Next.js para soportar
 * assets por cliente sin rebuild (R5, R6).
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
  const fullPath = path.join(process.cwd(), 'clients', slug, 'assets', relPath);
  try {
    return await readFile(fullPath);
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path: segments } = await params;
  const relPath = segments.join('/');

  // Evita escapar la carpeta assets con `..`.
  if (relPath.includes('..')) {
    return new NextResponse('forbidden', { status: 403 });
  }

  const slug = getClientSlug();
  let data = await readAssetForSlug(slug, relPath);
  if (!data && slug !== DEFAULT_CLIENT_SLUG) {
    data = await readAssetForSlug(DEFAULT_CLIENT_SLUG, relPath);
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
