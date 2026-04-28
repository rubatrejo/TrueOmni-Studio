import { NextResponse } from 'next/server';

import { kv, kvKeys } from '@/lib/studio/kv';
import {
  type ConfigMeta,
  type KioskConfig,
  makeBlankConfig,
} from '@/lib/studio/schema';

/**
 * `/api/studio/seed`
 *
 * POST → asegura que el cliente `default` (TrueOmni) existe en KV.
 * Si no existe, lo crea con el branding hardcoded del template
 * (TrueOmni Tech Blue). Idempotente: si ya existe, no toca nada.
 *
 * Útil para arrancar el Studio limpio: la primera vez que abres
 * `/studio`, hay un cliente listo para editar.
 */
export async function POST() {
  try {
    const slug = 'default';
    const exists = await kv.exists(kvKeys.cfg(slug));
    if (exists) {
      return NextResponse.json({ slug, seeded: false, reason: 'already exists' });
    }

    const cfg: KioskConfig = makeBlankConfig(slug, 'TrueOmni Default');
    const now = new Date().toISOString();
    const meta: ConfigMeta = {
      slug,
      createdAt: now,
      lastEditedAt: now,
      currentVersion: 0,
    };

    await kv.set(kvKeys.cfg(slug), cfg);
    await kv.set(kvKeys.cfgMeta(slug), meta);
    await kv.sadd(kvKeys.clientsList, slug);

    return NextResponse.json({ slug, seeded: true, config: cfg, meta }, { status: 201 });
  } catch (error) {
    console.error('[api/studio/seed POST]', error);
    return NextResponse.json({ error: 'Failed to seed' }, { status: 500 });
  }
}
