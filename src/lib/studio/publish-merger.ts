import { hexToHsl } from './hex-to-hsl';
import {
  DEFAULT_BROCHURES,
  DEFAULT_DEALS,
  DEFAULT_GUESTBOOK,
  DEFAULT_ITINERARY_BUILDER,
  DEFAULT_PHOTO_BOOTH,
  DEFAULT_SOCIAL_WALL,
  DEFAULT_SURVEY,
  defaultEvents,
  defaultListings,
  defaultPasses,
  defaultTickets,
  defaultTrails,
  type KioskConfig,
} from './schema';

/**
 * Mergers que reconcilian el shape Studio (KioskConfig) con el shape
 * legacy del filesystem (`clients/<slug>/config.json` + `tokens.css`).
 *
 * Estrategia: clonar el current filesystem y sobreescribir SOLO las
 * secciones del Studio que tienen contenido **distinto al factory
 * default**. Esto previene que un publish ciego borre data del
 * filesystem cuando el Studio tiene defaults vacíos (caso típico de
 * un cliente legacy cuyo Studio cfg fue creado con `makeBlankConfig`
 * antes de ampliar el bootstrap del GET).
 *
 * Para campos atómicos (string/number) se usan sentinels — `nombre`
 * coincidente con el template default `"TrueOmni Default"` se trata
 * como "no editado". Para módulos catalog (events, deals, …) se
 * compara estructuralmente contra el factory default; si Studio.X
 * coincide con `defaultX()`, NO se sobreescribe filesystem.X.
 *
 * Decisiones aprobadas (S7.1 wide):
 *  - P1: tokens.css se edita quirúrgicamente — solo `--brand-*`.
 *  - P2: `textos` legacy del config.json se preserva tal cual.
 *  - P3: `systemModules` se aplica a flags dispersos.
 *  - P4: `branding.idleLogo`/`footerLogo` van top-level en `branding`.
 *  - P5: custom fonts (data URLs) NO se publican.
 */

type FsConfig = Record<string, unknown>;

const TEMPLATE_NAME_SENTINEL = 'TrueOmni Default';

/** Compara dos valores estructuralmente (JSON-equality). */
function structuralEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  config.json                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

export function buildFilesystemConfig(
  studio: KioskConfig,
  currentFsConfig: FsConfig | null,
): FsConfig {
  const fsCfg: FsConfig = currentFsConfig ? structuredClone(currentFsConfig) : {};
  ensure(fsCfg, 'client', () => ({}));
  ensure(fsCfg, 'branding', () => ({}));
  ensure(fsCfg, 'features', () => ({}));

  const branding = obj(fsCfg, 'branding');
  ensure(branding, 'logo', () => ({}));

  const features = obj(fsCfg, 'features');
  ensure(features, 'home', () => ({}));
  const home = obj(features, 'home');
  ensure(home, 'modules', () => ({}));

  // ───── client ─────
  const client = obj(fsCfg, 'client');
  client.slug = studio.slug;
  // `nombre`: sólo sobreescribir si NO es el sentinel del template.
  if (studio.nombre && studio.nombre !== TEMPLATE_NAME_SENTINEL) {
    client.nombre = studio.nombre;
  }
  // website + location + coords del operador (introducidos al crear el
  // kiosk en NewClientModal — coords vienen del geocoding Nominatim).
  // Se reflejan al fs config para que el runtime los lea.
  if (studio.clientInfo?.website) client.website = studio.clientInfo.website;
  if (studio.clientInfo?.location) client.address = studio.clientInfo.location;
  if (studio.clientInfo?.coords) client.coords = { ...studio.clientInfo.coords };
  // locale, timezone se preservan tal cual.

  // ───── branding (sin colors — colors van a tokens.css) ─────
  applyBranding(branding, studio.branding);

  // ───── billboard ─────
  if (studio.billboard) {
    features.billboard_variant = studio.billboard.variant;
    features.inactividad_reset_seg = studio.billboard.idleTimeoutSec;
    features.billboard_logo_size = studio.billboard.logoSize;
    features.billboard_footer_logo_size = studio.billboard.footerLogoSize ?? 'M';
    features.billboard_modules = [...studio.billboard.modules];
    // Backgrounds editables per variant. Si están seteados, los publicamos
    // como `billboard_bN_background` para que el runtime fs los lea
    // (en este momento el runtime de variants 1/2/3 ya respeta el override
    // del bridge en vivo; al publicar persistimos para post-redeploy).
    const variantBgs: Array<{ key: string; v: { background?: { type: 'image' | 'video'; src: string } } | undefined }> = [
      { key: 'billboard_b1_background', v: studio.billboard.b1 },
      { key: 'billboard_b2_background', v: studio.billboard.b2 },
      { key: 'billboard_b3_background', v: studio.billboard.b3 },
    ];
    for (const { key, v } of variantBgs) {
      if (v?.background?.src) {
        features[key] = v.background;
      }
    }
  }

  // ───── modules / tiles / wayfinding / systemModules ─────
  if (studio.modules) {
    applyModulesAndTiles(features, home, studio.modules);
  }

  // ───── ads (preservar fs si Studio array está vacío) ─────
  if (studio.ads && studio.ads.ads.length > 0) {
    ensure(features, 'advertisements', () => ({ ads: [] }));
    obj(features, 'advertisements').ads = studio.ads.ads;
  }

  // ───── integrations (rename camel↔snake; preservar fs si Studio vacío) ─────
  if (studio.integrations) {
    ensure(fsCfg, 'integraciones', () => ({}));
    const intg = obj(fsCfg, 'integraciones');
    if (studio.integrations.api?.baseUrl) intg.api_base_url = studio.integrations.api.baseUrl;
    if (studio.integrations.mapbox?.token) intg.mapbox_token = studio.integrations.mapbox.token;
    if (studio.integrations.analytics?.gaId) intg.analytics_id = studio.integrations.analytics.gaId;
    if (studio.integrations.satisfi?.apiKey)
      intg.satisfi_api_key = studio.integrations.satisfi.apiKey;
    if (studio.integrations.satisfi?.hubId) intg.satisfi_hub_id = studio.integrations.satisfi.hubId;
    if (studio.integrations.tavus?.apiKey) intg.tavus_api_key = studio.integrations.tavus.apiKey;
    if (studio.integrations.tavus?.replicaId)
      intg.tavus_replica_id = studio.integrations.tavus.replicaId;
    if (studio.integrations.tavus?.personaId)
      intg.tavus_persona_id = studio.integrations.tavus.personaId;
    if (studio.integrations.bandwango?.apiKey)
      intg.bandwango_api_key = studio.integrations.bandwango.apiKey;
    if (studio.integrations.bandwango?.partnerId)
      intg.bandwango_partner_id = studio.integrations.bandwango.partnerId;
    if (studio.integrations.crowdriff?.apiKey)
      intg.crowdriff_api_key = studio.integrations.crowdriff.apiKey;
    if (studio.integrations.crowdriff?.galleryId)
      intg.crowdriff_gallery_id = studio.integrations.crowdriff.galleryId;
    if (studio.integrations.viator?.apiKey) intg.viator_api_key = studio.integrations.viator.apiKey;
    if (studio.integrations.viator?.partnerId)
      intg.viator_partner_id = studio.integrations.viator.partnerId;
    // weather no tiene equivalente legacy; se omite.
  }

  // ───── aiAvatar → features.home.askAi (override siempre — Studio gestiona) ─────
  if (studio.aiAvatar) {
    const askAi = obj(home, 'askAi');
    const avatar = skipDataUrl(studio.aiAvatar.avatar);
    const heroVideo = skipDataUrl(studio.aiAvatar.heroVideo);
    if (avatar !== undefined) askAi.avatar = avatar;
    if (heroVideo !== undefined) askAi.heroVideo = heroVideo;
    if (studio.aiAvatar.greeting) askAi.greeting = studio.aiAvatar.greeting;
    if (studio.aiAvatar.suggestedQuestions.length > 0) {
      askAi.suggestedQuestions = studio.aiAvatar.suggestedQuestions;
    }
    // enabled, position se preservan.
  }

  // ───── survey ─────
  if (studio.survey && !structuralEqual(studio.survey, DEFAULT_SURVEY)) {
    home.survey = studio.survey;
  }

  // ───── photoBooth ─────
  if (studio.photoBooth && !structuralEqual(studio.photoBooth, DEFAULT_PHOTO_BOOTH)) {
    home.photoBooth = studio.photoBooth;
  }

  // ───── modules con `kind` (preservar fs si Studio === default) ─────
  const modulesObj = obj(home, 'modules');
  if (studio.events && !structuralEqual(studio.events, defaultEvents())) {
    writeKinded(modulesObj, 'events', studio.events);
  }
  if (studio.deals && !structuralEqual(studio.deals, DEFAULT_DEALS)) {
    writeKinded(modulesObj, 'deals', studio.deals);
  }
  if (studio.passes && !structuralEqual(studio.passes, defaultPasses())) {
    writeKinded(modulesObj, 'passes', studio.passes);
  }
  if (studio.tickets && !structuralEqual(studio.tickets, defaultTickets())) {
    writeKinded(modulesObj, 'tickets', studio.tickets);
  }
  if (studio.trails && !structuralEqual(studio.trails, defaultTrails())) {
    writeKinded(modulesObj, 'trails', studio.trails);
  }
  if (studio.socialWall && !structuralEqual(studio.socialWall, DEFAULT_SOCIAL_WALL)) {
    writeKinded(modulesObj, 'social-wall', studio.socialWall);
  }
  if (studio.brochures && !structuralEqual(studio.brochures, DEFAULT_BROCHURES)) {
    writeKinded(modulesObj, 'digital-brochure', studio.brochures);
  }
  if (studio.guestbook && !structuralEqual(studio.guestbook, DEFAULT_GUESTBOOK)) {
    writeKinded(modulesObj, 'guestbook', studio.guestbook);
  }

  // ───── itineraryBuilder → home.itinerary (top-level, NO bajo modules) ─────
  // Mapeo camelCase ↔ snake_case + strip de `id` en questions (los ids viven
  // sólo en KV; al releer del fs, el bootstrap los regenera).
  if (
    studio.itineraryBuilder &&
    !structuralEqual(studio.itineraryBuilder, DEFAULT_ITINERARY_BUILDER)
  ) {
    const it = studio.itineraryBuilder;
    const existing = obj(home, 'itinerary');
    // Preserva flags legacy (welcome_always_visible/show_driving_default/
    // hide_markers_default/max_stops) si ya existen; si no, defaults sane.
    home.itinerary = {
      ...existing,
      // `enabled` legacy del módulo NO lo tocamos — es controlado por
      // systemModules.itineraryBuilder (master switch del módulo entero).
      // Studio.aiEnabled mapea a `ai.enabled` (sub-toggle del flujo AI).
      enabled: typeof existing.enabled === 'boolean' ? existing.enabled : true,
      welcome_always_visible:
        typeof existing.welcome_always_visible === 'boolean'
          ? existing.welcome_always_visible
          : true,
      show_driving_default:
        typeof existing.show_driving_default === 'boolean'
          ? existing.show_driving_default
          : true,
      hide_markers_default:
        typeof existing.hide_markers_default === 'boolean'
          ? existing.hide_markers_default
          : false,
      max_stops: typeof existing.max_stops === 'number' ? existing.max_stops : 12,
      local_listings: it.localListings,
      ai: {
        enabled: it.aiEnabled,
        loading_image: it.loadingImage,
        default_title_template: it.defaultTitleTemplate,
        // Cada question recibe el wizardHeroImage compartido (legacy shape
        // espera hero_image per question; el editor solo edita uno único).
        // Options: camelCase categoryKey/subcategoryKey → snake_case en fs.
        questions: it.questions.map(({ id: _id, ...q }) => ({
          ...q,
          hero_image: it.wizardHeroImage,
          options: q.options.map((opt) => ({
            value: opt.value,
            label: opt.label,
            ...(opt.days !== undefined ? { days: opt.days } : {}),
            ...(opt.categoryKey ? { category_key: opt.categoryKey } : {}),
            ...(opt.subcategoryKey ? { subcategory_key: opt.subcategoryKey } : {}),
          })),
        })),
      },
    };
  }

  // ───── listings (entries dinámicos sin `kind`) ─────
  if (studio.listings && !structuralEqual(studio.listings, defaultListings())) {
    for (const entry of studio.listings) {
      // Sólo escribir un entry si tiene contenido (heroImage, listings, subcategories, features).
      const c = entry.catalog;
      const hasContent =
        Boolean(c.heroImage) ||
        c.listings.length > 0 ||
        c.subcategories.length > 0 ||
        c.features.length > 0;
      if (!hasContent) continue;
      modulesObj[entry.key] = {
        label: entry.label,
        iconKey: entry.iconKey,
        heroImage: c.heroImage,
        subcategories: c.subcategories,
        features: c.features,
        listings: c.listings,
      };
    }
  }

  return fsCfg;
}

function applyBranding(branding: Record<string, unknown>, studioBranding: KioskConfig['branding']) {
  const logoObj = obj(branding, 'logo');
  const logo = skipDataUrl(studioBranding.logo);
  if (logo !== undefined) logoObj.default = logo;

  const idleLogo = skipDataUrl(studioBranding.idleLogo);
  if (idleLogo !== undefined) branding.idleLogo = idleLogo;

  const footerLogo = skipDataUrl(studioBranding.footerLogo);
  if (footerLogo !== undefined) branding.footerLogo = footerLogo;

  const favicon = skipDataUrl(studioBranding.favicon);
  if (favicon !== undefined) branding.favicon = favicon;

  // Fonts: sólo persistir nombres simples si difieren de los defaults del schema
  // (Montserrat / Open Sans). Si son los defaults, no añadir el bloque (ruido).
  const fonts = studioBranding.fonts;
  if (fonts) {
    const isDefaultDisplay = !fonts.display || fonts.display === 'Montserrat';
    const isDefaultBody = !fonts.body || fonts.body === 'Open Sans';
    if (!isDefaultDisplay || !isDefaultBody) {
      const fontsObj = obj(branding, 'fonts');
      if (fonts.display) fontsObj.display = fonts.display;
      if (fonts.body) fontsObj.body = fonts.body;
    }
  }
}

function applyModulesAndTiles(
  features: Record<string, unknown>,
  home: Record<string, unknown>,
  modules: NonNullable<KioskConfig['modules']>,
) {
  // Wayfinding extraído del array: filesystem lo guarda como objeto separado.
  const wayfindingTile = modules.tiles.find((t) => t.key === 'wayfinding');
  const homeTiles = modules.tiles.filter((t) => t.key !== 'wayfinding');

  // Preservar `image` por key de los tiles existentes en filesystem.
  const currentTiles = Array.isArray(home.tiles)
    ? (home.tiles as Array<Record<string, unknown>>)
    : [];
  const imageByKey = new Map<string, string>();
  for (const t of currentTiles) {
    if (typeof t.key === 'string' && typeof t.image === 'string') {
      imageByKey.set(t.key, t.image);
    }
  }
  home.tiles = homeTiles.map((t) => ({
    key: t.key,
    label: t.label,
    enabled: t.enabled,
    image: imageByKey.get(t.key) ?? '',
  }));

  if (wayfindingTile) {
    const cur = obj(home, 'wayfinding');
    cur.enabled = wayfindingTile.enabled;
    cur.label = wayfindingTile.label;
  }

  // systemModules → flags dispersos.
  if (modules.systemModules) {
    const sm = modules.systemModules;
    if (home.askAi && typeof home.askAi === 'object') {
      (home.askAi as Record<string, unknown>).enabled = sm.aiAvatar;
    }
    ensure(features, 'languages', () => ({ enabled: true, available: ['en'], default: 'en' }));
    obj(features, 'languages').enabled = sm.languages;
    // ads no tiene flag global en filesystem; se omite.
  }
}

function writeKinded(modulesObj: Record<string, unknown>, key: string, value: unknown) {
  modulesObj[key] = { kind: key, ...(value as Record<string, unknown>) };
}

function skipDataUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('data:')) return undefined;
  return value;
}

function ensure<T extends Record<string, unknown>>(
  parent: T,
  key: keyof T & string,
  factory: () => Record<string, unknown>,
) {
  if (parent[key] == null || typeof parent[key] !== 'object' || Array.isArray(parent[key])) {
    (parent as Record<string, unknown>)[key] = factory();
  }
}

function obj(parent: Record<string, unknown>, key: string): Record<string, unknown> {
  const v = parent[key];
  if (v == null || typeof v !== 'object' || Array.isArray(v)) {
    const fresh: Record<string, unknown> = {};
    parent[key] = fresh;
    return fresh;
  }
  return v as Record<string, unknown>;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  tokens.css                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Reemplaza solo las 3 líneas `--brand-primary/secondary/tertiary`
 * con los hex del Studio convertidos a HSL. Preserva el resto del
 * archivo (otros tokens semánticos, comentarios, modos high-contrast).
 */
export function buildTokensCss(studio: KioskConfig, currentCss: string): string {
  let next = currentCss;
  next = replaceBrandToken(next, '--brand-primary', studio.branding.primary);
  next = replaceBrandToken(next, '--brand-secondary', studio.branding.secondary);
  next = replaceBrandToken(next, '--brand-tertiary', studio.branding.tertiary);
  return next;
}

function replaceBrandToken(css: string, name: string, hex: string): string {
  const hsl = hexToHsl(hex);
  const upperHex = hex.toUpperCase().replace(/^#/, '#');
  // Match completo:
  //   --brand-X: VALUE; /* #HEX — descripcion */
  // Captura grupos: [1]head, [2]value, [3];, [4]" /* ", [5]"#HEX", [6]" — descripcion */"
  // El comentario es opcional para tolerar tokens sin comentario lateral.
  const re = new RegExp(
    `(${escapeRegex(name)}\\s*:\\s*)([^;]*?)(;)(\\s*/\\*\\s*)(#[0-9A-Fa-f]{3,6})([^*]*\\*/)?`,
    'g',
  );
  let found = false;
  const replaced = css.replace(
    re,
    (
      match,
      head: string,
      _value: string,
      semi: string,
      commPre: string | undefined,
      _hexComment: string | undefined,
      commPost: string | undefined,
    ) => {
      found = true;
      if (commPre && commPost) {
        return `${head}${hsl}${semi}${commPre}${upperHex}${commPost}`;
      }
      // Token sin comentario lateral (defensivo): reemplazar solo el valor.
      return match.replace(/^[^;]*;/, `${head}${hsl}${semi}`);
    },
  );
  if (!found) {
    // Fallback simple sin comentario por si el formato cambia.
    const reFallback = new RegExp(`(${escapeRegex(name)}\\s*:\\s*)([^;]*?)(;)`, 'g');
    const fb = css.replace(reFallback, (_m, head: string, _v: string, tail: string) => {
      found = true;
      return `${head}${hsl}${tail}`;
    });
    if (!found) {
      console.warn(`[publish-merger] token ${name} not found in tokens.css — skipping`);
    }
    return fb;
  }
  return replaced;
}

function escapeRegex(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
