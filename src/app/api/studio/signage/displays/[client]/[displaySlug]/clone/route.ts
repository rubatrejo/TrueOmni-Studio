import { NextResponse, type NextRequest } from 'next/server';

import { loadSignageClient, loadSignageDisplay } from '@/lib/signage/config';
import { kvSignageClient, kvSignageDisplay } from '@/lib/signage/kv-store';
import { SignageClientFileSchema, SignageDisplayConfigSchema } from '@/lib/signage/schema';
import { STUDIO_SLUG_REGEX } from '@/lib/studio/slug';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SLUG_REGEX = STUDIO_SLUG_REGEX;

interface RouteContext {
  params: Promise<{ client: string; displaySlug: string }>;
}

/**
 * `POST /api/studio/signage/displays/[client]/[displaySlug]/clone`
 * body `{ newSlug, newName }`.
 *
 * Clona un display dentro del mismo theme. Reusa playlist + settings;
 * el operador lo personaliza después.
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { client, displaySlug: source } = await ctx.params;

  type BodyShape = { newSlug?: unknown; newName?: unknown };
  let body: BodyShape | null = null;
  try {
    body = (await req.json()) as BodyShape;
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
    return NextResponse.json({ error: 'newSlug must differ from source slug' }, { status: 400 });
  }

  const clientFile = await loadSignageClient(client).catch(() => null);
  if (!clientFile) {
    return NextResponse.json({ error: `Theme "${client}" not found.` }, { status: 404 });
  }
  if ((clientFile.displays ?? []).includes(newSlug)) {
    return NextResponse.json({ error: `Display "${newSlug}" already exists.` }, { status: 409 });
  }

  const sourceDisplay = await loadSignageDisplay(client, source).catch(() => null);
  if (!sourceDisplay) {
    return NextResponse.json({ error: `Source display "${source}" not found.` }, { status: 404 });
  }

  const cloned = {
    ...structuredClone(sourceDisplay),
    slug: newSlug,
    name: newName,
  };
  const parsedDisplay = SignageDisplayConfigSchema.safeParse(cloned);
  if (!parsedDisplay.success) {
    return NextResponse.json(
      {
        error: 'Cloned display failed validation',
        issues: parsedDisplay.error.issues,
      },
      { status: 500 },
    );
  }

  try {
    await kvSignageDisplay.set(client, newSlug, parsedDisplay.data);

    const nextClient = {
      slug: clientFile.slug,
      name: clientFile.name,
      locale: clientFile.locale,
      timezone: clientFile.timezone,
      location: clientFile.location,
      website: clientFile.website,
      branding: clientFile.branding,
      header: clientFile.header,
      displays: Array.from(new Set([...(clientFile.displays ?? []), newSlug])),
    };
    const parsedClient = SignageClientFileSchema.safeParse(nextClient);
    if (!parsedClient.success) {
      return NextResponse.json(
        {
          error: 'Updated client failed validation',
          issues: parsedClient.error.issues,
        },
        { status: 500 },
      );
    }
    await kvSignageClient.set(client, parsedClient.data);
  } catch (e) {
    return NextResponse.json(
      { error: `KV write failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    newSlug,
    sourceSlug: source,
    savedAt: Date.now(),
  });
}
