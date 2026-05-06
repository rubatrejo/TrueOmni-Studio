import { NextResponse } from 'next/server';

import { kv, kvKeys } from '@/lib/studio/kv';
import { KioskConfigSchema, type ConfigMeta, type KioskConfig } from '@/lib/studio/schema';
import { takeSnapshot } from '@/lib/studio/snapshots';

/**
 * `POST /api/studio/configs/[slug]/import`
 *
 * Body: el JSON exportado por `GET /export`. Valida con zod y sobreescribe
 * el KV del kiosk identificado por `slug`. El `slug`/`nombre` del body se
 * sobreescriben con los del path para evitar inyectar identidad ajena.
 *
 * Hallazgo #25 del audit: contraparte del export. Permite restaurar un
 * backup o transferir un kiosk de un entorno a otro.
 */
type RouteParams = { params: Promise<{ slug: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const exists = await kv.exists(kvKeys.cfg(slug));
    if (!exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 });
    }

    // Forzamos slug/nombre del path — el JSON importado puede venir de otro
    // kiosk pero la identidad la define el destino, no el origen.
    const target = await kv.get<KioskConfig>(kvKeys.cfg(slug));
    const patched = {
      ...(body as Record<string, unknown>),
      slug,
      nombre: typeof (body as Record<string, unknown>).nombre === 'string'
        ? (body as Record<string, unknown>).nombre
        : (target?.nombre ?? slug),
    };

    const parsed = KioskConfigSchema.safeParse(patched);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid config JSON', issues: parsed.error.issues.slice(0, 20) },
        { status: 400 },
      );
    }

    // Snapshot del estado actual antes de sobreescribir (#9 audit) — el
    // import es destructivo, queremos que el operador pueda deshacer.
    if (target) await takeSnapshot(slug, target, 'import');

    await kv.set(kvKeys.cfg(slug), parsed.data);

    // Bumpear lastEditedAt en metadata.
    const meta = (await kv.get<ConfigMeta>(kvKeys.cfgMeta(slug))) ?? null;
    if (meta) {
      const nextMeta: ConfigMeta = { ...meta, lastEditedAt: new Date().toISOString() };
      await kv.set(kvKeys.cfgMeta(slug), nextMeta);
    }

    return NextResponse.json({ slug, config: parsed.data, meta }, { status: 200 });
  } catch (error) {
    console.error('[api/studio/configs/[slug]/import POST]', error);
    return NextResponse.json({ error: 'Failed to import config' }, { status: 500 });
  }
}
