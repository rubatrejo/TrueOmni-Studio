import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

/**
 * Sirve archivos arbitrarios bajo `clients/<slug>/` para que el Studio
 * pueda renderizar previews de assets (frames, backgrounds, thumbnails,
 * logos, etc.) sin depender del KIOSK_CLIENT activo del proceso.
 *
 * El kiosk en producción sirve `/assets/*` resolviendo contra
 * `KIOSK_CLIENT`. El Studio edita varios slugs a la vez, así que necesita
 * una ruta paralela que tome el slug explícitamente.
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
  pdf: 'application/pdf',
};

const SLUG_PATTERN = /^[a-z0-9-]+$/;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; path: string[] }> },
): Promise<NextResponse> {
  const { slug, path: segments } = await params;

  if (!SLUG_PATTERN.test(slug)) {
    return new NextResponse('forbidden', { status: 403 });
  }
  const relPath = segments.join('/');
  if (relPath.includes('..')) {
    return new NextResponse('forbidden', { status: 403 });
  }

  const fullPath = path.join(process.cwd(), 'clients', slug, relPath);
  try {
    const data = await readFile(fullPath);
    const ext = relPath.split('.').pop()?.toLowerCase() ?? '';
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new NextResponse('not found', { status: 404 });
  }
}
