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

    // S-12: clonar también la entidad unified (manifest + branding +
    // signage si el source lo tenía). Antes solo se clonaba el kiosk →
    // el clone aparecía como nuevo cliente sin manifest, dependía de
    // auto-migrate para reconciliar. Ahora replica todo de una vez.
    try {
      const { kSignageClient, kSignageClientList } = await import(
        '@/lib/signage/kv-keys'
      );
      const { SignageClientFileSchema } = await import('@/lib/signage/schema');
      const {
        kioskToUnifiedBranding,
        loadUnifiedBranding,
        saveUnifiedBrandingOnly,
      } = await import('@/lib/studio/client-branding-sync');
      const {
        loadClientManifest,
        makeBlankManifest,
        saveClientManifest,
      } = await import('@/lib/studio/client-manifest');

      const sourceManifest = await loadClientManifest(source);
      const sourceBranding = await loadUnifiedBranding(source);

      // Branding: source unified si existe, si no derivar del kiosk.
      const newBranding =
        sourceBranding != null
          ? { ...sourceBranding, name: body.newNombre }
          : kioskToUnifiedBranding(validated.data.branding, {
              nombre: body.newNombre,
              website: validated.data.clientInfo?.website,
              location: validated.data.clientInfo?.location,
              coords: validated.data.clientInfo?.coords,
            });
      await saveUnifiedBrandingOnly(body.newSlug, newBranding);

      // Manifest: heredar productos activos del source (si existían).
      // Pinned NO se hereda (pin es operador-specific).
      const products = sourceManifest?.products ?? { kiosks: true } as const;
      const newManifest = makeBlankManifest(body.newSlug, body.newNombre, {
        ...products,
        // El kiosk acabamos de crearlo, garantiza true.
        kiosks: true,
      });
      await saveClientManifest(newManifest);

      // Signage: si el source tenía digital displays, clonar el client.json.
      if (sourceManifest?.products.digitalDisplays) {
        const sourceSignage = await kv.get(kSignageClient(source));
        if (sourceSignage) {
          const parsed = SignageClientFileSchema.safeParse({
            ...(sourceSignage as object),
            slug: body.newSlug,
            name: body.newNombre,
            displays: [],
          });
          if (parsed.success) {
            await kv.set(kSignageClient(body.newSlug), parsed.data);
            await kv.sadd(kSignageClientList, body.newSlug);
          }
        }
      }
    } catch (cloneSyncErr) {
      console.warn(
        '[api/studio/configs/[slug]/clone POST] unified clone sync failed',
        cloneSyncErr,
      );
    }

    return NextResponse.json(
      { slug: body.newSlug, config: validated.data, meta },
      { status: 201 },
    );
  } catch (error) {
    console.error('[api/studio/configs/[slug]/clone POST]', error);
    return NextResponse.json({ error: 'Failed to clone config' }, { status: 500 });
  }
}
