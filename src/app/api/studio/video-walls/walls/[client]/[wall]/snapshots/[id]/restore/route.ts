import { NextResponse, type NextRequest } from 'next/server';

import { kvVideoWall, kvVideoWallSnapshot } from '@/lib/video-walls/kv-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string; wall: string; id: string }>;
}

/**
 * `POST /api/studio/video-walls/walls/[client]/[wall]/snapshots/[id]/restore`
 *
 * Restaura un snapshot como current:
 *  1. Lee el snapshot.
 *  2. Crea un snapshot del current pre-restore (deshacer disponible).
 *  3. Sobrescribe current con `snapshot.data`.
 *
 * Patrón git-like — paridad con `kvSignageSnapshot` restore.
 */
export async function POST(_req: NextRequest, ctx: RouteContext) {
  const { client, wall, id } = await ctx.params;

  let snapshot;
  try {
    snapshot = await kvVideoWallSnapshot.get(client, wall, id);
  } catch (e) {
    return NextResponse.json({ error: `KV read failed: ${(e as Error).message}` }, { status: 500 });
  }
  if (!snapshot) {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
  }

  try {
    // Snapshot del current ANTES de sobrescribir.
    const currentBefore = await kvVideoWall.get(client, wall).catch(() => null);
    if (currentBefore) {
      await kvVideoWallSnapshot.create(client, wall, currentBefore, {
        ts: Date.now(),
        note: `pre-restore-of-${id}`,
      });
    }
    // Overwrite current con el snapshot.
    await kvVideoWall.set(client, wall, snapshot.data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[videowall:api] restore failed', e);
    return NextResponse.json({ error: `Restore failed: ${(e as Error).message}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    restoredId: id,
    restoredAt: Date.now(),
  });
}
