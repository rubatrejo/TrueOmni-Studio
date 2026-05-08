import { NextResponse, type NextRequest } from 'next/server';

import {
  kvSignageEvents,
  kvSignageNews,
  kvSignageSocial,
} from '@/lib/signage/kv-store';
import {
  SignageEventSchema,
  SignageNewsConfigSchema,
  SignageSocialDataSchema,
} from '@/lib/signage/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string }>;
}

/**
 * `PUT /api/studio/signage/clients/[client]/content?kind=events|social|news`
 *
 * Persiste el contenido editado del Studio al KV signage. El runtime ya lee
 * KV-first (con fallback fs) en `loadSignageClient`, así que el próximo SSR
 * refleja el cambio. Para vista live el editor empuja por bridge postMessage.
 *
 * Body shape:
 *   - `events` → `{ events: SignageEvent[] }`
 *   - `social` → `{ social: SignageSocialData }`
 *   - `news`   → `{ news: SignageNewsConfig }`
 */
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { client } = await ctx.params;
  const url = new URL(req.url);
  const kind = url.searchParams.get('kind');

  if (kind !== 'events' && kind !== 'social' && kind !== 'news') {
    return NextResponse.json(
      { error: 'Invalid kind. Expected events|social|news.' },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    if (kind === 'events') {
      const wrapper = body as { events?: unknown };
      const parsed = SignageEventSchema.array().safeParse(wrapper?.events);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid events shape', issues: parsed.error.issues.slice(0, 10) },
          { status: 400 },
        );
      }
      await kvSignageEvents.set(client, parsed.data);
    } else if (kind === 'social') {
      const wrapper = body as { social?: unknown };
      const parsed = SignageSocialDataSchema.safeParse(wrapper?.social);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid social shape', issues: parsed.error.issues.slice(0, 10) },
          { status: 400 },
        );
      }
      await kvSignageSocial.set(client, parsed.data);
    } else {
      const wrapper = body as { news?: unknown };
      const parsed = SignageNewsConfigSchema.safeParse(wrapper?.news);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid news shape', issues: parsed.error.issues.slice(0, 10) },
          { status: 400 },
        );
      }
      await kvSignageNews.set(client, parsed.data);
    }
  } catch (e) {
    return NextResponse.json(
      { error: `KV write failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, savedAt: Date.now() });
}
