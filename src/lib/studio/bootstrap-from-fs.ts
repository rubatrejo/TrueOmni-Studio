import { promises as fs } from 'node:fs';
import path from 'node:path';

import 'server-only';

import { hslToHex } from './hex-to-hsl';
import {
  AdsModuleSchema,
  AiAvatarSchema,
  BrochuresModuleSchema,
  DealsModuleSchema,
  DEFAULT_AI_AVATAR,
  DEFAULT_BILLBOARD,
  DEFAULT_BILLBOARD_B0,
  DEFAULT_BRANDING,
  DEFAULT_BROCHURES,
  DEFAULT_DEALS,
  DEFAULT_GUESTBOOK,
  DEFAULT_ITINERARY_BUILDER,
  DEFAULT_PHOTO_BOOTH,
  DEFAULT_SOCIAL_WALL,
  DEFAULT_SURVEY,
  EventsModuleSchema,
  GuestbookSchema,
  IntegrationsConfigSchema,
  ItineraryBuilderSchema,
  ListingsCatalogSchema,
  PassesModuleSchema,
  PhotoBoothSchema,
  SocialWallSchema,
  SurveySchema,
  TicketsModuleSchema,
  TrailsModuleSchema,
  defaultEvents,
  defaultIntegrations,
  defaultListings,
  defaultPasses,
  defaultTickets,
  defaultTrails,
  type ItineraryBuilderConfig,
  type KioskConfig,
  type ListingsCatalogEntry,
  type ListingsModule,
} from './schema';

/**
 * Bootstrap inverso filesystem → Studio.
 *
 * Cuando el Studio carga un cliente con cfg incompleto en KV (típicamente
 * creado desde `makeBlankConfig`), este módulo lee `clients/<slug>/` y
 * hidrata los campos del Studio que SIGUEN siendo defaults factory con
 * los datos reales del filesystem. Campos ya editados por el operador no
 * se tocan — la heurística es estructural (`JSON.stringify` equality
 * contra el factory default).
 *
 * Esto cierra el desfase visual que tenía el Studio para `default`:
 * el operador veía 0 events / 0 ads / "TrueOmni Default" como nombre,
 * cuando el filesystem ya tenía 69 events, 4 ads y "Arizona".
 */

const TEMPLATE_NAME_SENTINEL = 'TrueOmni Default';

interface FsConfig {
  client?: {
    slug?: string;
    nombre?: string;
    locale?: string;
    timezone?: string;
    coords?: { lat: number; lng: number };
  };
  branding?: {
    logo?: { default?: string; dark?: string; alt?: string } | string;
    favicon?: string;
    idleLogo?: string;
    footerLogo?: string;
    fonts?: { display?: string; body?: string };
  };
  features?: {
    advertisements?: { ads?: unknown[] };
    billboard_variant?: number;
    billboard_logo_size?: string;
    billboard_footer_logo_size?: string;
    billboard_modules?: string[];
    billboard_b1_background?: { type?: string; src?: string };
    billboard_b2_background?: { type?: string; src?: string };
    billboard_b3_background?: { type?: string; src?: string };
    inactividad_reset_seg?: number;
    languages?: { enabled?: boolean; available?: string[]; default?: string };
    home?: {
      tiles?: Array<{ key?: string; label?: string; enabled?: boolean; image?: string }>;
      wayfinding?: { enabled?: boolean; label?: string; image?: string };
      askAi?: Record<string, unknown>;
      photoBooth?: Record<string, unknown>;
      survey?: Record<string, unknown>;
      itinerary?: Record<string, unknown>;
      modules?: Record<string, Record<string, unknown>>;
    };
  };
  integraciones?: {
    api_base_url?: string;
    mapbox_token?: string;
    analytics_id?: string;
    satisfi_api_key?: string;
    satisfi_hub_id?: string;
    tavus_api_key?: string;
    tavus_replica_id?: string;
    tavus_persona_id?: string;
    bandwango_api_key?: string;
    bandwango_partner_id?: string;
    crowdriff_api_key?: string;
    crowdriff_gallery_id?: string;
    viator_api_key?: string;
    viator_partner_id?: string;
  };
}

export async function readClientFs(
  slug: string,
): Promise<{ config: FsConfig | null; tokensCss: string | null }> {
  const dir = path.join(process.cwd(), 'clients', slug);
  const [config, tokensCss] = await Promise.all([
    readJson(path.join(dir, 'config.json')),
    readText(path.join(dir, 'tokens.css')),
  ]);
  return { config, tokensCss };
}

/**
 * Hash estable del config.json + tokens.css del template para detectar drift
 * entre el FS y los kiosks en KV. Hallazgo #27 del audit.
 *
 * Uso típico: el endpoint `/api/studio/diag/template-status` devuelve este
 * hash + el hash que cada kiosk tenía la última vez que se boostrappeó. Si
 * difieren → "FS template updated — resync available".
 *
 * Implementación: SHA-256 hex del concat de config + tokens. Se trunca a 16
 * chars para que ocupe poco en el header del Diagnostics card.
 */
export async function computeFsTemplateHash(slug: string): Promise<string | null> {
  const { config, tokensCss } = await readClientFs(slug);
  if (!config) return null;
  const payload = JSON.stringify(config) + (tokensCss ?? '');
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

async function readJson(p: string): Promise<FsConfig | null> {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8')) as FsConfig;
  } catch {
    return null;
  }
}

async function readText(p: string): Promise<string | null> {
  try {
    return await fs.readFile(p, 'utf8');
  } catch {
    return null;
  }
}

function structuralEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  bootstrap principal                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export function bootstrapStudioFromFs(
  studio: KioskConfig,
  fsConfig: FsConfig | null,
  tokensCss: string | null,
): KioskConfig {
  if (!fsConfig) return studio;
  let next: KioskConfig = { ...studio };

  // ── nombre ──
  if (next.nombre === TEMPLATE_NAME_SENTINEL && fsConfig.client?.nombre) {
    next.nombre = fsConfig.client.nombre;
  }

  // ── branding ──
  next = { ...next, branding: bootstrapBranding(next.branding, fsConfig.branding, tokensCss) };

  // ── billboard ──
  if (next.billboard && structuralEqual(next.billboard, DEFAULT_BILLBOARD)) {
    const variant = fsConfig.features?.billboard_variant;
    const idleSec = fsConfig.features?.inactividad_reset_seg;
    const logoSizeRaw = fsConfig.features?.billboard_logo_size;
    const footerSizeRaw = fsConfig.features?.billboard_footer_logo_size;
    const modulesRaw = fsConfig.features?.billboard_modules;
    if (variant === 0 || variant === 1 || variant === 2 || variant === 3) {
      const logoSize: 'S' | 'M' | 'L' | 'XL' =
        logoSizeRaw === 'S' || logoSizeRaw === 'M' || logoSizeRaw === 'L' || logoSizeRaw === 'XL'
          ? logoSizeRaw
          : DEFAULT_BILLBOARD.logoSize;
      const footerLogoSize: 'S' | 'M' | 'L' | 'XL' =
        footerSizeRaw === 'S' ||
        footerSizeRaw === 'M' ||
        footerSizeRaw === 'L' ||
        footerSizeRaw === 'XL'
          ? footerSizeRaw
          : DEFAULT_BILLBOARD.footerLogoSize;
      const modules = Array.isArray(modulesRaw)
        ? modulesRaw.filter((m): m is string => typeof m === 'string').slice(0, 4)
        : DEFAULT_BILLBOARD.modules;
      const parseBg = (raw: { type?: string; src?: string } | undefined) => {
        if (!raw || typeof raw.src !== 'string' || raw.src.length === 0) return undefined;
        const type: 'image' | 'video' = raw.type === 'video' ? 'video' : 'image';
        return {
          ...DEFAULT_BILLBOARD_B0,
          background: { type, src: raw.src },
        };
      };
      // Background shared para los 4 variants. Si el FS trae uno explícito
      // por `billboard_background`, usarlo; si no, hoist del `b1.background`
      // legacy para preservar la imagen previa; último recurso, default.
      const sharedBgRaw =
        (
          fsConfig.features as
            | { billboard_background?: { type?: string; src?: string } }
            | undefined
        )?.billboard_background ?? fsConfig.features?.billboard_b1_background;
      const sharedBg =
        sharedBgRaw && typeof sharedBgRaw.src === 'string' && sharedBgRaw.src.length > 0
          ? {
              type: (sharedBgRaw.type === 'video' ? 'video' : 'image') as 'image' | 'video',
              src: sharedBgRaw.src,
            }
          : { ...DEFAULT_BILLBOARD.background };
      next.billboard = {
        variant,
        idleTimeoutSec:
          typeof idleSec === 'number' && idleSec >= 15 && idleSec <= 600
            ? idleSec
            : DEFAULT_BILLBOARD.idleTimeoutSec,
        logoSize,
        footerLogoSize,
        modules,
        background: sharedBg,
        b1: parseBg(fsConfig.features?.billboard_b1_background),
        b2: parseBg(fsConfig.features?.billboard_b2_background),
        b3: parseBg(fsConfig.features?.billboard_b3_background),
      };
    }
  }

  // ── ads ──
  if (!next.ads || next.ads.ads.length === 0) {
    const fsAds = fsConfig.features?.advertisements?.ads;
    if (Array.isArray(fsAds) && fsAds.length > 0) {
      const parsed = AdsModuleSchema.safeParse({ ads: fsAds });
      if (parsed.success) next.ads = parsed.data;
    }
  }

  // ── integrations ──
  if (!next.integrations || structuralEqual(next.integrations, defaultIntegrations())) {
    const legacy = fsConfig.integraciones;
    if (legacy) {
      const str = (v: unknown) => (typeof v === 'string' ? v : '');
      const candidate = {
        api: { baseUrl: str(legacy.api_base_url) },
        mapbox: { token: str(legacy.mapbox_token) },
        analytics: { gaId: str(legacy.analytics_id) },
        weather: {
          provider: 'open-meteo' as const,
          apiKey: '',
          city: '',
          units: 'metric' as const,
        },
        satisfi: {
          apiKey: str(legacy.satisfi_api_key),
          hubId: str(legacy.satisfi_hub_id),
        },
        tavus: {
          apiKey: str(legacy.tavus_api_key),
          replicaId: str(legacy.tavus_replica_id),
          personaId: str(legacy.tavus_persona_id),
        },
        bandwango: {
          apiKey: str(legacy.bandwango_api_key),
          partnerId: str(legacy.bandwango_partner_id),
        },
        crowdriff: {
          apiKey: str(legacy.crowdriff_api_key),
          galleryId: str(legacy.crowdriff_gallery_id),
        },
        viator: {
          apiKey: str(legacy.viator_api_key),
          partnerId: str(legacy.viator_partner_id),
        },
      };
      const parsed = IntegrationsConfigSchema.safeParse(candidate);
      if (parsed.success) next.integrations = parsed.data;
    }
  }

  // ── modules (tiles enabled + labels + image) ──
  // El Studio.modules.tiles ya tiene shape correcto; hidratamos desde fs:
  //  - `image`: SIEMPRE (la imagen de fondo del tile vive en el fs config; el
  //    editor del Home Dashboard la necesita para mostrarla/editarla).
  //  - `enabled`: solo si el operador no lo tocó (heurística: todos en true =
  //    default factory).
  if (next.modules) {
    const fsTiles = fsConfig.features?.home?.tiles;
    if (Array.isArray(fsTiles)) {
      const fsImageByKey = new Map<string, string>();
      const fsEnabledByKey = new Map<string, boolean>();
      for (const t of fsTiles) {
        if (typeof t?.key !== 'string') continue;
        if (typeof t?.image === 'string') fsImageByKey.set(t.key, t.image);
        if (typeof t?.enabled === 'boolean') fsEnabledByKey.set(t.key, t.enabled);
      }
      const wayfindingTile = fsConfig.features?.home?.wayfinding;
      if (wayfindingTile) {
        if (typeof wayfindingTile.image === 'string') {
          fsImageByKey.set('wayfinding', wayfindingTile.image);
        }
        if (typeof wayfindingTile.enabled === 'boolean') {
          fsEnabledByKey.set('wayfinding', wayfindingTile.enabled);
        }
      }
      const hydrateEnabled = allTilesEnabled(next.modules.tiles);
      next.modules = {
        ...next.modules,
        tiles: next.modules.tiles.map((t) => ({
          ...t,
          image: t.image ?? fsImageByKey.get(t.key),
          enabled: hydrateEnabled ? (fsEnabledByKey.get(t.key) ?? t.enabled) : t.enabled,
        })),
      };
    }
  }

  // ── modules con kind ──
  const fsModules = fsConfig.features?.home?.modules ?? {};

  next.events = takeFsIfDefault(next.events, defaultEvents(), () =>
    parseStripKind(EventsModuleSchema, fsModules.events),
  );
  next.deals = takeFsIfDefault(next.deals, DEFAULT_DEALS, () =>
    parseStripKind(DealsModuleSchema, fsModules.deals),
  );
  next.passes = takeFsIfDefault(next.passes, defaultPasses(), () =>
    parseStripKind(PassesModuleSchema, fsModules.passes),
  );
  next.tickets = takeFsIfDefault(next.tickets, defaultTickets(), () =>
    parseStripKind(TicketsModuleSchema, fsModules.tickets),
  );
  next.trails = takeFsIfDefault(next.trails, defaultTrails(), () =>
    parseStripKind(TrailsModuleSchema, fsModules.trails),
  );
  next.socialWall = takeFsIfDefault(next.socialWall, DEFAULT_SOCIAL_WALL, () =>
    parseStripKind(SocialWallSchema, fsModules['social-wall']),
  );
  next.brochures = takeFsIfDefault(next.brochures, DEFAULT_BROCHURES, () =>
    parseStripKind(BrochuresModuleSchema, fsModules['digital-brochure']),
  );
  next.guestbook = takeFsIfDefault(next.guestbook, DEFAULT_GUESTBOOK, () =>
    parseStripKind(GuestbookSchema, fsModules.guestbook),
  );

  // ── itineraryBuilder (snake_case ↔ camelCase) ──
  // Nota: el bloque vive en `features.home.itinerary` (top-level), NO bajo
  // `features.home.modules.itinerary`. Los demás módulos sí están bajo
  // modules, pero itinerary es legacy y nunca se migró.
  next.itineraryBuilder = takeFsIfDefault(next.itineraryBuilder, DEFAULT_ITINERARY_BUILDER, () =>
    parseItineraryFromFs(fsConfig.features?.home?.itinerary),
  );

  // ── photoBooth, survey, aiAvatar ──
  const home = fsConfig.features?.home ?? {};
  next.photoBooth = takeFsIfDefault(next.photoBooth, DEFAULT_PHOTO_BOOTH, () =>
    parseSchema(PhotoBoothSchema, home.photoBooth),
  );
  next.survey = takeFsIfDefault(next.survey, DEFAULT_SURVEY, () =>
    parseSchema(SurveySchema, home.survey),
  );
  next.aiAvatar = takeFsIfDefault(next.aiAvatar, DEFAULT_AI_AVATAR, () => {
    if (!home.askAi) return null;
    const candidate = {
      avatar: typeof home.askAi.avatar === 'string' ? home.askAi.avatar : undefined,
      heroVideo: typeof home.askAi.heroVideo === 'string' ? home.askAi.heroVideo : undefined,
      greeting:
        typeof home.askAi.greeting === 'string' ? home.askAi.greeting : DEFAULT_AI_AVATAR.greeting,
      model: DEFAULT_AI_AVATAR.model,
      suggestedQuestions: Array.isArray(home.askAi.suggestedQuestions)
        ? home.askAi.suggestedQuestions
        : [],
    };
    return parseSchema(AiAvatarSchema, candidate);
  });

  // ── listings ──
  next.listings = bootstrapListings(next.listings, fsConfig);

  return next;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function allTilesEnabled(tiles: NonNullable<KioskConfig['modules']>['tiles']): boolean {
  return tiles.every((t) => t.enabled === true);
}

function takeFsIfDefault<T>(
  studioValue: T | undefined,
  factoryDefault: T,
  fromFs: () => T | null,
): T | undefined {
  if (studioValue === undefined) {
    const fs = fromFs();
    return fs ?? undefined;
  }
  if (!structuralEqual(studioValue, factoryDefault)) return studioValue;
  const fs = fromFs();
  return fs ?? studioValue;
}

interface ZodLike<T> {
  safeParse: (input: unknown) => { success: true; data: T } | { success: false };
}

function parseSchema<T>(schema: ZodLike<T>, candidate: unknown): T | null {
  if (!candidate) return null;
  const parsed = schema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/** Filesystem modules.{key} traen un `kind` extra que el Studio shape NO acepta. */
function parseStripKind<T>(
  schema: ZodLike<T>,
  candidate: Record<string, unknown> | undefined,
): T | null {
  if (!candidate || typeof candidate !== 'object') return null;
  const { kind: _kind, ...rest } = candidate as { kind?: unknown } & Record<string, unknown>;
  return parseSchema(schema, rest);
}

function bootstrapBranding(
  studioBranding: KioskConfig['branding'],
  fsBranding: FsConfig['branding'],
  tokensCss: string | null,
): KioskConfig['branding'] {
  let next = { ...studioBranding };

  // Colors desde tokens.css.
  if (tokensCss && allBrandColorsAreDefault(next)) {
    const fromCss = extractBrandHexFromTokensCss(tokensCss);
    if (fromCss) {
      next = { ...next, ...fromCss };
    }
  }

  // Logo / favicon / idleLogo / footerLogo desde fs.branding.
  if (fsBranding) {
    const fsLogo = pickLogoString(fsBranding.logo);
    if (!next.logo && fsLogo) next.logo = fsLogo;

    if (!next.favicon && typeof fsBranding.favicon === 'string') {
      next.favicon = fsBranding.favicon;
    }
    if (!next.idleLogo && typeof fsBranding.idleLogo === 'string') {
      next.idleLogo = fsBranding.idleLogo;
    }
    if (!next.footerLogo && typeof fsBranding.footerLogo === 'string') {
      next.footerLogo = fsBranding.footerLogo;
    }
  }

  return next;
}

function pickLogoString(
  logo: NonNullable<FsConfig['branding']>['logo'] | undefined,
): string | null {
  if (!logo) return null;
  if (typeof logo === 'string') return logo;
  if (typeof logo === 'object' && 'default' in logo && typeof logo.default === 'string') {
    return logo.default;
  }
  return null;
}

function allBrandColorsAreDefault(branding: KioskConfig['branding']): boolean {
  return (
    branding.primary === DEFAULT_BRANDING.primary &&
    branding.secondary === DEFAULT_BRANDING.secondary &&
    branding.tertiary === DEFAULT_BRANDING.tertiary
  );
}

function extractBrandHexFromTokensCss(
  css: string,
): Pick<KioskConfig['branding'], 'primary' | 'secondary' | 'tertiary'> | null {
  const primary = extractHsl(css, '--brand-primary');
  const secondary = extractHsl(css, '--brand-secondary');
  const tertiary = extractHsl(css, '--brand-tertiary');
  if (!primary || !secondary || !tertiary) return null;
  return {
    primary: hslToHex(primary),
    secondary: hslToHex(secondary),
    tertiary: hslToHex(tertiary),
  };
}

function extractHsl(css: string, name: string): string | null {
  const re = new RegExp(`${name.replace(/[-]/g, '\\-')}\\s*:\\s*([^;]+);`);
  const m = re.exec(css);
  return m ? m[1].trim() : null;
}

function bootstrapListings(
  studioListings: ListingsModule | undefined,
  fsConfig: FsConfig,
): ListingsModule | undefined {
  if (studioListings && !structuralEqual(studioListings, defaultListings())) {
    return studioListings;
  }
  const fsModules = fsConfig.features?.home?.modules ?? {};
  const fsTiles = fsConfig.features?.home?.tiles ?? [];
  const tileLabelByKey = new Map<string, string>();
  for (const t of fsTiles) {
    if (typeof t?.key === 'string' && typeof t?.label === 'string') {
      tileLabelByKey.set(t.key, t.label);
    }
  }

  // Considerar una entrada como "listings catalog" cualquier entry de
  // features.home.modules sin `kind` o con kind ausente que tenga shape
  // de catalog (heroImage / listings / subcategories / features).
  const KINDED_KEYS = new Set([
    'events',
    'deals',
    'passes',
    'tickets',
    'trails',
    'social-wall',
    'digital-brochure',
    'guestbook',
    'map',
  ]);

  const entries: ListingsCatalogEntry[] = [];
  for (const [key, value] of Object.entries(fsModules)) {
    if (!value || typeof value !== 'object') continue;
    if (KINDED_KEYS.has(key)) continue;
    if (typeof (value as { kind?: unknown }).kind === 'string') continue;

    // Fotos por sub-categoría (name → URL): mapa opcional paralelo a
    // `subcategories`. Se preserva al hidratar desde el fs igual que el resto
    // del catálogo; si no es un objeto plano string→string, se omite.
    const rawSubImages = (value as { subcategoryImages?: unknown }).subcategoryImages;
    const subcategoryImages =
      rawSubImages && typeof rawSubImages === 'object' && !Array.isArray(rawSubImages)
        ? Object.fromEntries(
            Object.entries(rawSubImages as Record<string, unknown>).filter(
              ([, v]) => typeof v === 'string',
            ),
          )
        : undefined;

    const candidateCatalog = {
      heroImage: typeof value.heroImage === 'string' ? value.heroImage : '',
      subcategories: Array.isArray(value.subcategories) ? value.subcategories : [],
      ...(subcategoryImages && Object.keys(subcategoryImages).length > 0
        ? { subcategoryImages }
        : {}),
      features: Array.isArray(value.features) ? value.features : [],
      skipSubcategories: value.skipSubcategories === true,
      listings: Array.isArray(value.listings) ? value.listings : [],
    };
    const parsed = ListingsCatalogSchema.safeParse(candidateCatalog);
    if (!parsed.success) continue;

    entries.push({
      key,
      label: typeof value.label === 'string' ? value.label : (tileLabelByKey.get(key) ?? key),
      iconKey: defaultIconForKey(key),
      enabled: true,
      catalog: parsed.data,
    });
  }

  if (entries.length === 0) return studioListings;
  return entries;
}

function defaultIconForKey(key: string): string {
  switch (key) {
    case 'restaurants':
      return 'UtensilsCrossed';
    case 'things-to-do':
      return 'Sparkles';
    case 'stay':
      return 'BedDouble';
    default:
      return 'MapPin';
  }
}

/**
 * Mapea el bloque legacy `features.home.modules.itinerary` (snake_case)
 * a `ItineraryBuilderConfig` (camelCase). Genera ids estables para
 * questions cuando el fs no los tiene.
 */
function parseItineraryFromFs(
  raw: Record<string, unknown> | undefined,
): ItineraryBuilderConfig | null {
  if (!raw || typeof raw !== 'object') return null;

  // aiEnabled mapea a `ai.enabled` (NO al `enabled` legacy del módulo, que
  // es un toggle separado controlado por systemModules.itineraryBuilder).
  // Si ai.enabled no está set en el fs, default true (visible).
  const ai = (raw.ai && typeof raw.ai === 'object' ? raw.ai : {}) as Record<string, unknown>;
  const aiEnabled = typeof ai.enabled === 'boolean' ? ai.enabled : true;
  const loadingImage = typeof ai.loading_image === 'string' ? ai.loading_image : '';
  const defaultTitleTemplate =
    typeof ai.default_title_template === 'string' ? ai.default_title_template : '';

  const rawQuestions = Array.isArray(ai.questions) ? ai.questions : [];
  // wizardHeroImage compartido: tomamos el hero_image de la primera question
  // que tenga uno (legacy data tiene todas las questions con la misma URL).
  let wizardHeroImage = '';
  for (const q of rawQuestions) {
    if (q && typeof q === 'object') {
      const h = (q as Record<string, unknown>).hero_image;
      if (typeof h === 'string' && h.length > 0) {
        wizardHeroImage = h;
        break;
      }
    }
  }
  const questions = rawQuestions.map((q, idx) => {
    if (!q || typeof q !== 'object') return null;
    const o = q as Record<string, unknown>;
    const key = typeof o.key === 'string' ? o.key : `q-${idx}`;
    const id = typeof o.id === 'string' && o.id.length > 0 ? o.id : `q-${key}-${idx}`;
    const type = o.type === 'multi' ? 'multi' : 'single';
    const optionsRaw = Array.isArray(o.options) ? o.options : [];
    const options = optionsRaw
      .map((opt) => {
        if (!opt || typeof opt !== 'object') return null;
        const op = opt as Record<string, unknown>;
        const value = typeof op.value === 'string' ? op.value : '';
        const label = typeof op.label === 'string' ? op.label : value;
        if (!value || !label) return null;
        const days = typeof op.days === 'number' ? op.days : undefined;
        const categoryKey =
          typeof op.category_key === 'string'
            ? op.category_key
            : typeof op.categoryKey === 'string'
              ? op.categoryKey
              : undefined;
        const subcategoryKey =
          typeof op.subcategory_key === 'string'
            ? op.subcategory_key
            : typeof op.subcategoryKey === 'string'
              ? op.subcategoryKey
              : undefined;
        return {
          value,
          label,
          ...(days !== undefined ? { days } : {}),
          ...(categoryKey ? { categoryKey } : {}),
          ...(subcategoryKey ? { subcategoryKey } : {}),
        };
      })
      .filter(
        (
          x,
        ): x is {
          value: string;
          label: string;
          days?: number;
          categoryKey?: string;
          subcategoryKey?: string;
        } => x !== null,
      );
    if (options.length === 0) return null;
    const candidate = {
      id,
      key,
      kicker: typeof o.kicker === 'string' ? o.kicker : '',
      title: typeof o.title === 'string' ? o.title : '',
      subtitle: typeof o.subtitle === 'string' ? o.subtitle : undefined,
      type,
      options,
    };
    return candidate;
  });

  const rawListings = Array.isArray(raw.local_listings) ? raw.local_listings : [];
  const localListings = rawListings
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const o = item as Record<string, unknown>;
      const slug = typeof o.slug === 'string' ? o.slug : '';
      const title = typeof o.title === 'string' ? o.title : '';
      if (!slug || !title) return null;
      const stopsRaw = Array.isArray(o.stops) ? o.stops : [];
      const stops = stopsRaw
        .map((s) => {
          if (!s || typeof s !== 'object') return null;
          const sp = s as Record<string, unknown>;
          const sslug = typeof sp.slug === 'string' ? sp.slug : '';
          const skind = typeof sp.kind === 'string' ? sp.kind : '';
          const sModule = typeof sp.moduleSlug === 'string' ? sp.moduleSlug : '';
          if (!sslug || !skind || !sModule) return null;
          return { slug: sslug, kind: skind, moduleSlug: sModule };
        })
        .filter((x): x is { slug: string; kind: string; moduleSlug: string } => x !== null);
      return {
        slug,
        title,
        description: typeof o.description === 'string' ? o.description : '',
        image: typeof o.image === 'string' ? o.image : '',
        stops,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const candidate = {
    aiEnabled,
    loadingImage,
    defaultTitleTemplate,
    wizardHeroImage,
    questions: questions.filter((q): q is NonNullable<typeof q> => q !== null),
    localListings,
  };

  return parseSchema(ItineraryBuilderSchema, candidate);
}
