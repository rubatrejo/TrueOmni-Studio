import { NextResponse, type NextRequest } from 'next/server';

import { kvSignageThemeSnapshot } from '@/lib/signage/kv-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string }>;
}

/**
 * `GET /api/studio/signage/clients/[client]/snapshots` — Lista snapshots
 * theme-level con timestamp + meta. FIFO cap 10.
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { client } = await ctx.params;
  try {
    const snapshots = await kvSignageThemeSnapshot.listMeta(client);
    return NextResponse.json({ snapshots });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[signage:api] theme snapshots list failed', e);
    return NextResponse.json({ error: `KV read failed: ${(e as Error).message}` }, { status: 500 });
  }
}
