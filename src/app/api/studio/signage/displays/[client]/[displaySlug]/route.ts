import { NextResponse, type NextRequest } from 'next/server';

import { kvSignageDisplay } from '@/lib/signage/kv-store';
import { SignageDisplayConfigSchema } from '@/lib/signage/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ client: string; displaySlug: string }>;
}

/**
 * `PUT /api/studio/signage/displays/[client]/[displaySlug]` — DSS4.
 *
 * Persiste el display config completo al KV namespace `signage:*`. Validado
 * por Zod antes del set para evitar shapes corruptos. Idempotente — el
 * cliente puede llamar repetidamente.
 *
 * **No autoriza** todavía (DSS7 conectará a NextAuth GitHub como el kiosk).
 * En DSS4 cualquier sesión local puede persistir; OK para dev.
 *
 * Body shape: `{ display: SignageDisplayConfig }`.
 * El `slug` del path debe coincidir con `body.display.slug` para
 * defensa-en-profundidad. Mismatch → 400.
 */
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { client, displaySlug } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const wrapper = body as { display?: unknown } | null;
  if (!wrapper || typeof wrapper !== 'object' || !wrapper.display) {
    return NextResponse.json({ error: 'Missing { display } in body' }, { status: 400 });
  }

  const parsed = SignageDisplayConfigSchema.safeParse(wrapper.display);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid display shape',
        issues: parsed.error.issues.slice(0, 10),
      },
      { status: 400 },
    );
  }

  if (parsed.data.slug !== displaySlug) {
    return NextResponse.json(
      {
        error: `display.slug "${parsed.data.slug}" does not match path "${displaySlug}"`,
      },
      { status: 400 },
    );
  }

  try {
    await kvSignageDisplay.set(client, displaySlug, parsed.data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[signage:api] KV set failed', e);
    return NextResponse.json(
      { error: `KV write failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, savedAt: Date.now() });
}

/**
 * `GET` no necesario en DSS4 — el editor inicia el draft con el server fetch
 * via `loadSignageDisplay` (que ya consulta KV→fs en DSS3). Si DSS5 necesita
 * recargar el draft sin reload, se añade entonces.
 */
