import { NextResponse, type NextRequest } from 'next/server';

import { kvSignageClient, kvSignageThemeSnapshot } from '@/lib/signage/kv-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string; id: string }>;
}

/**
 * `POST /api/studio/signage/clients/[client]/snapshots/[id]/restore`
 *
 * Restaura el theme snapshot `id`. Pasos:
 *  1. Snapshot del current (pre-restore) — patrón git-like, restore reversible.
 *  2. Sobrescribe el client con la data del snapshot pedido.
 *
 * Devuelve `{ ok, snapshotId, restoredFromId }`.
 */
export async function POST(_req: NextRequest, ctx: RouteContext) {
  const { client, id } = await ctx.params;
  try {
    const target = await kvSignageThemeSnapshot.get(client, id);
    if (!target) {
      return NextResponse.json(
        { error: `Snapshot ${id} not found for ${client}` },
        { status: 404 },
      );
    }

    const current = await kvSignageClient.get(client);
    let preRestoreSnapshotId: string | null = null;
    if (current) {
      preRestoreSnapshotId = await kvSignageThemeSnapshot.create(client, current);
    }

    await kvSignageClient.set(client, target.data);
    return NextResponse.json({
      ok: true,
      restoredFromId: id,
      preRestoreSnapshotId,
      savedAt: Date.now(),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[signage:api] theme snapshot restore failed', e);
    return NextResponse.json({ error: `Restore failed: ${(e as Error).message}` }, { status: 500 });
  }
}
