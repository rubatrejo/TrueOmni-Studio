import { NextResponse, type NextRequest } from 'next/server';

import { loadSignageDisplay } from '@/lib/signage/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string; displaySlug: string }>;
}

/**
 * `GET .../export` — Descarga el display.json actual (KV→fs híbrido) como
 * archivo. Útil para backups locales y migración entre entornos.
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { client, displaySlug } = await ctx.params;
  const display = await loadSignageDisplay(client, displaySlug);
  if (!display) {
    return NextResponse.json({ error: 'Display not found' }, { status: 404 });
  }

  const json = `${JSON.stringify(display, null, 2)}\n`;
  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${displaySlug}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
