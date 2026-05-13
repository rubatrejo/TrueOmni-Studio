import { NextResponse, type NextRequest } from 'next/server';

import { kvVideoWallClient } from '@/lib/video-walls/kv-store';
import { VideoWallClientFileSchema } from '@/lib/video-walls/schema';
import { assertVwSlug, VwSlugError } from '@/lib/video-walls/slug-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * `GET /api/studio/video-walls/clients/[slug]` — Devuelve el client.json del
 * KV para el producto Video Walls.
 *
 * G6 (audit 2026-05-12): antes de esto el editor VW rebotaba sobre el
 * endpoint signage (`/api/studio/signage/clients/[client]`) cuando quería
 * persistir branding/header compartido. Eso funcionaba accidentalmente
 * porque ambos productos comparten el shape de SignageClientFile +
 * VideoWallClientFile, pero contaminaba el namespace de signage. Este
 * endpoint da al editor VW su propio canal.
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params;
  try {
    assertVwSlug(slug, 'client');
  } catch (e) {
    if (e instanceof VwSlugError) {
      return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
    }
    throw e;
  }

  const data = await kvVideoWallClient.get(slug);
  if (!data) {
    return NextResponse.json({ error: 'Not found in KV' }, { status: 404 });
  }
  return NextResponse.json({ client: data });
}

/**
 * `PUT /api/studio/video-walls/clients/[slug]` body `{ client: VideoWallClientFile }`.
 *
 * Valida con Zod + persiste al KV. Patrón idéntico al endpoint signage
 * equivalente (`/api/studio/signage/clients/[client]/route.ts`):
 *   - body wrapper `{ client: ... }`.
 *   - slug del body debe coincidir con el de la URL.
 *   - rechazo 409 si el manifest no tiene `videoWalls: true`.
 *   - addToList para mantener el set de clientes VW al día.
 */
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { slug } = await ctx.params;

  try {
    assertVwSlug(slug, 'client');
  } catch (e) {
    if (e instanceof VwSlugError) {
      return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
    }
    throw e;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const wrapper = body as { client?: unknown } | null;
  const parsed = VideoWallClientFileSchema.safeParse(wrapper?.client);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid client shape', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.slug !== slug) {
    return NextResponse.json(
      { error: `Slug mismatch: body=${parsed.data.slug} url=${slug}` },
      { status: 400 },
    );
  }

  // G6 (audit 2026-05-12): el manifest debe tener Video Walls activo.
  // Patrón equivalente al check de signage (DD activo || VW activo) pero
  // aquí solo aceptamos VW. Si no hay manifest (cliente legacy pre-Fase 2)
  // dejamos pasar — no rompemos el flow existente.
  try {
    const { loadClientManifest } = await import('@/lib/studio/client-manifest');
    const manifest = await loadClientManifest(slug);
    if (manifest) {
      const vwActive = manifest.products.videoWalls === true;
      if (!vwActive) {
        return NextResponse.json(
          {
            error: `Client "${slug}" does not have Video Walls active. Activate the product in the manifest before saving wall client data.`,
          },
          { status: 409 },
        );
      }
    }
  } catch (e) {
    // Best-effort: no abortes el save si el chequeo de manifest falla.
    // eslint-disable-next-line no-console
    console.warn('[videowall:api] manifest activation check failed', e);
  }

  try {
    await kvVideoWallClient.set(slug, parsed.data);
    await kvVideoWallClient.addToList(slug);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[videowall:api] client set failed', e);
    return NextResponse.json(
      { error: `KV write failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, savedAt: Date.now() });
}
