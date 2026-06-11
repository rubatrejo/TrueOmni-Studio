import { NextResponse } from 'next/server';

import { kv, kvKeys } from '@/lib/studio/kv';
import type { KioskConfig } from '@/lib/studio/schema';

/**
 * `POST /api/studio/configs/export-bulk`
 *
 * Bulk export del dashboard (F-HUB-9). Recibe `{ slugs: string[] }` y
 * ensambla un ÚNICO JSON con el config de cada cliente. Un solo archivo
 * (en lugar de N descargas) evita que el browser bloquee descargas
 * múltiples y deja un backup atómico moviblе entre entornos.
 *
 * Los slugs sin config en KV se reportan en `missing` (sin truncado
 * silencioso) en vez de fallar toda la operación.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { slugs?: unknown };
    const slugs = Array.isArray(body.slugs)
      ? Array.from(new Set(body.slugs.filter((s): s is string => typeof s === 'string')))
      : [];

    if (slugs.length === 0) {
      return NextResponse.json({ error: 'No slugs provided' }, { status: 400 });
    }

    const configs: Record<string, KioskConfig> = {};
    const missing: string[] = [];
    for (const slug of slugs) {
      const cfg = await kv.get<KioskConfig>(kvKeys.cfg(slug));
      if (cfg) configs[slug] = cfg;
      else missing.push(slug);
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      count: Object.keys(configs).length,
      missing,
      configs,
    };

    const filename = `studio-export-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[api/studio/configs/export-bulk POST]', error);
    return NextResponse.json({ error: 'Failed to export configs' }, { status: 500 });
  }
}
