import { NextResponse, type NextRequest } from 'next/server';

import { kvSignageSnapshot } from '@/lib/signage/kv-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string; displaySlug: string }>;
}

/**
 * `GET /api/studio/signage/displays/[client]/[displaySlug]/snapshots` — DSS6.
 *
 * Lista metadata de los snapshots del display, más reciente primero.
 * Cap FIFO 10 (definido en `kv-store.ts`).
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { client, displaySlug } = await ctx.params;
  try {
    const snapshots = await kvSignageSnapshot.listMeta(client, displaySlug);
    return NextResponse.json({ snapshots });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[signage:api] snapshots list failed', e);
    return NextResponse.json(
      { error: `KV read failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }
}
