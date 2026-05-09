import { NextResponse, type NextRequest } from 'next/server';

import { loadSignageClient } from '@/lib/signage/config';
import { kvSignageClient, kvSignageDisplay, kvSignageSnapshot } from '@/lib/signage/kv-store';
import { SignageClientFileSchema, SignageDisplayConfigSchema } from '@/lib/signage/schema';

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
    // DSS6: snapshot del state previo antes de overwrite. Si no hay
    // previous (primera escritura desde fs), no hay snapshot.
    const previous = await kvSignageDisplay.get(client, displaySlug).catch(() => null);
    if (previous) {
      try {
        await kvSignageSnapshot.create(client, displaySlug, previous, {
          ts: Date.now(),
        });
      } catch (snapErr) {
        // eslint-disable-next-line no-console
        console.warn('[signage:api] snapshot create failed (continúa con save)', snapErr);
      }
    }

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

/**
 * `DELETE /api/studio/signage/displays/[client]/[displaySlug]` — Borra el
 * display del KV (config + raw + snapshots) y lo quita del array
 * `client.displays`. Falla si dejaría el theme con cero displays.
 *
 * No toca filesystem (`clients-signage/<slug>/displays/`); el unpublish
 * vive en git → PR aparte.
 */
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { client, displaySlug } = await ctx.params;

  const clientFile = await loadSignageClient(client).catch(() => null);
  if (!clientFile) {
    return NextResponse.json({ error: `Theme "${client}" not found.` }, { status: 404 });
  }

  const displays = clientFile.displays ?? [];
  if (!displays.includes(displaySlug)) {
    return NextResponse.json(
      {
        error: `Display "${displaySlug}" not found in theme "${client}".`,
      },
      { status: 404 },
    );
  }
  if (displays.length <= 1) {
    return NextResponse.json(
      {
        error:
          'Cannot delete the last display of a theme. Add another display first or delete the entire theme.',
      },
      { status: 400 },
    );
  }

  try {
    // Borra snapshots primero, luego el display.
    const snapshotIds = await kvSignageSnapshot
      .listIds(client, displaySlug)
      .catch(() => [] as string[]);
    for (const id of snapshotIds) {
      await kvSignageSnapshot.delete(client, displaySlug, id);
    }
    await kvSignageDisplay.delete(client, displaySlug);

    // Update client.displays array.
    const nextClient = {
      slug: clientFile.slug,
      name: clientFile.name,
      locale: clientFile.locale,
      timezone: clientFile.timezone,
      location: clientFile.location,
      website: clientFile.website,
      branding: clientFile.branding,
      header: clientFile.header,
      displays: displays.filter((d) => d !== displaySlug),
    };
    const parsed = SignageClientFileSchema.safeParse(nextClient);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Updated client failed validation',
          issues: parsed.error.issues,
        },
        { status: 500 },
      );
    }
    await kvSignageClient.set(client, parsed.data);
  } catch (e) {
    return NextResponse.json(
      { error: `KV delete failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, deletedAt: Date.now() });
}
