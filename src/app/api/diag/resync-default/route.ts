import { NextResponse } from 'next/server';

import { bootstrapStudioFromFs, readClientFs } from '@/lib/studio/bootstrap-from-fs';
import { kv, kvKeys } from '@/lib/studio/kv';
import {
  type ConfigMeta,
  type KioskConfig,
  KioskConfigSchema,
  makeBlankConfig,
} from '@/lib/studio/schema';

/**
 * `GET /api/diag/resync-default` — temporal admin operation.
 *
 * Re-aplica bootstrap-from-fs sobre el KV del kiosk `default` para
 * propagar cambios del filesystem (clients/default/config.json) que el
 * KV no había refrescado.
 *
 * Usado GET en lugar de POST para que sea invocable desde
 * `web_fetch_vercel_url` que no soporta POST. NO está bajo el matcher
 * del middleware (`/api/studio/:path*`) por estar en `/api/diag/*`,
 * así que es público — borrar después de migrar.
 */
export async function GET() {
  try {
    const slug = 'default';
    const fs = await readClientFs(slug);
    if (!fs.config) {
      return NextResponse.json({ error: 'fs/clients/default missing' }, { status: 404 });
    }

    // Force fresh bootstrap: arrancar SIEMPRE desde makeBlankConfig (factory
    // defaults) e hidratar desde fs. Garantiza que cambios al template
    // (Trip Builder rename, Restaurants label, AI question copy, hashtag)
    // se propaguen al KV ignorando "customizaciones" que en realidad eran
    // sólo el shape antiguo del fs persistido.
    const base = makeBlankConfig(slug, fs.config.client?.nombre ?? 'TrueOmni Default');
    const next = bootstrapStudioFromFs(base, fs.config, fs.tokensCss);

    const parsed = KioskConfigSchema.safeParse(next);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid', issues: parsed.error.issues },
        { status: 500 },
      );
    }

    const now = new Date().toISOString();
    const existingMeta = await kv.get<ConfigMeta>(kvKeys.cfgMeta(slug));
    const meta: ConfigMeta = existingMeta
      ? { ...existingMeta, lastEditedAt: now }
      : { slug, createdAt: now, lastEditedAt: now, currentVersion: 0 };

    await kv.set(kvKeys.cfg(slug), parsed.data);
    await kv.set(kvKeys.cfgMeta(slug), meta);
    await kv.sadd(kvKeys.clientsList, slug);

    return NextResponse.json({
      ok: true,
      slug,
      summary: {
        nombre: parsed.data.nombre,
        listingsCount: parsed.data.listings?.length ?? 0,
        listingsLabels: parsed.data.listings?.map((l) => l.label) ?? [],
        eventsCount: parsed.data.events?.events?.length ?? 0,
        socialWallHashtag: parsed.data.socialWall?.hashtag,
      },
    });
  } catch (error) {
    console.error('[api/diag/resync-default]', error);
    const message = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
