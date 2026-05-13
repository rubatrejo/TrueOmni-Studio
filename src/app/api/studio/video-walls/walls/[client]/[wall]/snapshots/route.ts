import { NextResponse, type NextRequest } from 'next/server';

import { kvVideoWall, kvVideoWallSnapshot } from '@/lib/video-walls/kv-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string; wall: string }>;
}

/**
 * `GET /api/studio/video-walls/walls/[client]/[wall]/snapshots`
 *
 * Lista metadata de los snapshots del wall, más reciente primero.
 * Cap FIFO 10 (definido en `kv-store.ts`).
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { client, wall } = await ctx.params;
  try {
    const snapshots = await kvVideoWallSnapshot.listMeta(client, wall);
    return NextResponse.json({ snapshots });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[videowall:api] snapshots list failed', e);
    return NextResponse.json({ error: `KV read failed: ${(e as Error).message}` }, { status: 500 });
  }
}

/**
 * `POST /api/studio/video-walls/walls/[client]/[wall]/snapshots`
 *
 * Crea un snapshot del wall actual. Body opcional `{ note?: string }` para
 * etiquetar el snapshot. Devuelve `{ ok, id, ts }`.
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { client, wall } = await ctx.params;

  let note: string | undefined;
  try {
    const body = (await req.json().catch(() => null)) as { note?: string } | null;
    note = body?.note;
  } catch {
    // body opcional
  }

  const current = await kvVideoWall.get(client, wall);
  if (!current) {
    return NextResponse.json({ error: 'Wall not in KV. Save first.' }, { status: 404 });
  }
  try {
    const ts = Date.now();
    const id = await kvVideoWallSnapshot.create(client, wall, current, { ts, note });
    return NextResponse.json({ ok: true, id, ts });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[videowall:api] snapshot create failed', e);
    return NextResponse.json(
      { error: `Snapshot create failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }
}
