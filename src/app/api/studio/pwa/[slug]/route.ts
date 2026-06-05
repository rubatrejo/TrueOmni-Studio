import { NextResponse } from 'next/server';

import type { PwaConfig } from '@/lib/config';
import { loadPwaMeta, loadPwaSlice, savePwaSlice } from '@/lib/studio/pwa-config';

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
 * KV (`pwa:<slug>`). Recibe el slice completo `{ pwa }`. No toca el
 * `cfg:<slug>` del kiosk.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  let body: { pwa?: PwaConfig } | null = null;
  try {
    body = (await req.json()) as { pwa?: PwaConfig };
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (!body || typeof body.pwa !== 'object' || body.pwa === null) {
    return NextResponse.json({ error: 'missing "pwa" object' }, { status: 400 });
  }
  const meta = await savePwaSlice(slug, body.pwa);
  return NextResponse.json({ slug, ok: true, meta });
}
