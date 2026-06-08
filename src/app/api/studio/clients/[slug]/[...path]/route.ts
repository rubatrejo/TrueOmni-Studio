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

  // Lee el asset del cliente; si no existe (típico en clientes creados en el
  // Studio que viven en KV sin carpeta fs propia) cae al asset seed del template
  // `default`, donde viven los assets compartidos (p. ej. `assets/pwa/welcome-bg.jpg`).
  // Sin esto el preview muestra la imagen rota.
  const readAsset = async (clientSlug: string): Promise<Buffer | null> => {
    try {
      return await readFile(path.join(process.cwd(), 'clients', clientSlug, relPath));
    } catch {
      return null;
    }
  };

  const data = (await readAsset(slug)) ?? (slug !== 'default' ? await readAsset('default') : null);
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
