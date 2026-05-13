import { NextResponse } from 'next/server';

import { loadSignageClient } from '@/lib/signage/config';
import { kSignageClient, kSignageClientList } from '@/lib/signage/kv-keys';
import { SignageClientFileSchema, type SignageClientFile } from '@/lib/signage/schema';
import { bootstrapStudioFromFs, readClientFs } from '@/lib/studio/bootstrap-from-fs';
import {
  loadUnifiedBranding,
  unifiedToKioskBranding,
  unifiedToSignageBranding,
  type UnifiedClientBranding,
} from '@/lib/studio/client-branding-sync';
import {
  loadClientManifest,
  saveClientManifest,
  type ProductId,
} from '@/lib/studio/client-manifest';
import { kv, kvKeys } from '@/lib/studio/kv';
import { KioskConfigSchema, makeBlankConfig, type ConfigMeta } from '@/lib/studio/schema';
import { applyClonedWalls, cloneVideoWallsFromFs } from '@/lib/video-walls/bootstrap-from-fs';
import { loadVideoWallClient } from '@/lib/video-walls/config';
import { kVideoWallClient, kVideoWallClientList } from '@/lib/video-walls/kv-keys';
import { VideoWallClientFileSchema, type VideoWallClientFile } from '@/lib/video-walls/schema';

export const dynamic = 'force-dynamic';

const TEMPLATE_SLUG = 'default';

/** `z.string().url()` rechaza "" — normalizar a undefined. */
function normalizeUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Fallback blank signage cuando el template `default` no está disponible
 * (filesystem corrupto + KV vacío). Hallazgo S-09 del audit panorámico v2.
 * Genera el shape mínimo válido para que el editor abra; el operador
 * configura header/playlist/etc desde la UI.
 */
function makeBlankSignageClient(
  slug: string,
  name: string,
  branding: UnifiedClientBranding,
): SignageClientFile {
  return {
    slug,
    name,
    locale: 'en',
    timezone: 'America/Phoenix',
    location: {
      city: branding.location?.city ?? '',
      lat: branding.location?.lat ?? 0,
      lon: branding.location?.lon ?? 0,
    },
    website: normalizeUrl(branding.website),
    branding: {
      ...unifiedToSignageBranding(branding),
      logos: { default: branding.logos.default || 'assets/logo.svg' },
      fonts: {
        display: branding.fonts.display ?? 'Montserrat',
        body: branding.fonts.body ?? 'Open Sans',
        displayCustom: undefined,
        bodyCustom: undefined,
      },
    },
    header: {
      position: 'top',
      height: 100,
      layout: 'logo-left',
      weatherPlacement: 'center',
      clockPlacement: 'right',
      background: { kind: 'color', color: '#0b1f3a' },
      showLogo: true,
      showWeather: true,
      showClock: true,
      clockFormat: '12h',
      weatherUnits: 'imperial',
      forecastDays: 1,
    },
    displays: [],
  };
}

/**
 * Fallback blank video-walls client cuando el template `default` no
 * está disponible. Mismo patrón que makeBlankSignageClient — un cliente
 * con header default + branding del usuario y `walls: []`.
 */
function makeBlankVideoWallClient(
  slug: string,
  name: string,
  branding: UnifiedClientBranding,
): VideoWallClientFile {
  return {
    slug,
    name,
    locale: 'en',
    timezone: 'America/Phoenix',
    location: {
      city: branding.location?.city ?? '',
      lat: branding.location?.lat ?? 0,
      lon: branding.location?.lon ?? 0,
    },
    website: normalizeUrl(branding.website),
    branding: {
      ...unifiedToSignageBranding(branding),
      logos: { default: branding.logos.default || 'assets/logo.svg' },
      fonts: {
        display: branding.fonts.display ?? 'Montserrat',
        body: branding.fonts.body ?? 'Open Sans',
        displayCustom: undefined,
        bodyCustom: undefined,
      },
    },
    header: {
      position: 'top',
      height: 100,
      layout: 'logo-left',
      weatherPlacement: 'center',
      clockPlacement: 'right',
      background: { kind: 'color', color: '#0b1f3a' },
      showLogo: true,
      showWeather: true,
      showClock: true,
      clockFormat: '12h',
      weatherUnits: 'imperial',
      forecastDays: 1,
    },
    walls: [],
  };
}

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
    return NextResponse.json({ error: `unknown product "${product}"` }, { status: 400 });
  }

  const manifest = await loadClientManifest(slug);
  if (!manifest) {
    return NextResponse.json({ error: `client "${slug}" not found` }, { status: 404 });
  }

  if (manifest.products[productId]) {
    return NextResponse.json({ ok: true, alreadyActive: true });
  }

  const branding = await loadUnifiedBranding(slug);
  if (!branding) {
    return NextResponse.json({ error: `unified branding missing for "${slug}"` }, { status: 500 });
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
    // Hallazgo S-09: si el template `default` no existe (KV reset + fs
    // corrupto, edge case), fallback a un blank signage con defaults
    // TrueOmni en lugar de 500. Permite al operador configurar el signage
    // a mano desde la Vista de Cliente sin necesidad de restaurar el
    // template primero.
    const clone: SignageClientFile = template
      ? {
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
          website: normalizeUrl(branding.website) ?? normalizeUrl(template.website),
          branding: {
            ...structuredClone(template.branding),
            ...unifiedToSignageBranding(branding),
          },
          header: structuredClone(template.header),
          displays: [],
        }
      : makeBlankSignageClient(slug, manifest.name, branding);
    const validated = SignageClientFileSchema.safeParse(clone);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'signage clone validation failed', issues: validated.error.issues },
        { status: 500 },
      );
    }
    await kv.set(kSignageClient(slug), validated.data);
    await kv.sadd(kSignageClientList, slug);
  } else if (productId === 'videoWalls') {
    // Idempotencia extra: si el KV ya tiene un videowall client persistido
    // (drift recovery del page lo creó antes), no sobrescribir. Solo flippea
    // el flag del manifest abajo.
    const existingVwClient = await kv.get(kVideoWallClient(slug));
    if (existingVwClient) {
      // eslint-disable-next-line no-console
      console.info(
        `[video-walls:activate] KV client "${slug}" already exists, preserving; only flipping manifest flag.`,
      );
    } else {
      const template = await loadVideoWallClient(TEMPLATE_SLUG);
      const clone: VideoWallClientFile = template
        ? {
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
            website: normalizeUrl(branding.website) ?? normalizeUrl(template.website),
            branding: {
              ...structuredClone(template.branding),
              ...unifiedToSignageBranding(branding),
            },
            header: structuredClone(template.header),
            walls: [],
          }
        : makeBlankVideoWallClient(slug, manifest.name, branding);

      // G1 (audit 2026-05-12): clonar walls del template fs al KV del cliente
      // nuevo. Antes arrancábamos con `walls: []` siempre, descartando el
      // demo content del template (`clients-walls/default/walls/lobby-3x2/`).
      const clonedWalls = await cloneVideoWallsFromFs(TEMPLATE_SLUG, slug);
      applyClonedWalls(clone, clonedWalls);

      const validated = VideoWallClientFileSchema.safeParse(clone);
      if (!validated.success) {
        return NextResponse.json(
          { error: 'video-walls clone validation failed', issues: validated.error.issues },
          { status: 500 },
        );
      }
      await kv.set(kVideoWallClient(slug), validated.data);
      await kv.sadd(kVideoWallClientList, slug);
    }
  }
  // Para mobile-pwa/tablets: solo flipea el flag por ahora.
  // Cuando se implementen, agregar aquí la lógica de clone.

  await saveClientManifest({
    ...manifest,
    products: { ...manifest.products, [productId]: true },
    lastEditedAt: new Date().toISOString(),
  });

  // Hallazgo S-37: invalidar cache para reflejar el cambio de productos.
  try {
    const { invalidateAutoMigrateCache } = await import('@/lib/studio/auto-migrate-clients');
    invalidateAutoMigrateCache();
  } catch {
    /* noop */
  }

  return NextResponse.json({ ok: true, productId });
}
