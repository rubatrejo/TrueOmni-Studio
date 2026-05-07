import { NextResponse, type NextRequest } from 'next/server';

import { kvSignageDisplay, kvSignageSnapshot } from '@/lib/signage/kv-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string; displaySlug: string; id: string }>;
}

/**
 * `POST /api/studio/signage/displays/[client]/[displaySlug]/snapshots/[id]/restore`
 *
 * Restaura un snapshot como current:
 *  1. Lee el snapshot.
 *  2. Crea un snapshot del current (para que el usuario pueda deshacer
 *     la restauración).
 *  3. Sobrescribe current con `snapshot.data`.
 *
 * Patrón git-like: cada restore es atómico y reversible.
 */
export async function POST(_req: NextRequest, ctx: RouteContext) {
  const { client, displaySlug, id } = await ctx.params;

  let snapshot;
  try {
    snapshot = await kvSignageSnapshot.get(client, displaySlug, id);
  } catch (e) {
    return NextResponse.json(
      { error: `KV read failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }
  if (!snapshot) {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
  }

  try {
    // Snapshot del current ANTES de sobrescribir.
    const currentBefore = await kvSignageDisplay
      .get(client, displaySlug)
      .catch(() => null);
    if (currentBefore) {
      await kvSignageSnapshot.create(client, displaySlug, currentBefore, {
        ts: Date.now(),
        note: `pre-restore-of-${id}`,
      });
    }
    // Overwrite current con el snapshot.
    await kvSignageDisplay.set(client, displaySlug, snapshot.data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[signage:api] restore failed', e);
    return NextResponse.json(
      { error: `Restore failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    restoredId: id,
    restoredAt: Date.now(),
  });
}
