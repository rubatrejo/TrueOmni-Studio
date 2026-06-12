import { NextResponse } from 'next/server';

import { loadClientManifest } from '@/lib/studio/client-manifest';
import { generateAndSavePlaceholder } from '@/lib/studio/placeholder-generate';
import { isValidStudioSlug } from '@/lib/studio/slug';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * `POST /api/studio/clients/[slug]/content/placeholder` — genera el
 * Fallback/Placeholder image (16:9) del cliente en automático: foto scrapeada
 * de su website + capa oscura + logo (o nombre si no hay logo real), lo sube a
 * Vercel Blob y lo guarda en `content.placeholderImage`. Lo dispara el botón
 * "Generate from website" de la sub-tab Placeholder (Data feeds).
 *
 * Auth: cubierta por el middleware de `/api/studio/*` (allowlist NextAuth).
 *
 * Respuestas: 200 `{ url, source, usedLogo }` · 400 sin website · 404 cliente
 * inexistente · 503 sin Blob configurado (mismo patrón que `/api/studio/upload`).
 */
export async function POST(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  if (!isValidStudioSlug(slug)) {
    return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
  }
  const manifest = await loadClientManifest(slug);
  if (!manifest) {
    return NextResponse.json({ error: 'client not found' }, { status: 404 });
  }

  try {
    const result = await generateAndSavePlaceholder(slug);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
    }
    return NextResponse.json({
      url: result.url,
      source: result.source,
      usedLogo: result.usedLogo,
    });
  } catch (err) {
    console.error('[api/studio/content/placeholder]', err);
    const message = err instanceof Error ? err.message : 'Placeholder generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
