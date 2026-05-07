import { NextResponse, type NextRequest } from 'next/server';

import {
  kvSignageClient,
  kvSignageDisplay,
  kvSignageI18n,
  kvSignageSnapshot,
  kvSignageThemeSnapshot,
} from '@/lib/signage/kv-store';
import { SignageClientFileSchema } from '@/lib/signage/schema';

const RESERVED_SLUGS = new Set(['default']);
const I18N_LOCALES = ['en', 'es', 'fr', 'de', 'pt', 'ja'] as const;

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
    // Snapshot del previo antes de sobrescribir (patrón git-like, mismo que
    // display snapshots). FIFO cap 10 — el más viejo se purga.
    const previous = await kvSignageClient.get(clientSlug);
    if (previous) {
      await kvSignageThemeSnapshot.create(clientSlug, previous);
    }
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

/**
 * `DELETE /api/studio/signage/clients/[client]` — Borra el theme del KV.
 *
 * Borra: client.json, displays asociados, snapshots theme, snapshots
 * display, i18n bags. NO toca el filesystem (`clients-signage/<slug>/`)
 * porque esto vive en git — el unpublish requiere PR aparte.
 *
 * El slug `default` está reservado y no puede borrarse.
 */
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { client } = await ctx.params;

  if (RESERVED_SLUGS.has(client)) {
    return NextResponse.json(
      { error: `Cannot delete reserved slug "${client}".` },
      { status: 400 },
    );
  }

  const existing = await kvSignageClient.get(client).catch(() => null);
  if (!existing) {
    return NextResponse.json(
      { error: `Theme "${client}" not found in KV.` },
      { status: 404 },
    );
  }

  try {
    // Borra displays + sus snapshots.
    for (const dSlug of existing.displays ?? []) {
      const ids = await kvSignageSnapshot
        .listIds(client, dSlug)
        .catch(() => [] as string[]);
      for (const id of ids) {
        await kvSignageSnapshot.delete(client, dSlug, id);
      }
      await kvSignageDisplay.delete(client, dSlug);
    }

    // Borra snapshots theme-level.
    const themeIds = await kvSignageThemeSnapshot
      .listIds(client)
      .catch(() => [] as string[]);
    for (const id of themeIds) {
      await kvSignageThemeSnapshot.delete(client, id);
    }

    // Borra i18n bags (todos los locales soportados).
    for (const locale of I18N_LOCALES) {
      await kvSignageI18n.delete(client, locale).catch(() => {});
    }

    // Finalmente, el client + remove from list.
    await kvSignageClient.delete(client);
    await kvSignageClient.removeFromList(client);
  } catch (e) {
    return NextResponse.json(
      { error: `KV delete failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, deletedAt: Date.now() });
}
