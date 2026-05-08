import { NextResponse } from 'next/server';

import { loadClientManifest, saveClientManifest } from '@/lib/studio/client-manifest';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * `POST /api/studio/clients/[slug]/pin` — toggle del flag `pinned` del
 * manifest unified. Pinned se ordena primero en el dashboard.
 *
 * Hallazgo S-13 del audit panorámico v2 (2026-05-08).
 */
export async function POST(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const manifest = await loadClientManifest(slug);
  if (!manifest) {
    return NextResponse.json({ error: `client "${slug}" not found` }, { status: 404 });
  }
  const next = {
    ...manifest,
    pinned: !manifest.pinned,
    lastEditedAt: new Date().toISOString(),
  };
  await saveClientManifest(next);
  return NextResponse.json({ slug, pinned: next.pinned });
}
