import { NextResponse, type NextRequest } from 'next/server';

import { computeSignageKvSize } from '@/lib/signage/kv-size';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string; displaySlug: string }>;
}

/**
 * `GET .../size` — Reporta uso del KV por display: bytes del current +
 * bytes acumulados de snapshots + cap. Útil para el `<KvSizeAdvisor>`.
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { client, displaySlug } = await ctx.params;
  try {
    const size = await computeSignageKvSize(client, displaySlug);
    return NextResponse.json(size);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[signage:api] size failed', e);
    return NextResponse.json({ error: `KV read failed: ${(e as Error).message}` }, { status: 500 });
  }
}
