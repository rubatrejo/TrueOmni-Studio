import { NextResponse } from 'next/server';

import { kv, kvKeys } from '@/lib/studio/kv';
import {
  KioskConfigSchema,
  type ConfigMeta,
  type KioskConfig,
  makeBlankConfig,
} from '@/lib/studio/schema';

/**
 * `/api/studio/configs`
 *
 *   GET  → lista todos los clientes activos del KV.
 *           Devuelve: { configs: { slug, nombre, branding, currentVersion, lastEditedAt }[] }
 *
 *   POST → crea cliente nuevo a partir de { slug, nombre } (clona branding default).
 *           Si el slug ya existe, devuelve 409.
 */

export async function GET() {
  try {
    const slugs = await kv.smembers(kvKeys.clientsList);
    const configs = await Promise.all(
      slugs.map(async (slug) => {
        const cfg = await kv.get<KioskConfig>(kvKeys.cfg(slug));
        const meta = await kv.get<ConfigMeta>(kvKeys.cfgMeta(slug));
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slug?: string; nombre?: string };
    if (!body.slug || !body.nombre) {
      return NextResponse.json({ error: 'slug and nombre are required' }, { status: 400 });
    }

    const config = makeBlankConfig(body.slug, body.nombre);
    const parsed = KioskConfigSchema.safeParse(config);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid config', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const existing = await kv.exists(kvKeys.cfg(body.slug));
    if (existing) {
      return NextResponse.json({ error: `slug "${body.slug}" already exists` }, { status: 409 });
    }

    const now = new Date().toISOString();
    const meta: ConfigMeta = {
      slug: body.slug,
      createdAt: now,
      lastEditedAt: now,
      currentVersion: 0,
    };

    await kv.set(kvKeys.cfg(body.slug), parsed.data);
    await kv.set(kvKeys.cfgMeta(body.slug), meta);
    await kv.sadd(kvKeys.clientsList, body.slug);

    return NextResponse.json({ slug: body.slug, config: parsed.data, meta }, { status: 201 });
  } catch (error) {
    console.error('[api/studio/configs POST]', error);
    return NextResponse.json({ error: 'Failed to create config' }, { status: 500 });
  }
}
