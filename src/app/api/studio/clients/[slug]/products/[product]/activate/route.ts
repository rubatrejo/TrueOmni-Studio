import { NextResponse } from 'next/server';

import { kSignageClient, kSignageClientList } from '@/lib/signage/kv-keys';
import { loadSignageClient } from '@/lib/signage/config';
import {
  SignageClientFileSchema,
  type SignageClientFile,
} from '@/lib/signage/schema';
import { bootstrapStudioFromFs, readClientFs } from '@/lib/studio/bootstrap-from-fs';
import {
  loadUnifiedBranding,
  unifiedToKioskBranding,
  unifiedToSignageBranding,
} from '@/lib/studio/client-branding-sync';
import {
  loadClientManifest,
  saveClientManifest,
  type ProductId,
} from '@/lib/studio/client-manifest';
import { kv, kvKeys } from '@/lib/studio/kv';
import {
  KioskConfigSchema,
  makeBlankConfig,
  type ConfigMeta,
} from '@/lib/studio/schema';

export const dynamic = 'force-dynamic';

const TEMPLATE_SLUG = 'default';

const VALID_PRODUCTS: readonly ProductId[] = [
  'kiosks',
  'digitalDisplays',
  'mobilePwa',
  'videoWalls',
  'tablets',
];

interface RouteParams {
  params: Promise<{ slug: string; product: string }>;
}

/**
 * `POST /api/studio/clients/[slug]/products/[product]/activate`
 *
 * Activa un producto para un cliente unificado existente:
 *  1. Verifica que el manifest del cliente exista.
 *  2. Si el producto ya está activo: devuelve 200 sin operar (idempotente).
 *  3. Clona el config del producto desde el template `default`, mergeando el
 *     branding unificado del cliente para que arranque ya con su identidad
 *     visual (no con la del template).
 *  4. Marca `manifest.products.{productId}` = true y persiste.
 *
 * Para productos coming-soon (mobile-pwa, video-walls, tablets) por ahora
 * solo flipea el flag del manifest — no hay config que clonar.
 */
export async function POST(_req: Request, { params }: RouteParams) {
  const { slug, product } = await params;

  // Mapping URL segment → ProductId (camelCase del manifest).
  const productId: ProductId | null = (() => {
    if (product === 'kiosks') return 'kiosks';
    if (product === 'digital-displays') return 'digitalDisplays';
    if (product === 'mobile-pwa') return 'mobilePwa';
    if (product === 'video-walls') return 'videoWalls';
    if (product === 'tablets') return 'tablets';
    return null;
  })();
  if (!productId || !VALID_PRODUCTS.includes(productId)) {
    return NextResponse.json(
      { error: `unknown product "${product}"` },
      { status: 400 },
    );
  }

  const manifest = await loadClientManifest(slug);
  if (!manifest) {
    return NextResponse.json(
      { error: `client "${slug}" not found` },
      { status: 404 },
    );
  }

  if (manifest.products[productId]) {
    return NextResponse.json({ ok: true, alreadyActive: true });
  }

  const branding = await loadUnifiedBranding(slug);
  if (!branding) {
    return NextResponse.json(
      { error: `unified branding missing for "${slug}"` },
      { status: 500 },
    );
  }

  // Activación específica por producto.
  if (productId === 'kiosks') {
    const fsTemplate = await readClientFs(TEMPLATE_SLUG);
    let cfg = makeBlankConfig(slug, manifest.name, 'portrait');
    if (fsTemplate.config) {
      cfg = bootstrapStudioFromFs(cfg, fsTemplate.config, fsTemplate.tokensCss);
      cfg.slug = slug;
      cfg.nombre = manifest.name;
      cfg.currentVersion = 0;
    }
    cfg.branding = { ...cfg.branding, ...unifiedToKioskBranding(branding) };
    if (branding.website || branding.location?.city) {
      cfg.clientInfo = {
        website: branding.website ?? '',
        location: branding.location?.city ?? '',
        ...(branding.location?.lat != null && branding.location?.lon != null
          ? { coords: { lat: branding.location.lat, lng: branding.location.lon } }
          : {}),
      };
    }
    const validated = KioskConfigSchema.safeParse(cfg);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'kiosk config validation failed', issues: validated.error.issues },
        { status: 500 },
      );
    }
    const created = await kv.set(kvKeys.cfg(slug), validated.data, { nx: true });
    if (created !== 'OK') {
      return NextResponse.json(
        { error: `kiosk config already exists for "${slug}"` },
        { status: 409 },
      );
    }
    const meta: ConfigMeta = {
      slug,
      createdAt: new Date().toISOString(),
      lastEditedAt: new Date().toISOString(),
      currentVersion: 0,
    };
    await kv.set(kvKeys.cfgMeta(slug), meta);
    await kv.sadd(kvKeys.clientsList, slug);
  } else if (productId === 'digitalDisplays') {
    const template = await loadSignageClient(TEMPLATE_SLUG);
    if (!template) {
      return NextResponse.json(
        { error: `signage template "${TEMPLATE_SLUG}" not available` },
        { status: 500 },
      );
    }
    const clone: SignageClientFile = {
      slug,
      name: manifest.name,
      locale: template.locale,
      timezone: template.timezone,
      location: {
        ...template.location,
        ...(branding.location?.city ? { city: branding.location.city } : null),
        ...(branding.location?.lat != null ? { lat: branding.location.lat } : null),
        ...(branding.location?.lon != null ? { lon: branding.location.lon } : null),
      },
      website: branding.website ?? template.website,
      branding: {
        ...structuredClone(template.branding),
        ...unifiedToSignageBranding(branding),
      },
      header: structuredClone(template.header),
      displays: [],
    };
    const validated = SignageClientFileSchema.safeParse(clone);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'signage clone validation failed', issues: validated.error.issues },
        { status: 500 },
      );
    }
    await kv.set(kSignageClient(slug), validated.data);
    await kv.sadd(kSignageClientList, slug);
  }
  // Para mobile-pwa/video-walls/tablets: solo flipea el flag por ahora.
  // Cuando se implementen, agregar aquí la lógica de clone.

  await saveClientManifest({
    ...manifest,
    products: { ...manifest.products, [productId]: true },
    lastEditedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, productId });
}
