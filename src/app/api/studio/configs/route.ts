import { NextResponse } from 'next/server';

import { kv, kvKeys } from '@/lib/studio/kv';
import { type ConfigMeta, type KioskConfig } from '@/lib/studio/schema';

/**
 * `/api/studio/configs` — endpoint legacy kiosk-only.
 *
 * Solo GET sobrevive como compatibilidad con consumidores que listan kiosks
 * del KV. POST migró a `/api/studio/clients` (modelo cliente-primero Fase 4)
 * y se retiró en este sprint al confirmar cero consumidores vivos.
 *
 * Sub-rutas activas (no afectadas): `[slug]` (GET/PATCH/DELETE), `[slug]/clone`,
 * `[slug]/import`, `[slug]/export`, `[slug]/resync`, `[slug]/snapshots`.
 */

export async function GET() {
  try {
    const slugs = await kv.smembers(kvKeys.clientsList);
    const configs = await Promise.all(
      slugs.map(async (slug) => {
        // F-CORE-5: cfg y meta son lecturas independientes → en paralelo.
        const [cfg, meta] = await Promise.all([
          kv.get<KioskConfig>(kvKeys.cfg(slug)),
          kv.get<ConfigMeta>(kvKeys.cfgMeta(slug)),
        ]);
        if (!cfg) return null;
        return { ...cfg, meta };
      }),
    );
    return NextResponse.json({ configs: configs.filter(Boolean) });
  } catch (error) {
    console.error('[api/studio/configs GET]', error);
    return NextResponse.json({ error: 'Failed to list configs' }, { status: 500 });
  }
}
