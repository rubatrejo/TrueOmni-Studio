import { NextResponse } from 'next/server';

import { bootstrapStudioFromFs, readClientFs } from '@/lib/studio/bootstrap-from-fs';
import { kv, kvKeys } from '@/lib/studio/kv';
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
 * Reemplaza el sufijo "City, State" de una address con la nueva location
 * del cliente. La heurística busca el último ", XX" (estado de 2 letras)
 * y reescribe la palabra anterior + el estado. Si la address no matchea,
 * se queda tal cual (mejor que un guess equivocado).
 *
 * Ejemplos con location="Davenport, FL":
 *   "2073 Main St, North Phoenix, AZ 85051"  →  "2073 Main St, Davenport, FL 85051"
 *   "80 N Arizona Pl, Chandler, AZ"          →  "80 N Arizona Pl, Davenport, FL"
 *   "address sin estado"                     →  "address sin estado" (no toca)
 */
function rewriteAddress(address: string, location: string): string {
  if (!address || !location) return address;
  // Match: ", <City>, <ST>" optional zip. Captura zip (si existe) y resto.
  const re = /,\s*[^,]+,\s*[A-Z]{2}(\s+\d{5}(?:-\d{4})?)?\s*$/;
  const m = address.match(re);
  if (!m) return address;
  const zip = m[1] ?? '';
  return `${address.slice(0, m.index)}, ${location}${zip}`;
}

/**
 * Geocode una location del operador ("Davenport, FL") usando Nominatim
 * (OpenStreetMap) — endpoint gratuito sin API key. Devuelve coords si
 * resuelve, null si falla. Timeout 4s para no bloquear el create del
 * kiosk si la API está caída.
 */
async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  if (!location) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', location);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TrueOmniStudio/1.0 (designers@trueomni.com)' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    if (!data.length) return null;
    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

function rewriteAddressesInPlace(config: KioskConfig, location: string): void {
  if (!location) return;
  const visit = (item: unknown) => {
    if (item && typeof item === 'object' && 'address' in item) {
      const obj = item as { address?: string };
      if (typeof obj.address === 'string' && obj.address.length > 0) {
        obj.address = rewriteAddress(obj.address, location);
      }
    }
  };
  config.listings?.forEach((cat) => cat.catalog?.listings?.forEach(visit));
  config.events?.events?.forEach(visit);
  config.passes?.passes?.forEach(visit);
  config.trails?.trails?.forEach(visit);
}

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

    // Reemplazar la "City, ST" final de cada address mock (listings,
    // events, passes, trails, deals, brochures) con la location del
    // cliente nuevo. Garantiza que el operador NO vea "North Phoenix,
    // AZ" en un kiosk de "Davenport, FL".
    rewriteAddressesInPlace(config, trimmedLocation);

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
