import { NextResponse, type NextRequest } from 'next/server';

import { loadSignageI18n } from '@/lib/signage/i18n';
import { kvSignageI18n } from '@/lib/signage/kv-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string }>;
}

const VALID_LOCALES = new Set(['en', 'es', 'fr', 'de', 'pt', 'ja']);

/**
 * `GET .../i18n?locale=en` — DSS8.
 *
 * Devuelve el bag mergeado (fs base + KV override) para el locale dado.
 * Si el locale es inválido → 400. Si nada existe → bag vacío.
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const { client } = await ctx.params;
  const locale = new URL(req.url).searchParams.get('locale') ?? 'en';
  if (!VALID_LOCALES.has(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }
  const bag = await loadSignageI18n(client, locale);
  return NextResponse.json({ locale, bag });
}

/**
 * `PUT .../i18n` body `{ locale, bag }`. Persiste el bag al KV. Sobrescribe.
 */
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { client } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const wrapper = body as { locale?: unknown; bag?: unknown } | null;
  if (!wrapper || typeof wrapper.locale !== 'string') {
    return NextResponse.json({ error: 'Missing locale' }, { status: 400 });
  }
  if (!VALID_LOCALES.has(wrapper.locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }
  if (!wrapper.bag || typeof wrapper.bag !== 'object' || Array.isArray(wrapper.bag)) {
    return NextResponse.json({ error: 'bag must be a plain object' }, { status: 400 });
  }

  // Validación shallow: todas las values deben ser strings.
  const bag: Record<string, string> = {};
  for (const [k, v] of Object.entries(wrapper.bag as Record<string, unknown>)) {
    if (typeof v !== 'string') {
      return NextResponse.json({ error: `bag.${k} must be a string` }, { status: 400 });
    }
    bag[k] = v;
  }

  try {
    await kvSignageI18n.set(client, wrapper.locale, bag);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[signage:api] i18n set failed', e);
    return NextResponse.json(
      { error: `KV write failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, savedAt: Date.now() });
}
