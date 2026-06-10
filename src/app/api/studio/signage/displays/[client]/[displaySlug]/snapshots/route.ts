import { NextResponse, type NextRequest } from 'next/server';

import { kvSignageDisplay, kvSignageSnapshot } from '@/lib/signage/kv-store';

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
    return NextResponse.json({ error: `KV read failed: ${(e as Error).message}` }, { status: 500 });
  }
}

/**
 * `POST /api/studio/signage/displays/[client]/[displaySlug]/snapshots` — DSS6.
 *
 * Crea un checkpoint manual del display actual. Body opcional `{ note?: string }`.
 * Requiere que el display ya exista en KV (haber guardado al menos una vez).
 * Devuelve `{ ok, id, ts }`.
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { client, displaySlug } = await ctx.params;

  let note: string | undefined;
  try {
    const body = (await req.json().catch(() => null)) as { note?: string } | null;
    note = body?.note;
  } catch {
    // body opcional
  }

  const current = await kvSignageDisplay.get(client, displaySlug);
  if (!current) {
    return NextResponse.json(
      { error: 'Display not in KV. Save the display first.' },
      { status: 404 },
    );
  }
  try {
    const ts = Date.now();
    const id = await kvSignageSnapshot.create(client, displaySlug, current, { ts, note });
    return NextResponse.json({ ok: true, id, ts });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[signage:api] snapshot create failed', e);
    return NextResponse.json(
      { error: `Snapshot create failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }
}
