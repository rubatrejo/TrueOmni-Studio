import { NextResponse } from 'next/server';

import { kv, kvKeys } from '@/lib/studio/kv';
import {
  BrandingSchema,
  KioskConfigSchema,
  type ConfigMeta,
  type KioskConfig,
} from '@/lib/studio/schema';

/**
 * `/api/studio/configs/[slug]`
 *
 *   GET    → devuelve el KioskConfig actual + meta del slug.
 *   PATCH  → actualiza una sección parcial. Hoy soporta `{ branding }`;
 *            en fases siguientes se irán añadiendo modules/content/i18n/etc.
 *   DELETE → borra el cliente del KV (cfg + meta + entry en clients:list).
 *
 * NOTA: la "publicación" a `clients/<slug>/` (filesystem o GitHub PR) se
 * hará en `/api/studio/publish` (Fase S7). Estos endpoints solo manejan
 * la working copy en KV.
 */

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const cfg = await kv.get<KioskConfig>(kvKeys.cfg(slug));
    if (!cfg) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const meta = await kv.get<ConfigMeta>(kvKeys.cfgMeta(slug));
    return NextResponse.json({ config: cfg, meta });
  } catch (error) {
    console.error('[api/studio/configs/[slug] GET]', error);
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const cfg = await kv.get<KioskConfig>(kvKeys.cfg(slug));
    if (!cfg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = (await req.json()) as { branding?: unknown };

    let next: KioskConfig = cfg;
    if (body.branding !== undefined) {
      const parsed = BrandingSchema.safeParse(body.branding);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid branding', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      next = { ...cfg, branding: parsed.data };
    }

    const validated = KioskConfigSchema.safeParse(next);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid config after patch', issues: validated.error.issues },
        { status: 400 },
      );
    }

    await kv.set(kvKeys.cfg(slug), validated.data);

    // Actualizar meta.lastEditedAt
    const meta = (await kv.get<ConfigMeta>(kvKeys.cfgMeta(slug))) ?? null;
    if (meta) {
      const updatedMeta: ConfigMeta = {
        ...meta,
        lastEditedAt: new Date().toISOString(),
      };
      await kv.set(kvKeys.cfgMeta(slug), updatedMeta);
    }

    return NextResponse.json({ config: validated.data });
  } catch (error) {
    console.error('[api/studio/configs/[slug] PATCH]', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    await kv.del(kvKeys.cfg(slug));
    await kv.del(kvKeys.cfgMeta(slug));
    await kv.srem(kvKeys.clientsList, slug);
    return NextResponse.json({ slug, deleted: true });
  } catch (error) {
    console.error('[api/studio/configs/[slug] DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete config' }, { status: 500 });
  }
}
