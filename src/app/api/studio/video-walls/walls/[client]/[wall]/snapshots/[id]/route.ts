import { NextResponse, type NextRequest } from 'next/server';

import { kvVideoWallSnapshot } from '@/lib/video-walls/kv-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string; wall: string; id: string }>;
}

/**
 * `DELETE /api/studio/video-walls/walls/[client]/[wall]/snapshots/[id]`
 *
 * Borra un snapshot puntual. La FIFO cap del kvVideoWallSnapshot.create se
 * encarga del borrado automático cuando se excede el cap; esto cubre el caso
 * donde el operador quiere descartar un snapshot manualmente antes de tiempo.
 */
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { client, wall, id } = await ctx.params;
  try {
    await kvVideoWallSnapshot.delete(client, wall, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[videowall:api] snapshot delete failed', e);
    return NextResponse.json(
      { error: `Snapshot delete failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }
}
