import { NextResponse } from 'next/server';

import { bootstrapStudioFromFs, readClientFs } from '@/lib/studio/bootstrap-from-fs';
import { kv, kvKeys } from '@/lib/studio/kv';
import {
  type ConfigMeta,
  type KioskConfig,
  KioskConfigSchema,
  makeBlankConfig,
} from '@/lib/studio/schema';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * `POST /api/studio/configs/[slug]/resync`
 *
 * Re-aplica el bootstrap-from-fs sobre el config del KV. Útil cuando se
 * actualiza el filesystem del template (`clients/default/config.json`) y
 * el KV de un kiosk existente quedó stale con valores viejos (eg.
 * "Itinerary Builder" en lugar de "Trip Builder", "Food & Drink" en
 * lugar de "Restaurants", events sin densidad, AI question con "Town").
 *
 * Política de merge — preserva customizaciones del operador:
 *   - Si el field del KV ESTÁ en estado factory default (estructural),
 *     se hidrata desde fs.
 *   - Si el operador YA editó el field (no matchea factory), se preserva
 *     intacto. Mismo comportamiento que `bootstrapStudioFromFs` que el
 *     editor ya ejecuta en cada render del page.
 *
 * El endpoint también guarda el resultado en KV (a diferencia del bootstrap
 * que solo era in-memory para el render). Eso garantiza que el bridge
 * envíe los nuevos defaults al iframe del preview sin esperar al Save del
 * operador.
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const url = new URL(req.url);
    /**
     * `?force=true` ignora el KV existente y arranca de `makeBlankConfig`
     * antes de bootstrapear desde fs. Útil cuando el operador hizo
     * customizaciones obsoletas (eg. "Food & Drink" como label de listings)
     * y quiere alinear el KV al fs canónico. Sin force, las
     * customizaciones del operador se preservan.
     */
    const force = url.searchParams.get('force') === 'true';

    const fs = await readClientFs(slug);
    if (!fs.config) {
      return NextResponse.json(
        { error: `Filesystem template "${slug}" not found.` },
        { status: 404 },
      );
    }

    // Si el KV tiene config existente y no hay force, lo usamos como base
    // (preserva customizaciones). Con force, makeBlankConfig + bootstrap.
    const existing = force ? null : await kv.get<KioskConfig>(kvKeys.cfg(slug));
    const base =
      existing ??
      makeBlankConfig(slug, fs.config.client?.nombre ?? slug);

    const next = bootstrapStudioFromFs(base, fs.config, fs.tokensCss);

    const parsed = KioskConfigSchema.safeParse(next);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bootstrap produjo config inválido', issues: parsed.error.issues },
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

    return NextResponse.json({ slug, resynced: true, config: parsed.data, meta });
  } catch (error) {
    console.error('[api/studio/configs/[slug]/resync POST]', error);
    return NextResponse.json({ error: 'Failed to resync' }, { status: 500 });
  }
}
