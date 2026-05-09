import { NextResponse, type NextRequest } from 'next/server';

import { loadSignageClient, loadSignageDisplay } from '@/lib/signage/config';
import { kvSignageClient, kvSignageDisplay } from '@/lib/signage/kv-store';
import { SignageClientFileSchema, type SignageClientFile } from '@/lib/signage/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;

interface RouteContext {
  params: Promise<{ client: string }>;
}

/**
 * `POST /api/studio/signage/clients/[client]/clone` body `{ newSlug, newName }`.
 *
 * Clona el theme `client` con todos sus displays bajo `newSlug`. Reusa el
 * mismo branding/header/location/i18n. Los displays se copian igual con el
 * mismo slug interno (lobby-tv, etc.) — el operator los puede renombrar
 * después.
 *
 * Falla si `newSlug` ya existe o si el source no se puede resolver.
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { client: source } = await ctx.params;

  let body: { newSlug?: unknown; newName?: unknown } | null = null;
  try {
    body = (await req.json()) as { newSlug?: unknown; newName?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const newSlug = typeof body?.newSlug === 'string' ? body.newSlug.trim() : '';
  const newName = typeof body?.newName === 'string' ? body.newName.trim() : '';

  if (!newSlug || !newName) {
    return NextResponse.json({ error: 'newSlug and newName are required' }, { status: 400 });
  }
  if (!SLUG_REGEX.test(newSlug)) {
    return NextResponse.json({ error: 'Invalid newSlug' }, { status: 400 });
  }
  if (newSlug === source) {
    return NextResponse.json({ error: 'newSlug must differ from source' }, { status: 400 });
  }

  const existing = await kvSignageClient.get(newSlug).catch(() => null);
  if (existing) {
    return NextResponse.json({ error: `Theme "${newSlug}" already exists.` }, { status: 409 });
  }

  const sourceClient = await loadSignageClient(source);
  if (!sourceClient) {
    return NextResponse.json({ error: `Source theme "${source}" not found.` }, { status: 404 });
  }

  const cloned: SignageClientFile = {
    slug: newSlug,
    name: newName,
    locale: sourceClient.locale,
    timezone: sourceClient.timezone,
    location: { ...sourceClient.location },
    website: sourceClient.website,
    branding: structuredClone(sourceClient.branding),
    header: structuredClone(sourceClient.header),
    displays: [...sourceClient.displays],
  };

  const parsed = SignageClientFileSchema.safeParse(cloned);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Cloned theme failed validation', issues: parsed.error.issues },
      { status: 500 },
    );
  }

  try {
    await kvSignageClient.set(newSlug, parsed.data);
    await kvSignageClient.addToList(newSlug);
  } catch (e) {
    return NextResponse.json(
      { error: `KV write failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  // Clona displays referenciados en sourceClient.displays.
  const clonedDisplays: string[] = [];
  for (const dSlug of sourceClient.displays) {
    try {
      const display = await loadSignageDisplay(source, dSlug);
      if (!display) continue;
      await kvSignageDisplay.set(newSlug, dSlug, structuredClone(display));
      clonedDisplays.push(dSlug);
    } catch {
      // Skip displays inválidos.
    }
  }

  return NextResponse.json({
    ok: true,
    newSlug,
    displaysCloned: clonedDisplays,
    savedAt: Date.now(),
  });
}
