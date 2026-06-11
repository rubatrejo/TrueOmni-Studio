import { NextResponse } from 'next/server';

import { getAdapter } from '@/lib/ingest/registry';
import { FeedProviderSchema } from '@/lib/studio/client-content';
import { loadClientManifest } from '@/lib/studio/client-manifest';
import { isValidStudioSlug } from '@/lib/studio/slug';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * `POST /api/studio/clients/[slug]/content/test` — valida una conexión de feed
 * sin importar nada. Body: `{ provider, config }`. Devuelve el `FeedTestResult`
 * del adaptador (ok/message/sampleCount). No persiste.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  if (!isValidStudioSlug(slug)) {
    return NextResponse.json({ error: 'invalid slug' }, { status: 400 });
  }
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

  const envelope = body as { provider?: unknown; config?: unknown };
  const provider = FeedProviderSchema.safeParse(envelope.provider);
  if (!provider.success) {
    return NextResponse.json({ error: 'invalid provider' }, { status: 400 });
  }
  const config =
    envelope.config && typeof envelope.config === 'object'
      ? (envelope.config as Record<string, string>)
      : {};

  const result = await getAdapter(provider.data).test(config);
  return NextResponse.json({ result });
}
