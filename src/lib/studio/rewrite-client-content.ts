import type { KioskConfig } from './schema';

/**
 * Reemplazos del template Arizona/Phoenix para clonar `clients/default/` a un
 * cliente nuevo sin que arrastre referencias geográficas hardcoded.
 *
 * Estas utilidades viven aquí (no en el route handler) porque las consume
 * tanto `/api/studio/configs` POST (legacy kiosk-only) como `/api/studio/
 * clients` POST (Fase 4, cliente unificado). Mantener un solo source of
 * truth evita drift entre los dos paths.
 */

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
export function rewriteAddress(address: string, location: string): string {
  if (!address || !location) return address;
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
export async function geocodeLocation(
  location: string,
): Promise<{ lat: number; lng: number } | null> {
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

export function rewriteAddressesInPlace(config: KioskConfig, location: string): void {
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
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'Washington',
};

// Cities del template Arizona — se reemplazan en titles/descriptions/etc.
// con la ciudad del cliente nuevo. Lista cerrada para no reemplazar palabras
// que casualmente coincidan con un nombre de ciudad en otros contextos.
const ARIZONA_CITIES = [
  'North Phoenix',
  'Phoenix',
  'Mesa',
  'Glendale',
  'Chandler',
  'Scottsdale',
  'Tempe',
  'Gilbert',
  'Peoria',
  'Surprise',
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
export function rewriteContentInPlace(config: KioskConfig, location: string): void {
  if (!location) return;
  const m = location.match(/^([^,]+),\s*([A-Z]{2})\s*$/);
  if (!m) return;
  const newCity = m[1].trim();
  const newStateAbbrev = m[2];
  const newStateName = US_STATE_NAMES[newStateAbbrev] ?? newStateAbbrev;
  if (newStateAbbrev === 'AZ') return;

  const STRING_FIELDS = [
    'title',
    'description',
    'shortDescription',
    'longDescription',
    'headline',
    'subtitle',
    'label',
    'subcategory',
    'category',
    'name',
    'body',
    'cta',
    'tagline',
    'venue',
    'caption',
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

  if (config.itineraryBuilder) {
    config.itineraryBuilder.localListings.forEach(visit);
    config.itineraryBuilder.questions.forEach(visit);
  }

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

  const homeModules = (
    config as {
      features?: { home?: { modules?: Record<string, Record<string, unknown>> } };
    }
  ).features?.home?.modules;
  if (homeModules) {
    for (const moduleConfig of Object.values(homeModules)) {
      if (!moduleConfig) continue;
      visit(moduleConfig);
      const welcomeCopy = (moduleConfig as { welcomeCopy?: Record<string, unknown> }).welcomeCopy;
      if (welcomeCopy && typeof welcomeCopy === 'object') visit(welcomeCopy);
    }
  }
}

/**
 * Vacía las colecciones de mock data del template (listings/events/passes/
 * deals/trails/itineraryBuilder.localListings/socialWall.posts) para el
 * modo "Start empty" del NewClientModal. Branding, modules, billboard,
 * ai-avatar, photo-booth, map y brochures (estructura) se preservan.
 */
export function emptyDemoContentInPlace(config: KioskConfig): void {
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
