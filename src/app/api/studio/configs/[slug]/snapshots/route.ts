import { NextResponse } from 'next/server';

import { kv, kvKeys } from '@/lib/studio/kv';
import { KioskConfigSchema, type ConfigMeta, type KioskConfig } from '@/lib/studio/schema';
import { listSnapshots, readSnapshot, takeSnapshot } from '@/lib/studio/snapshots';

/**
 * `GET  /api/studio/configs/[slug]/snapshots`
 *      → lista de snapshots disponibles para revert.
 *
 * `POST /api/studio/configs/[slug]/snapshots`  body: { ts: string }
 *      → restaura el snapshot identificado por `ts` como current config.
 *      Antes de aplicar, snapshotea el estado actual con reason='revert'
 *      para que el operador pueda "un-revert".
 *
 * Hallazgo #9 del audit.
 */
type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const exists = await kv.exists(kvKeys.cfg(slug));
    if (!exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const entries = await listSnapshots(slug);
    return NextResponse.json({ slug, entries });
  } catch (error) {
    console.error('[api/studio/configs/[slug]/snapshots GET]', error);
    return NextResponse.json({ error: 'Failed to list snapshots' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const body = (await req.json()) as { ts?: string };
    if (!body.ts || typeof body.ts !== 'string') {
      return NextResponse.json({ error: 'Body must include `ts`' }, { status: 400 });
    }

    const snapshot = await readSnapshot(slug, body.ts);
    if (!snapshot) {
      return NextResponse.json(
        { error: `Snapshot ${body.ts} not found (TTL expired or invalid)` },
        { status: 404 },
      );
    }

    // Validar antes de escribir — un snapshot viejo puede tener un schema
    // shape obsoleto si añadimos fields requeridos después de tomarlo.
    const parsed = KioskConfigSchema.safeParse(snapshot);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            'Snapshot is not parseable with current schema (likely from before a breaking change). Cannot revert safely.',
          issues: parsed.error.issues.slice(0, 10),
        },
        { status: 422 },
      );
    }

    // Snapshot del estado ACTUAL antes del revert para permitir "un-revert".
    const current = await kv.get<KioskConfig>(kvKeys.cfg(slug));
    if (current) await takeSnapshot(slug, current, 'revert');

    // Aplicar el revert. slug/nombre del snapshot se respetan (el operador
    // está restaurando el state completo, no transferiendo identity).
    await kv.set(kvKeys.cfg(slug), parsed.data);

    const meta = (await kv.get<ConfigMeta>(kvKeys.cfgMeta(slug))) ?? null;
    if (meta) {
      await kv.set(kvKeys.cfgMeta(slug), { ...meta, lastEditedAt: new Date().toISOString() });
    }

    return NextResponse.json({ slug, revertedTo: body.ts, config: parsed.data });
  } catch (error) {
    console.error('[api/studio/configs/[slug]/snapshots POST]', error);
    return NextResponse.json({ error: 'Failed to revert snapshot' }, { status: 500 });
  }
}
