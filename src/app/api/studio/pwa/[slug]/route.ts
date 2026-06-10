import { NextResponse } from 'next/server';

import { loadPwaMeta, loadPwaSlice, savePwaSlice } from '@/lib/studio/pwa-config';
import { PwaConfigSchema } from '@/lib/studio/pwa-schema';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * `GET /api/studio/pwa/[slug]` — devuelve la working copy del slice
 * `features.pwa` del editor PWA (KV → config.json del cliente → template).
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const [pwa, meta] = await Promise.all([loadPwaSlice(slug), loadPwaMeta(slug)]);
  return NextResponse.json({ slug, pwa, meta });
}

/**
 * `PATCH /api/studio/pwa/[slug]` — persiste la working copy del slice PWA en
 * KV (`pwa:<slug>`). Valida el slice con `PwaConfigSchema` (F-PWA-6); en error
 * devuelve 400 con el detalle de `flatten()`. No toca el `cfg:<slug>` del kiosk.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const root = body as { pwa?: unknown } | null;
  if (!root || typeof root !== 'object' || root.pwa === undefined) {
    return NextResponse.json({ error: 'missing "pwa" object' }, { status: 400 });
  }

  const parsed = PwaConfigSchema.safeParse(root.pwa);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const meta = await savePwaSlice(slug, parsed.data as Parameters<typeof savePwaSlice>[1]);
  return NextResponse.json({ slug, ok: true, meta });
}
