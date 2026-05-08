import { NextResponse } from 'next/server';

import {
  loadUnifiedBranding,
  saveUnifiedBranding,
  UnifiedClientBrandingSchema,
} from '@/lib/studio/client-branding-sync';
import { loadClientManifest, saveClientManifest } from '@/lib/studio/client-manifest';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * `GET /api/studio/clients/[slug]/branding` — devuelve el unified branding
 * actual del cliente. 404 si el manifest no existe.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const manifest = await loadClientManifest(slug);
  if (!manifest) {
    return NextResponse.json({ error: 'client not found' }, { status: 404 });
  }
  const branding = await loadUnifiedBranding(slug);
  if (!branding) {
    return NextResponse.json({ error: 'branding not found' }, { status: 404 });
  }
  return NextResponse.json({ branding });
}

/**
 * `PATCH /api/studio/clients/[slug]/branding` — guarda el unified branding
 * y propaga al kiosk + signage configs activos. Devuelve el SyncResult para
 * diagnóstico (qué productos se actualizaron, errors si los hubo).
 *
 * El manifest se actualiza con `lastEditedAt` + `lastEditor` (cuando llegue
 * de auth) — `name` también si cambió en el branding.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const manifest = await loadClientManifest(slug);
  if (!manifest) {
    return NextResponse.json({ error: 'client not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const parsed = UnifiedClientBrandingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await saveUnifiedBranding(slug, parsed.data);

  // Mantén `manifest.name` y `lastEditedAt` sincronizados con el branding.
  await saveClientManifest({
    ...manifest,
    name: parsed.data.name,
    lastEditedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, sync: result });
}
