import { NextResponse } from 'next/server';

import { ClientContentSchema, emptyClientContent } from '@/lib/studio/client-content';
import { loadClientContent, saveClientContent } from '@/lib/studio/client-content-sync';
import { loadClientManifest } from '@/lib/studio/client-manifest';
import { checkKvValueSize } from '@/lib/studio/kv-size-guard';
import { isValidStudioSlug } from '@/lib/studio/slug';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * `GET /api/studio/clients/[slug]/content` — devuelve el documento de contenido
 * a nivel cliente (feeds + categoryMap + listings/events). Si el cliente existe
 * pero aún no tiene contenido, devuelve un documento vacío válido (version 0).
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  if (!isValidStudioSlug(slug)) {
    return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
  }
  const manifest = await loadClientManifest(slug);
  if (!manifest) {
    return NextResponse.json({ error: 'client not found' }, { status: 404 });
  }
  const content = (await loadClientContent(slug)) ?? emptyClientContent();
  return NextResponse.json({ content });
}

/**
 * `PATCH /api/studio/clients/[slug]/content` — guarda el documento de contenido
 * con optimistic concurrency. Body: `{ content: ClientContent, ifVersion?: number }`.
 *
 * - 400 si el slug o el body no validan.
 * - 404 si el cliente no existe.
 * - 409 si `ifVersion` está desfasado (se devuelve `currentVersion`).
 * - 413 si el documento excede el cap de tamaño de KV.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  if (!isValidStudioSlug(slug)) {
    return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
  }
  const manifest = await loadClientManifest(slug);
  if (!manifest) {
    return NextResponse.json({ error: 'client not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const envelope = body as { content?: unknown; ifVersion?: unknown };
  const parsed = ClientContentSchema.safeParse(envelope?.content);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ifVersion = typeof envelope.ifVersion === 'number' ? envelope.ifVersion : undefined;

  // Guard de tamaño antes de escribir (un feed grande puede inflar el doc).
  const size = checkKvValueSize(parsed.data);
  if (size.tooLarge) {
    return NextResponse.json(
      { error: 'content too large', sizeKb: size.sizeKb, capKb: size.capKb },
      { status: 413 },
    );
  }

  const result = await saveClientContent(slug, parsed.data, ifVersion);
  if (result.conflict) {
    return NextResponse.json(
      { error: 'version conflict', currentVersion: result.currentVersion },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, version: result.version });
}
