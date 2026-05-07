import { NextResponse, type NextRequest } from 'next/server';

import { kvSignageDisplay, kvSignageSnapshot } from '@/lib/signage/kv-store';
import { SignageDisplayConfigSchema } from '@/lib/signage/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string; displaySlug: string }>;
}

/**
 * `POST .../import` — Recibe un display.json en el body y lo guarda al KV.
 * Antes de overwrite, crea snapshot del current (igual que PUT normal).
 *
 * Body shape: `{ display: SignageDisplayConfig }`. El slug del path debe
 * coincidir con `body.display.slug` (defensa-en-profundidad).
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { client, displaySlug } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const wrapper = body as { display?: unknown } | null;
  if (!wrapper || typeof wrapper !== 'object' || !wrapper.display) {
    return NextResponse.json({ error: 'Missing { display } in body' }, { status: 400 });
  }

  const parsed = SignageDisplayConfigSchema.safeParse(wrapper.display);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid display shape',
        issues: parsed.error.issues.slice(0, 10),
      },
      { status: 400 },
    );
  }

  if (parsed.data.slug !== displaySlug) {
    return NextResponse.json(
      {
        error: `display.slug "${parsed.data.slug}" does not match path "${displaySlug}"`,
      },
      { status: 400 },
    );
  }

  try {
    const previous = await kvSignageDisplay.get(client, displaySlug).catch(() => null);
    if (previous) {
      try {
        await kvSignageSnapshot.create(client, displaySlug, previous, {
          ts: Date.now(),
          note: 'pre-import',
        });
      } catch (snapErr) {
        // eslint-disable-next-line no-console
        console.warn('[signage:api] snapshot create failed (continúa con import)', snapErr);
      }
    }
    await kvSignageDisplay.set(client, displaySlug, parsed.data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[signage:api] import failed', e);
    return NextResponse.json(
      { error: `Import failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, importedAt: Date.now() });
}
