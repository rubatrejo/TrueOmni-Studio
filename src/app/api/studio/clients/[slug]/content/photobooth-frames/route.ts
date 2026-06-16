import { NextResponse } from 'next/server';

import { loadClientManifest } from '@/lib/studio/client-manifest';
import { generateAndSavePhotoBoothFrames } from '@/lib/studio/photobooth-frame-generate';
import { isValidStudioSlug } from '@/lib/studio/slug';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * `POST /api/studio/clients/[slug]/content/photobooth-frames` — (re)genera los
 * frames branded del Photo Booth en automático: 5 plantillas SVG con los brand
 * colors + logo (o nombre) + foto scrapeada del website, subidas a Vercel Blob
 * y escritas en `cfg.photoBooth.frames` (upsert por templateId, sin pisar lo
 * que el operador subió a mano). Lo dispara el botón "Generate branded frames"
 * de la pestaña Frames del editor del Photo Booth.
 *
 * Auth: cubierta por el middleware de `/api/studio/*`.
 *
 * Respuestas: 200 `{ count, source, usedLogo }` · 404 cliente inexistente ·
 * 503 sin Blob configurado.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  if (!isValidStudioSlug(slug)) {
    return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
  }
  const manifest = await loadClientManifest(slug);
  if (!manifest) {
    return NextResponse.json({ error: 'client not found' }, { status: 404 });
  }

  // Textos actuales del editor por templateId (para que el cambio se hornee SIN
  // depender de que el config ya esté guardado en KV — fix del bug "editar el
  // texto no se refleja en el kiosk").
  let textByTemplate: Record<string, string> | undefined;
  try {
    const body = (await req.json()) as { text?: Record<string, string> };
    if (body?.text && typeof body.text === 'object') textByTemplate = body.text;
  } catch {
    // sin body → usa el texto del KV/defaults
  }

  try {
    // Botón manual → preserva todo lo no-auto (no reemplaza genéricos/custom).
    const result = await generateAndSavePhotoBoothFrames(slug, { textByTemplate });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
    }
    return NextResponse.json({
      count: result.count,
      source: result.source,
      usedLogo: result.usedLogo,
      frames: result.frames,
    });
  } catch (err) {
    console.error('[api/studio/content/photobooth-frames]', err);
    const message = err instanceof Error ? err.message : 'Frame generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
