import { NextResponse } from 'next/server';

import { kv, kvKeys } from '@/lib/studio/kv';
import {
  KioskConfigSchema,
  defaultModules,
  type ConfigMeta,
  type KioskConfig,
} from '@/lib/studio/schema';

/**
 * `/api/studio/configs/[slug]/clone`
 *
 * POST { newSlug, newNombre }
 *   → clona el cliente `slug` con todos sus tokens/branding/etc bajo
 *     un nuevo `newSlug`. El nuevo cliente arranca en versión 0.
 */

type RouteParams = { params: Promise<{ slug: string }> };

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;

export async function POST(req: Request, { params }: RouteParams) {
  const { slug: source } = await params;
  try {
    const body = (await req.json()) as { newSlug?: string; newNombre?: string };
    if (!body.newSlug || !body.newNombre) {
      return NextResponse.json(
        { error: 'newSlug and newNombre are required' },
        { status: 400 },
      );
    }
    if (!SLUG_REGEX.test(body.newSlug)) {
      return NextResponse.json({ error: 'Invalid newSlug' }, { status: 400 });
    }

    const sourceCfg = await kv.get<KioskConfig>(kvKeys.cfg(source));
    if (!sourceCfg) {
      return NextResponse.json({ error: `Source slug "${source}" not found` }, { status: 404 });
    }

    const cloned: KioskConfig = {
      ...sourceCfg,
      slug: body.newSlug,
      nombre: body.newNombre,
      modules: sourceCfg.modules ?? defaultModules(),
      currentVersion: 0,
    };
    const validated = KioskConfigSchema.safeParse(cloned);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid cloned config', issues: validated.error.issues },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const meta: ConfigMeta = {
      slug: body.newSlug,
      createdAt: now,
      lastEditedAt: now,
      currentVersion: 0,
    };

    // Lock atómico (mismo patrón que POST /api/studio/configs).
    const created = await kv.set(kvKeys.cfg(body.newSlug), validated.data, { nx: true });
    if (created !== 'OK') {
      return NextResponse.json(
        { error: `Slug "${body.newSlug}" already exists` },
        { status: 409 },
      );
    }
    await kv.set(kvKeys.cfgMeta(body.newSlug), meta);
    await kv.sadd(kvKeys.clientsList, body.newSlug);

    return NextResponse.json(
      { slug: body.newSlug, config: validated.data, meta },
      { status: 201 },
    );
  } catch (error) {
    console.error('[api/studio/configs/[slug]/clone POST]', error);
    return NextResponse.json({ error: 'Failed to clone config' }, { status: 500 });
  }
}
