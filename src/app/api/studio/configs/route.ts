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

// US state ST → full name lookup. Usado para reemplazar referencias al
// state hardcoded del template ("Arizona") por el state del cliente nuevo.
const US_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'Washington',
};

// Cities del template Arizona — se reemplazan en titles/descriptions/etc.
// con la ciudad del cliente nuevo. Lista cerrada para no reemplazar palabras
// que casualmente coincidan con un nombre de ciudad en otros contextos.
const ARIZONA_CITIES = [
  'North Phoenix', 'Phoenix', 'Mesa', 'Glendale', 'Chandler', 'Scottsdale',
  'Tempe', 'Gilbert', 'Peoria', 'Surprise',
];

/**
 * Reemplaza referencias hardcoded del template Arizona ("Arizona", "Phoenix",
 * "Mesa", etc.) en title/description/headline/longDescription/etc. con la
 * city/state del cliente nuevo. Solo se ejecuta cuando el operador especifica
 * una location distinta de Arizona.
 *
 * Limitaciones conocidas:
 * - Si el cliente es de Arizona, no se reemplaza nada (idempotente).
 * - Mock data específico ("Arizona Science Center", "Arizona Boardwalk") se
 *   reemplaza también — el operador edita esos titles después.
 */
function rewriteContentInPlace(
  config: KioskConfig,
  location: string,
): void {
  if (!location) return;
  const m = location.match(/^([^,]+),\s*([A-Z]{2})\s*$/);
  if (!m) return;
  const newCity = m[1].trim();
  const newStateAbbrev = m[2];
  const newStateName = US_STATE_NAMES[newStateAbbrev] ?? newStateAbbrev;
  // Evitamos no-ops (template ya es Arizona).
  if (newStateAbbrev === 'AZ') return;

  const STRING_FIELDS = [
    'title', 'description', 'shortDescription', 'longDescription', 'headline',
    'subtitle', 'label', 'subcategory', 'category', 'name', 'body', 'cta',
    'tagline',
    // Eventos: venue ("Phoenix Convention Center" → "Davenport Convention
    // Center"). Se visita como cualquier listing del template.
    'venue',
    // Social Wall: caption del post ("Best pizza in downtown Phoenix..."). Se
    // visita en el loop dedicado de socialWall.posts.
    'caption',
    // Listings: directions[].instruction ("Arrive at Phoenix Convention
    // Center"). Se visita en el loop nested abajo.
    'instruction',
  ] as const;

  const replaceInString = (s: string): string => {
    let out = s;
    for (const city of ARIZONA_CITIES) {
      out = out.replaceAll(city, newCity);
    }
    out = out.replaceAll('Arizona', newStateName);
    out = out.replace(/\bAZ\b/g, newStateAbbrev);
    return out;
  };

  const visit = (item: unknown) => {
    if (!item || typeof item !== 'object') return;
    const obj = item as Record<string, unknown>;
    for (const field of STRING_FIELDS) {
      const v = obj[field];
      if (typeof v === 'string' && v.length > 0) {
        obj[field] = replaceInString(v);
      }
    }
  };

  /** Visita el item top-level y luego recurre en arrays nested conocidos
   *  (directions, stops) para alcanzar `instruction` y campos similares
   *  enterrados un nivel debajo de cada listing/event/etc. */
  const visitWithDirections = (item: unknown) => {
    visit(item);
    if (!item || typeof item !== 'object') return;
    const obj = item as Record<string, unknown>;
    if (Array.isArray(obj.directions)) obj.directions.forEach(visit);
  };

  config.listings?.forEach((cat) => {
    visit(cat);
    cat.catalog?.listings?.forEach(visitWithDirections);
  });
  config.events?.events?.forEach(visitWithDirections);
  config.passes?.passes?.forEach(visitWithDirections);
  config.trails?.trails?.forEach(visitWithDirections);
  config.deals?.deals?.forEach(visit);
  config.brochures?.brochures?.forEach(visit);

  // Itinerary local_listings (titles/descriptions) + AI questions (titles/
  // subtitles). Los `value` y `label` de las options son genéricos
  // ("A Day Trip", "Exploring") y no se rewritean. `{client_name}` queda
  // intacto — el runtime interpola con el nombre actual.
  if (config.itineraryBuilder) {
    config.itineraryBuilder.localListings.forEach(visit);
    config.itineraryBuilder.questions.forEach(visit);
  }

  // Social Wall hashtag + posts captions. La caption ("Best pizza in
  // downtown Phoenix...") sí debe rewritearse para que un kiosk de Davenport
  // no muestre testimonios de un visitante en Phoenix.
  if (config.socialWall) {
    const sw = config.socialWall as {
      hashtag?: string;
      posts?: Array<Record<string, unknown>>;
    };
    if (typeof sw.hashtag === 'string') {
      sw.hashtag = replaceInString(sw.hashtag).replace(/\s+/g, '');
    }
    if (Array.isArray(sw.posts)) sw.posts.forEach(visit);
  }

  // features.home.modules.<key>.welcomeCopy del Map y otros — el operador
  // a veces hardcodea "Welcome to Arizona Map" en el copy en lugar de usar
  // el template `{client}`. Aplicamos replaceInString a todos los strings
  // del welcomeCopy (title/subtitle/body/cta) para que el cliente nuevo no
  // herede el branding del state del template.
  const homeModules = (
    config as {
      features?: { home?: { modules?: Record<string, Record<string, unknown>> } };
    }
  ).features?.home?.modules;
  if (homeModules) {
    for (const moduleConfig of Object.values(homeModules)) {
      if (!moduleConfig) continue;
      visit(moduleConfig);
      const welcomeCopy = (moduleConfig as { welcomeCopy?: Record<string, unknown> })
        .welcomeCopy;
      if (welcomeCopy && typeof welcomeCopy === 'object') visit(welcomeCopy);
    }
  }
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

    // Empty mode: el operador eligió arrancar sin mock data. Limpiamos
    // listings/events/passes/deals/trails/itineraryBuilder.localListings/
    // socialWall.posts antes del rewrite (no hay nada Phoenix-specific que
    // reescribir si las colecciones están vacías). Brand + modules +
    // billboard + ai-avatar + photo-booth + map + brochures (estructura) se
    // conservan del template para que el editor no quede roto.
    if (body.emptyMode) {
      if (Array.isArray(config.listings)) {
        for (const cat of config.listings) {
          if (cat.catalog) cat.catalog.listings = [];
        }
      }
      if (config.events) config.events.events = [];
      if (config.passes) config.passes.passes = [];
      if (config.deals) config.deals.deals = [];
      if (config.trails) config.trails.trails = [];
      if (config.itineraryBuilder) config.itineraryBuilder.localListings = [];
      const sw = config.socialWall as { posts?: unknown[] } | undefined;
      if (sw && Array.isArray(sw.posts)) sw.posts = [];
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
      const { kioskToUnifiedBranding, saveUnifiedBrandingOnly } = await import(
        '@/lib/studio/client-branding-sync'
      );
      const { saveClientManifest, makeBlankManifest, loadClientManifest } = await import(
        '@/lib/studio/client-manifest'
      );
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

    return NextResponse.json({ slug: body.slug, config: parsed.data, meta }, { status: 201 });
  } catch (error) {
    console.error('[api/studio/configs POST]', error);
    return NextResponse.json({ error: 'Failed to create config' }, { status: 500 });
  }
}
