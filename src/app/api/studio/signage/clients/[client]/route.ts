import { NextResponse, type NextRequest } from 'next/server';

import { kvSignageClient } from '@/lib/signage/kv-store';
import { SignageClientFileSchema } from '@/lib/signage/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string }>;
}

/**
 * `GET /api/studio/signage/clients/[client]` — Devuelve el client.json del KV.
 *
 * Solo lee KV (no fs); si quieres el resolved con events/social/news usa el
 * loader del SSR. Este endpoint sirve al editor para refrescar working copy.
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { client } = await ctx.params;
  const data = await kvSignageClient.get(client);
  if (!data) {
    return NextResponse.json({ error: 'Not found in KV' }, { status: 404 });
  }
  return NextResponse.json({ client: data });
}

/**
 * `PUT /api/studio/signage/clients/[client]` body `{ client: SignageClientFile }`.
 *
 * Valida con Zod + persiste al KV. El runtime ya lee KV-first vía
 * `loadSignageClient`, así que el próximo SSR refleja el cambio. Para vista
 * live el editor pushea via bridge postMessage.
 */
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { client: clientSlug } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const wrapper = body as { client?: unknown } | null;
  const parsed = SignageClientFileSchema.safeParse(wrapper?.client);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid client shape', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.slug !== clientSlug) {
    return NextResponse.json(
      { error: `Slug mismatch: body=${parsed.data.slug} url=${clientSlug}` },
      { status: 400 },
    );
  }

  try {
    await kvSignageClient.set(clientSlug, parsed.data);
    await kvSignageClient.addToList(clientSlug);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[signage:api] client set failed', e);
    return NextResponse.json(
      { error: `KV write failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, savedAt: Date.now() });
}
