import { NextResponse } from 'next/server';

import { bootstrapStudioFromFs, readClientFs } from '@/lib/studio/bootstrap-from-fs';
import { kv, kvKeys } from '@/lib/studio/kv';
import {
  emptyDemoContentInPlace,
  geocodeLocation,
  rewriteAddressesInPlace,
  rewriteContentInPlace,
} from '@/lib/studio/rewrite-client-content';
import {
  KIOSK_ORIENTATIONS,
  KioskConfigSchema,
  type ConfigMeta,
  type KioskConfig,
  type KioskOrientation,
  makeBlankConfig,
} from '@/lib/studio/schema';

const DEFAULT_TEMPLATE_SLUG = 'default';

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
    const body = (await request.json()) as {
      slug?: string;
      nombre?: string;
      orientation?: string;
      website?: string;
      location?: string;
      /** Si true, arranca sin mock data (listings/events/passes/deals/trails/
       *  itineraryBuilder.localListings/socialWall.posts vacíos). Branding,
       *  modules, billboard, ai-avatar, etc. se conservan del template. */
      emptyMode?: boolean;
    };
    if (!body.slug || !body.nombre) {
      return NextResponse.json({ error: 'slug and nombre are required' }, { status: 400 });
    }
    const orientation: KioskOrientation = (KIOSK_ORIENTATIONS as readonly string[]).includes(
      body.orientation ?? '',
    )
      ? (body.orientation as KioskOrientation)
      : 'portrait';

    // Clonar desde el kiosk `default` (TrueOmni) para que el cliente nuevo
    // arranque con TODA la mock data poblada (listings, events, passes,
    // deals, trails, etc.).
    //
    // Estrategia híbrida: arranca con makeBlankConfig + hidrata desde
    // filesystem `clients/default/` con bootstrapStudioFromFs. Esto cubre
    // los dos casos:
    //   - KV `default` está vacío (operador no abrió el editor jamás).
    //   - KV `default` tiene state pero el filesystem es la fuente de
    //     verdad del template canónico.
    let config = makeBlankConfig(body.slug, body.nombre, orientation);
    const fsTemplate = await readClientFs(DEFAULT_TEMPLATE_SLUG);
    console.info('[configs POST] fs template', {
      slug: body.slug,
      hasFsConfig: Boolean(fsTemplate.config),
      fsModulesKeys: fsTemplate.config
        ? Object.keys(
            (fsTemplate.config as { features?: { home?: { modules?: Record<string, unknown> } } })
              .features?.home?.modules ?? {},
          )
        : [],
    });
    if (fsTemplate.config) {
      config = bootstrapStudioFromFs(config, fsTemplate.config, fsTemplate.tokensCss);
      // bootstrapStudioFromFs sobreescribe `nombre` si el sentinel match. Lo
      // reaplicamos para asegurar que se respeta el nombre del operador.
      config.slug = body.slug;
      config.nombre = body.nombre;
      config.orientation = orientation;
      config.currentVersion = 0;
      console.info('[configs POST] post-bootstrap', {
        listingsCount: config.listings?.length ?? 0,
        listingsCatalogSizes: config.listings?.map((l) => l.catalog.listings.length) ?? [],
        eventsCount: config.events?.events?.length ?? 0,
        passesCount: config.passes?.passes?.length ?? 0,
        trailsCount: config.trails?.trails?.length ?? 0,
      });
    }

    const trimmedLocation = body.location?.trim() ?? '';
    const trimmedWebsite = body.website?.trim() ?? '';
    let resolvedCoords: { lat: number; lng: number } | undefined;
    if (trimmedLocation) {
      // Geocoding via Nominatim. Si falla (timeout, sin match), seguimos
      // sin coords y el operador puede setearlos manualmente luego en el
      // editor del módulo Map.
      resolvedCoords = (await geocodeLocation(trimmedLocation)) ?? undefined;
    }
    if (trimmedWebsite || trimmedLocation || resolvedCoords) {
      config.clientInfo = {
        website: trimmedWebsite,
        location: trimmedLocation,
        ...(resolvedCoords ? { coords: resolvedCoords } : {}),
      };
    }

    // Empty mode: el operador eligió arrancar sin mock data. Brand + modules +
    // billboard + ai-avatar + photo-booth + map + brochures (estructura) se
    // conservan del template para que el editor no quede roto.
    if (body.emptyMode) {
      emptyDemoContentInPlace(config);
    }

    // Reemplazar la "City, ST" final de cada address mock (listings,
    // events, passes, trails, deals, brochures) con la location del
    // cliente nuevo. Garantiza que el operador NO vea "North Phoenix,
    // AZ" en un kiosk de "Davenport, FL".
    rewriteAddressesInPlace(config, trimmedLocation);

    // Reemplazar referencias hardcoded del template Arizona (cities +
    // state name + state abbrev) en title/description/headline de
    // listings/events/passes/trails/deals/brochures.
    rewriteContentInPlace(config, trimmedLocation);

    const parsed = KioskConfigSchema.safeParse(config);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid config', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const meta: ConfigMeta = {
      slug: body.slug,
      createdAt: now,
      lastEditedAt: now,
      currentVersion: 0,
    };

    // Lock atómico: `nx: true` hace que `set` falle si la key ya existe.
    // Reemplaza el patrón `exists() + set()` que era vulnerable a races
    // (dos POST concurrentes al mismo slug pasaban ambos exists() antes de
    // que el primero hiciera set).
    const created = await kv.set(kvKeys.cfg(body.slug), parsed.data, { nx: true });
    if (created !== 'OK') {
      return NextResponse.json({ error: `slug "${body.slug}" already exists` }, { status: 409 });
    }
    await kv.set(kvKeys.cfgMeta(body.slug), meta);
    await kv.sadd(kvKeys.clientsList, body.slug);

    // Sync inmediato al modelo unified: crear manifest + unified branding
    // sin esperar a la auto-migración del próximo GET /api/studio/clients.
    // Best-effort: errores se loguean pero no abortan la creación del kiosk.
    try {
      const { kioskToUnifiedBranding, saveUnifiedBrandingOnly } =
        await import('@/lib/studio/client-branding-sync');
      const { saveClientManifest, makeBlankManifest, loadClientManifest } =
        await import('@/lib/studio/client-manifest');
      const existingManifest = await loadClientManifest(body.slug);
      if (!existingManifest) {
        const unified = kioskToUnifiedBranding(parsed.data.branding, {
          nombre: parsed.data.nombre,
          website: parsed.data.clientInfo?.website,
          location: parsed.data.clientInfo?.location,
          coords: parsed.data.clientInfo?.coords,
        });
        await saveUnifiedBrandingOnly(body.slug, unified);
        await saveClientManifest(
          makeBlankManifest(body.slug, parsed.data.nombre, { kiosks: true }),
        );
      }
    } catch (syncErr) {
      console.warn('[api/studio/configs POST] unified sync failed', syncErr);
    }

    // Hallazgo S-37: invalidar la cache de auto-migrate para que el siguiente
    // GET /api/studio/clients vea el nuevo cliente sin esperar el TTL.
    try {
      const { invalidateAutoMigrateCache } = await import('@/lib/studio/auto-migrate-clients');
      invalidateAutoMigrateCache();
    } catch {
      /* noop */
    }

    return NextResponse.json({ slug: body.slug, config: parsed.data, meta }, { status: 201 });
  } catch (error) {
    console.error('[api/studio/configs POST]', error);
    return NextResponse.json({ error: 'Failed to create config' }, { status: 500 });
  }
}
