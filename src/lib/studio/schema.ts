import { z } from 'zod';

/**
 * Schemas zod para el Studio.
 *
 * Por ahora cubrimos solo el subset que la Fase S1 necesita: identidad
 * del cliente + branding (3 brand colors, logo, favicon, fonts). Se
 * irán ampliando en fases siguientes (S2 modules, S3 content, etc.).
 *
 * Conviven con el `clients/_template/config.schema.json` que sigue
 * siendo la fuente de verdad estructural; este archivo añade la
 * validación tipada para la API del Studio.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/*  Branding                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const HexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be a valid hex color (#RGB or #RRGGBB)');

/**
 * Custom font subido por el usuario (woff2 / ttf / otf como data URL).
 * Si está presente, sobreescribe el `fonts.display`/`fonts.body` y se inyecta
 * vía `@font-face`. El `name` se usa en `font-family`.
 */
export const CustomFontSchema = z.object({
  /** Nombre interno usado en font-family. Auto-generado del filename. */
  name: z.string().min(1).max(64),
  /** data URL completo (`data:font/woff2;base64,...`). */
  dataUrl: z.string(),
  /** Formato declarado para `@font-face`. */
  format: z.enum(['woff2', 'woff', 'ttf', 'otf']),
});

export type CustomFont = z.infer<typeof CustomFontSchema>;

export const BrandingSchema = z.object({
  primary: HexColor,
  secondary: HexColor,
  tertiary: HexColor,
  /**
   * Logo principal (header del Home, listings, módulos). Path relativo a
   * `clients/<slug>/assets/` o data URL si aún no se publicó.
   */
  logo: z.string().optional(),
  /**
   * Logo grande del Billboard idle (centro de pantalla). Si no se sube uno
   * propio, el Billboard usa `logo` como fallback.
   */
  idleLogo: z.string().optional(),
  /**
   * Logo del footer (banda inferior) del Billboard idle. Diferente al del
   * centro porque suele ser una versión más compacta del wordmark.
   */
  footerLogo: z.string().optional(),
  /** Path relativo a `clients/<slug>/assets/` para el favicon. */
  favicon: z.string().optional(),
  fonts: z
    .object({
      /** Fuente para titulares (h1/h2/h3 + CTAs). */
      display: z.string().default('Montserrat'),
      /** Fuente para body (texto general). */
      body: z.string().default('Open Sans'),
      /** Custom font subido para Display (overrides `display`). */
      displayCustom: CustomFontSchema.optional(),
      /** Custom font subido para Body (overrides `body`). */
      bodyCustom: CustomFontSchema.optional(),
    })
    .partial()
    .optional(),
});

/** Lista curada de Google Fonts disponibles en el Font selector. */
export const STUDIO_GOOGLE_FONTS = [
  'Montserrat',
  'Open Sans',
  'Inter',
  'Manrope',
  'Space Grotesk',
  'DM Sans',
  'Playfair Display',
  'Cormorant Garamond',
  'Geist',
  'Poppins',
  'Lato',
  'Roboto',
] as const;

export type StudioGoogleFont = (typeof STUDIO_GOOGLE_FONTS)[number];

export type Branding = z.infer<typeof BrandingSchema>;

/* ────────────────────────────────────────────────────────────────────────── */
/*  Modules                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

const ModuleKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, {
    message: 'module key must be lowercase letters, digits and hyphens.',
  });

export const ModuleEntrySchema = z.object({
  /** Identificador kebab-case. Ruta del kiosk = `/home/{key}`. Único en la lista. */
  key: ModuleKeySchema,
  /** Label visual del tile. Puede contener `\n` para forzar salto. */
  label: z.string().min(1).max(64),
  /** Si false, el tile se oculta del grid del Home. */
  enabled: z.boolean(),
});

/**
 * Toggles maestros de TODOS los módulos del kiosk. Si un módulo está OFF
 * aquí, el cliente no lo ha "comprado" y no aparece en ningún sitio:
 *   - HomeDashboardEditor lo oculta (no se puede reordenar ni renombrar).
 *   - El runtime del kiosk lo esconde del grid + de la deep link.
 *
 * Cubre los 16 tiles del Home + 3 sub-sistemas globales (ads, languages,
 * ai avatar). El nombre del schema sigue siendo `SystemModulesSchema` por
 * compatibilidad con KV escritos antes de S2.5.
 */
export const SystemModulesSchema = z.object({
  // Home tiles (1:1 con KIOSK_MODULES de abajo).
  restaurants: z.boolean().default(true),
  thingsToDo: z.boolean().default(true),
  itineraryBuilder: z.boolean().default(true),
  events: z.boolean().default(true),
  passes: z.boolean().default(true),
  tickets: z.boolean().default(true),
  guestbook: z.boolean().default(true),
  socialWall: z.boolean().default(true),
  digitalBrochure: z.boolean().default(true),
  map: z.boolean().default(true),
  stay: z.boolean().default(true),
  survey: z.boolean().default(true),
  deals: z.boolean().default(true),
  photoBooth: z.boolean().default(true),
  trails: z.boolean().default(true),
  wayfinding: z.boolean().default(true),
  // Globales (no son tiles pero el kiosk los renderiza).
  ads: z.boolean().default(true),
  languages: z.boolean().default(true),
  aiAvatar: z.boolean().default(true),
});

export const ModulesSchema = z.object({
  /**
   * Lista plana y ordenada de los 16 módulos del Home (15 categorías + wayfinding).
   * El orden visual del grid lo dicta este array. Wayfinding va aquí también
   * porque desde el Studio se trata como un tile más; al publicar (Fase S7)
   * el script splittea esta lista en `features.home.tiles[]` + `features.home.wayfinding`.
   */
  tiles: z.array(ModuleEntrySchema).min(1).max(64),
  /** Toggles para módulos system-wide que no son tiles del grid. */
  systemModules: SystemModulesSchema.optional(),
});

export type ModuleEntry = z.infer<typeof ModuleEntrySchema>;
export type ModulesConfig = z.infer<typeof ModulesSchema>;
export type SystemModules = z.infer<typeof SystemModulesSchema>;

export const DEFAULT_SYSTEM_MODULES: SystemModules = {
  restaurants: true,
  thingsToDo: true,
  itineraryBuilder: true,
  events: true,
  passes: true,
  tickets: true,
  guestbook: true,
  socialWall: true,
  digitalBrochure: true,
  map: true,
  stay: true,
  survey: true,
  deals: true,
  photoBooth: true,
  trails: true,
  wayfinding: true,
  ads: true,
  languages: true,
  aiAvatar: true,
};

/**
 * Mapeo de la `key` del tile (kebab-case) ↔ el campo en `SystemModulesSchema`
 * (camelCase). Útil para filtrar tiles según los toggles.
 */
export const MODULE_KEY_TO_SYSTEM_FIELD: Record<string, keyof SystemModules> = {
  restaurants: 'restaurants',
  'things-to-do': 'thingsToDo',
  'itinerary-builder': 'itineraryBuilder',
  events: 'events',
  passes: 'passes',
  tickets: 'tickets',
  guestbook: 'guestbook',
  'social-wall': 'socialWall',
  'digital-brochure': 'digitalBrochure',
  map: 'map',
  stay: 'stay',
  survey: 'survey',
  deals: 'deals',
  'photo-booth': 'photoBooth',
  trails: 'trails',
  wayfinding: 'wayfinding',
};

/**
 * Catálogo canónico de módulos del kiosk en el orden por defecto del template.
 * Si un cliente recién creado no trae `modules`, se inicializa con esto.
 */
export const KIOSK_MODULES: readonly ModuleEntry[] = [
  { key: 'restaurants', label: 'Restaurants', enabled: true },
  { key: 'things-to-do', label: 'Things\nto Do', enabled: true },
  { key: 'itinerary-builder', label: 'Itinerary Builder', enabled: true },
  { key: 'events', label: 'Events', enabled: true },
  { key: 'passes', label: 'Passes', enabled: true },
  { key: 'tickets', label: 'Tickets', enabled: true },
  { key: 'guestbook', label: 'Guestbook', enabled: true },
  { key: 'social-wall', label: 'Social Wall', enabled: true },
  { key: 'digital-brochure', label: 'Digital Brochure', enabled: true },
  { key: 'map', label: 'Map', enabled: true },
  { key: 'stay', label: 'Stay', enabled: true },
  { key: 'survey', label: 'Survey', enabled: true },
  { key: 'deals', label: 'Deals', enabled: true },
  { key: 'photo-booth', label: 'Photo Booth', enabled: true },
  { key: 'trails', label: 'Trails', enabled: true },
  { key: 'wayfinding', label: 'Wayfinding', enabled: true },
] as const;

export function defaultModules(): ModulesConfig {
  return {
    tiles: KIOSK_MODULES.map((m) => ({ ...m })),
    systemModules: { ...DEFAULT_SYSTEM_MODULES },
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Billboard (idle / splash)                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export const BILLBOARD_VARIANTS = [0, 1, 2, 3] as const;
export type BillboardVariant = (typeof BILLBOARD_VARIANTS)[number];

export const BillboardSchema = z.object({
  /** Cuál de los 4 layouts del Billboard idle se muestra. */
  variant: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  /** Segundos sin actividad en /home antes del aviso de timeout. */
  idleTimeoutSec: z.number().int().min(15).max(600).default(60),
});

export type BillboardConfig = z.infer<typeof BillboardSchema>;

export const DEFAULT_BILLBOARD: BillboardConfig = {
  variant: 0,
  idleTimeoutSec: 60,
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  AI Avatar (Ask Anything)                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export const AiSuggestedQuestionSchema = z.object({
  id: z.string().min(1).max(64),
  text: z.string().min(1).max(160),
});

export const AiAvatarSchema = z.object({
  /** Path o data URL del PNG/JPG del avatar flotante. */
  avatar: z.string().optional(),
  /** Path o data URL del MP4/WebM del hero del modal (loop). */
  heroVideo: z.string().optional(),
  /** Texto de bienvenida del modal (sin typewriter). Soporta `{client_name}`. */
  greeting: z.string().min(1).max(280).default('Hi! How can I help you today?'),
  /** API key de Anthropic (server-side, opcional hasta Fase S6). */
  apiKey: z.string().optional(),
  /** Modelo Anthropic a usar. */
  model: z.string().default('claude-sonnet-4-6'),
  /** Preguntas sugeridas que aparecen como chips dentro del modal. */
  suggestedQuestions: z.array(AiSuggestedQuestionSchema).max(8).default([]),
});

export type AiAvatarConfig = z.infer<typeof AiAvatarSchema>;

export const DEFAULT_AI_AVATAR: AiAvatarConfig = {
  greeting: 'Hi! Ask me anything about {client_name}.',
  model: 'claude-sonnet-4-6',
  suggestedQuestions: [],
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Survey                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const SurveyQuestionBase = {
  id: z.string().min(1).max(64),
  prompt: z.string().min(1).max(280),
  subtitle: z.string().max(280).optional(),
  optional: z.boolean().optional(),
};

export const SurveyQuestionSchema = z.discriminatedUnion('type', [
  z.object({
    ...SurveyQuestionBase,
    type: z.literal('nps'),
    labels: z
      .object({ low: z.string().max(64), high: z.string().max(64) })
      .optional(),
  }),
  z.object({
    ...SurveyQuestionBase,
    type: z.literal('rating'),
    max: z.literal(5).optional(),
  }),
  z.object({
    ...SurveyQuestionBase,
    type: z.literal('single-choice'),
    options: z.array(z.string().min(1).max(120)).min(1).max(20),
  }),
  z.object({
    ...SurveyQuestionBase,
    type: z.literal('multi-choice'),
    options: z.array(z.string().min(1).max(120)).min(1).max(20),
  }),
  z.object({
    ...SurveyQuestionBase,
    type: z.literal('text'),
    maxLength: z.number().int().min(1).max(2000).optional(),
  }),
]);

export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;
export type SurveyQuestionType = SurveyQuestion['type'];

export const SurveyContactCaptureSchema = z.object({
  enabled: z.boolean(),
  email: z.boolean().optional(),
  phone: z.boolean().optional(),
  disclaimer: z.string().max(320),
});

export const SurveyIntroSchema = z.object({
  title: z.string().min(1).max(160),
  subtitle: z.string().max(280).optional(),
});

export const SurveyThankYouSchema = z.object({
  title: z.string().min(1).max(160),
  message: z.string().min(1).max(320),
  autoCloseMs: z.number().int().min(1000).max(30000).optional(),
});

export const SurveySchema = z.object({
  enabled: z.boolean(),
  /** Path o data URL del logo opcional del survey. */
  logo: z.string().optional(),
  intro: SurveyIntroSchema,
  questions: z.array(SurveyQuestionSchema).min(1).max(20),
  contactCapture: SurveyContactCaptureSchema.optional(),
  thankYou: SurveyThankYouSchema,
});

export type SurveyConfig = z.infer<typeof SurveySchema>;

export const DEFAULT_SURVEY: SurveyConfig = {
  enabled: true,
  intro: {
    title: 'We value your feedback',
    subtitle: 'Your answers help us improve this kiosk.',
  },
  questions: [
    {
      id: 'nps',
      type: 'nps',
      prompt: 'How likely are you to recommend this kiosk?',
      subtitle: 'Your honest rating helps us improve the experience for every visitor.',
      labels: { low: 'Not at all likely', high: 'Extremely likely' },
    },
    {
      id: 'overall',
      type: 'rating',
      prompt: 'Overall, how would you rate your experience?',
      subtitle: 'One tap is all it takes — from poor to excellent.',
    },
    {
      id: 'comment',
      type: 'text',
      prompt: 'Any other feedback?',
      subtitle: 'Share anything else on your mind — ideas, suggestions or praise.',
      optional: true,
      maxLength: 500,
    },
  ],
  contactCapture: {
    enabled: false,
    email: true,
    phone: false,
    disclaimer: 'We only use this to follow up if you asked for it.',
  },
  thankYou: {
    title: 'Thanks for your feedback',
    message: 'We read every response. Enjoy your visit!',
    autoCloseMs: 5000,
  },
};

let _surveyIdSeq = 0;
export function newSurveyQuestionId(): string {
  return `q-${Date.now().toString(36)}-${++_surveyIdSeq}`;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Deals                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

const SlugStringSchema = z
  .string()
  .min(1)
  .max(96)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'must be lowercase letters/digits/hyphens');

/** Fecha ISO yyyy-mm-dd. */
const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be ISO date (yyyy-mm-dd)');

export const DealSchema = z.object({
  slug: SlugStringSchema,
  title: z.string().min(1).max(160),
  shortDescription: z.string().max(280).default(''),
  headline: z.string().max(280).default(''),
  subtitle: z.string().max(280).default(''),
  longDescription: z.string().max(2000).default(''),
  /** Path o data URL. Vacío = sin imagen (card mostrará gradient fallback). */
  cover: z.string().default(''),
  expiresAt: IsoDateSchema,
  originalPrice: z.string().max(64).optional(),
  promoCode: z.string().max(64).optional(),
  /** URL codificada en el QR del modal redeem. */
  qrUrl: z.string().url().or(z.literal('')).default(''),
  features: z.array(z.string().min(1).max(64)).default([]),
  popularity: z.number().int().min(0).max(100).optional(),
  discountValue: z.number().int().min(0).max(100).optional(),
});

export type Deal = z.infer<typeof DealSchema>;

export const DealsModuleSchema = z.object({
  label: z.string().min(1).max(64),
  /** Path o URL absoluta del hero del módulo. */
  heroImage: z.string().default(''),
  featureCatalog: z.array(z.string().min(1).max(64)).default([]),
  deals: z.array(DealSchema).max(200),
  qrLogo: z.string().optional(),
});

export type DealsModuleConfig = z.infer<typeof DealsModuleSchema>;

export const DEFAULT_DEALS: DealsModuleConfig = {
  label: 'Deals',
  heroImage: '',
  featureCatalog: ['Food & Drink', 'Shopping', 'Entertainment', 'Wellness'],
  deals: [],
};

let _dealIdSeq = 0;
export function newDealSlug(title?: string): string {
  const base = (title ?? 'deal')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'deal'}-${Date.now().toString(36)}-${++_dealIdSeq}`;
}

export function makeBlankDeal(): Deal {
  const today = new Date();
  today.setMonth(today.getMonth() + 1);
  const expiresAt = today.toISOString().slice(0, 10);
  return {
    slug: newDealSlug('new-deal'),
    title: 'New deal',
    shortDescription: '',
    headline: '',
    subtitle: '',
    longDescription: '',
    cover: '',
    expiresAt,
    qrUrl: '',
    features: [],
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Photo Booth                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

const ShortIdSchema = z.string().min(1).max(64);

export const PhotoBoothBackgroundSchema = z.object({
  id: ShortIdSchema,
  /** Path o data URL. Vacío = sin reemplazo (foto original sin chroma). */
  image: z.string(),
  label: z.string().min(1).max(64),
  thumbnail: z.string().optional(),
});

export const PhotoBoothFrameSchema = z.object({
  id: ShortIdSchema,
  image: z.string(),
  label: z.string().min(1).max(64),
  thumbnail: z.string().optional(),
});

export const PhotoBoothFilterSchema = z.object({
  id: ShortIdSchema,
  label: z.string().min(1).max(64),
  /** Valor de `ctx.filter` / `style.filter`. Ej. "grayscale(1)". */
  cssFilter: z.string().min(1).max(280),
  thumbnail: z.string().optional(),
});

export const PhotoBoothStickerSchema = z.object({
  id: ShortIdSchema,
  /** PNG con transparencia (path o data URL). */
  image: z.string().min(1),
  label: z.string().min(1).max(64),
  /** Ancho default al añadir (px en sistema 1080×1920). */
  defaultWidth: z.number().int().min(50).max(800).optional(),
});

export const PhotoBoothTimerSchema = z.object({
  enabled: z.boolean(),
  default: z.number().int().min(0).max(60),
  options: z.array(z.number().int().min(0).max(60)).min(1).max(8),
});

export const PhotoBoothSocialSchema = z.object({
  x: z.string().max(64).optional(),
  facebook: z.string().max(64).optional(),
  instagram: z.string().max(64).optional(),
});

export const PhotoBoothSchema = z.object({
  enabled: z.boolean(),
  backgrounds: z.array(PhotoBoothBackgroundSchema).min(1).max(50),
  frames: z.array(PhotoBoothFrameSchema).max(50),
  filters: z.array(PhotoBoothFilterSchema).max(50),
  stickers: z.array(PhotoBoothStickerSchema).max(50),
  timer: PhotoBoothTimerSchema.optional(),
  shareUrlTemplate: z.string().max(280).optional(),
  social: PhotoBoothSocialSchema.optional(),
  shareCardLogo: z.string().optional(),
  shareBackground: z.string().optional(),
  edgeFeather: z.number().int().min(0).max(20).optional(),
});

export type PhotoBoothBackground = z.infer<typeof PhotoBoothBackgroundSchema>;
export type PhotoBoothFrame = z.infer<typeof PhotoBoothFrameSchema>;
export type PhotoBoothFilter = z.infer<typeof PhotoBoothFilterSchema>;
export type PhotoBoothSticker = z.infer<typeof PhotoBoothStickerSchema>;
export type PhotoBoothTimerConfig = z.infer<typeof PhotoBoothTimerSchema>;
export type PhotoBoothConfig = z.infer<typeof PhotoBoothSchema>;

let _photoBoothIdSeq = 0;
export function newPhotoBoothId(prefix = 'pb'): string {
  return `${prefix}-${Date.now().toString(36)}-${++_photoBoothIdSeq}`;
}

export const DEFAULT_PHOTO_BOOTH: PhotoBoothConfig = {
  enabled: true,
  backgrounds: [
    { id: 'bg-original', image: '', label: 'Original' },
  ],
  frames: [],
  filters: [
    { id: 'filter-none', label: 'Original', cssFilter: 'none' },
    { id: 'filter-bw', label: 'B&W', cssFilter: 'grayscale(1)' },
    { id: 'filter-warm', label: 'Warm', cssFilter: 'saturate(1.2) contrast(1.05)' },
  ],
  stickers: [],
  timer: { enabled: true, default: 5, options: [3, 5, 10] },
  edgeFeather: 3,
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Digital Brochure                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

export const BrochureItemSchema = z.object({
  slug: SlugStringSchema,
  title: z.string().min(1).max(160),
  /** Una de `categories` del módulo. */
  category: z.string().min(1).max(64),
  /** URL/path/data URL del cover. */
  cover: z.string().default(''),
  description: z.string().max(2000).default(''),
  /** Human-readable: "June 2025". */
  publishedLabel: z.string().max(64).default(''),
  /** URL/path/data URL del PDF. */
  pdfUrl: z.string().default(''),
  /** Páginas del PDF (para scrubber instantáneo). */
  pageCount: z.number().int().min(1).max(500).default(1),
});

export type BrochureItem = z.infer<typeof BrochureItemSchema>;

export const BrochuresModuleSchema = z.object({
  label: z.string().min(1).max(64),
  heroImage: z.string().default(''),
  categories: z.array(z.string().min(1).max(64)).max(20),
  brochures: z.array(BrochureItemSchema).max(200),
});

export type BrochuresModuleConfig = z.infer<typeof BrochuresModuleSchema>;

export const DEFAULT_BROCHURES: BrochuresModuleConfig = {
  label: 'Digital Brochure',
  heroImage: '',
  categories: ['Things to Do', 'Stay', 'Eat', 'Events'],
  brochures: [],
};

let _brochureIdSeq = 0;
export function newBrochureSlug(title?: string): string {
  const base = (title ?? 'brochure')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'brochure'}-${Date.now().toString(36)}-${++_brochureIdSeq}`;
}

export function makeBlankBrochure(category: string): BrochureItem {
  const today = new Date();
  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return {
    slug: newBrochureSlug('new-brochure'),
    title: 'New brochure',
    category,
    cover: '',
    description: '',
    publishedLabel: monthName,
    pdfUrl: '',
    pageCount: 1,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Social Wall                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

export const SOCIAL_SOURCES = [
  'x',
  'instagram',
  'pinterest',
  'youtube',
  'facebook',
  'tiktok',
] as const;
export type SocialSource = (typeof SOCIAL_SOURCES)[number];

export const SOCIAL_POST_TYPES = ['image', 'video', 'text', 'gallery'] as const;
export type SocialPostType = (typeof SOCIAL_POST_TYPES)[number];

export const SocialAuthorSchema = z.object({
  name: z.string().min(1).max(120),
  username: z.string().min(1).max(64),
  avatar: z.string().default(''),
});

export const SocialPostSchema = z.object({
  id: ShortIdSchema,
  source: z.enum(SOCIAL_SOURCES),
  type: z.enum(SOCIAL_POST_TYPES),
  author: SocialAuthorSchema,
  /** ISO date-time. */
  publishedAt: z.string().min(1).max(64),
  caption: z.string().max(2000).default(''),
  mediaUrl: z.string().optional(),
  videoPoster: z.string().optional(),
  galleryUrls: z.array(z.string()).max(20).optional(),
  aspectRatio: z.number().min(0.1).max(10).optional(),
  permalink: z.string().optional(),
});

export const SocialHighlightSchema = z.object({
  id: ShortIdSchema,
  image: z.string().min(1),
  label: z.string().max(64).optional(),
});

export const SocialHandlesSchema = z.object({
  x: z.string().max(64).optional(),
  instagram: z.string().max(64).optional(),
  pinterest: z.string().max(64).optional(),
  youtube: z.string().max(64).optional(),
  facebook: z.string().max(64).optional(),
  tiktok: z.string().max(64).optional(),
});

export const SocialWallSchema = z.object({
  label: z.string().min(1).max(64),
  heroImage: z.string().default(''),
  /** Hashtag sin '#'. */
  hashtag: z.string().max(64).default(''),
  handles: SocialHandlesSchema.optional(),
  highlights: z.array(SocialHighlightSchema).max(50),
  posts: z.array(SocialPostSchema).max(500),
});

export type SocialAuthor = z.infer<typeof SocialAuthorSchema>;
export type SocialPost = z.infer<typeof SocialPostSchema>;
export type SocialHighlight = z.infer<typeof SocialHighlightSchema>;
export type SocialHandles = z.infer<typeof SocialHandlesSchema>;
export type SocialWallConfig = z.infer<typeof SocialWallSchema>;

let _socialIdSeq = 0;
export function newSocialId(prefix = 'sw'): string {
  return `${prefix}-${Date.now().toString(36)}-${++_socialIdSeq}`;
}

export const DEFAULT_SOCIAL_WALL: SocialWallConfig = {
  label: 'Social Wall',
  heroImage: '',
  hashtag: '',
  handles: {},
  highlights: [],
  posts: [],
};

export function makeBlankSocialPost(source: SocialSource): SocialPost {
  return {
    id: newSocialId('post'),
    source,
    type: 'image',
    author: {
      name: 'New author',
      username: 'newuser',
      avatar: '',
    },
    publishedAt: new Date().toISOString(),
    caption: '',
    aspectRatio: 1,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Guestbook                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

const CoordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const GuestbookPinOptionSchema = z.object({
  id: ShortIdSchema,
  /** Imagen completa del pin (círculo + pointer). */
  image: z.string().min(1),
  /** Versión solo-círculo (sin pointer) para el popup. */
  circleImage: z.string().optional(),
  label: z.string().min(1).max(64),
});

export const GuestbookCountrySchema = z.object({
  /** ISO 3166-1 alpha-2 (US, MX, …). */
  code: z
    .string()
    .min(2)
    .max(2)
    .regex(/^[A-Z]{2}$/, 'must be 2 uppercase letters'),
  name: z.string().min(1).max(64),
});

export const GuestbookSeedPinSchema = z.object({
  id: ShortIdSchema,
  authorName: z.string().min(1).max(120),
  zipCode: z.string().min(1).max(20),
  coords: CoordsSchema,
  pinImage: z.string().min(1),
  /** Etiqueta human-readable: "Today", "Yesterday", "Jan 14". */
  dateLabel: z.string().min(1).max(64),
  address: z.string().min(1).max(280),
  comment: z.string().max(1000).optional(),
});

export const GuestbookSchema = z.object({
  label: z.string().min(1).max(64),
  heroImage: z.string().default(''),
  pinCatalog: z.array(GuestbookPinOptionSchema).min(1).max(20),
  countries: z.array(GuestbookCountrySchema).max(300),
  seedPins: z.array(GuestbookSeedPinSchema).max(500),
  earthStart: z
    .object({
      center: CoordsSchema,
      zoom: z.number().min(0).max(20),
    })
    .optional(),
});

export type GuestbookPinOption = z.infer<typeof GuestbookPinOptionSchema>;
export type GuestbookCountry = z.infer<typeof GuestbookCountrySchema>;
export type GuestbookSeedPin = z.infer<typeof GuestbookSeedPinSchema>;
export type GuestbookConfig = z.infer<typeof GuestbookSchema>;

let _guestbookIdSeq = 0;
export function newGuestbookId(prefix = 'gb'): string {
  return `${prefix}-${Date.now().toString(36)}-${++_guestbookIdSeq}`;
}

const COMMON_COUNTRIES: GuestbookCountry[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'AU', name: 'Australia' },
];

export const DEFAULT_GUESTBOOK: GuestbookConfig = {
  label: 'Guestbook',
  heroImage: '',
  pinCatalog: [
    { id: 'pin-default', image: '', label: 'Default' },
  ],
  countries: COMMON_COUNTRIES,
  seedPins: [],
  earthStart: { center: { lat: 30, lng: 0 }, zoom: 1.5 },
};

export function makeBlankSeedPin(): GuestbookSeedPin {
  return {
    id: newGuestbookId('seed'),
    authorName: 'New visitor',
    zipCode: '',
    coords: { lat: 0, lng: 0 },
    pinImage: '',
    dateLabel: 'Today',
    address: '',
  };
}

export function makeBlankPinOption(): GuestbookPinOption {
  return {
    id: newGuestbookId('pin'),
    image: '',
    label: 'New pin',
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Catalog primitives compartidos                                           */
/* ────────────────────────────────────────────────────────────────────────── */

const ItemSlugSchema = z
  .string()
  .min(1)
  .max(96)
  .regex(/^[a-z0-9][a-z0-9-]*$/, {
    message: 'item slug must be lowercase letters, digits and hyphens.',
  });

const DirectionStepSchema = z.object({
  icon: z.string().max(32),
  distance: z.string().max(64),
  instruction: z.string().max(280),
});

const PriceRangeSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

/** Ensure all `slug` values inside an array are unique. */
function uniqueBySlug<T extends { slug: string }>(arr: T[], ctx: z.RefinementCtx) {
  const seen = new Set<string>();
  arr.forEach((item, idx) => {
    if (seen.has(item.slug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [idx, 'slug'],
        message: `duplicate slug "${item.slug}" — must be unique within the catalog.`,
      });
    }
    seen.add(item.slug);
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Listings (Restaurants / Things to Do / Stay)                             */
/* ────────────────────────────────────────────────────────────────────────── */

const DayOpenSchema = z.tuple([z.number(), z.number()]);

export const ListingItemSchema = z.object({
  slug: ItemSlugSchema,
  title: z.string().min(1).max(160),
  subcategory: z.string().max(64).default(''),
  image: z.string().default(''),
  hours: z.string().max(64).default(''),
  openHours: z
    .object({
      mon: DayOpenSchema,
      tue: DayOpenSchema,
      wed: DayOpenSchema,
      thu: DayOpenSchema,
      fri: DayOpenSchema,
      sat: DayOpenSchema,
      sun: DayOpenSchema,
    })
    .optional(),
  priceRange: PriceRangeSchema.default(2),
  features: z.array(z.string().max(64)).default([]),
  popularity: z.number().min(0).max(100).default(50),
  address: z.string().max(280).default(''),
  phone: z.string().max(64).default(''),
  coords: CoordsSchema.default({ lat: 0, lng: 0 }),
  website: z.string().max(2048).default(''),
  reserveUrl: z.string().max(2048).optional(),
  threshold360Url: z.string().max(2048).optional(),
  description: z.string().max(4000).default(''),
  directions: z.array(DirectionStepSchema).default([]),
});

export type ListingItem = z.infer<typeof ListingItemSchema>;

export const ListingsCatalogSchema = z.object({
  heroImage: z.string().default(''),
  subcategories: z.array(z.string().max(64)).default([]),
  features: z.array(z.string().max(64)).default([]),
  listings: z.array(ListingItemSchema).superRefine(uniqueBySlug).default([]),
});

export type ListingsCatalog = z.infer<typeof ListingsCatalogSchema>;

/**
 * Una entrada del módulo Listings — un catálogo "tipo restaurants" con su
 * propio key/label/icono. Los catálogos son dinámicos: el operador puede
 * duplicar, borrar o crear nuevos (Shopping, Beaches, etc.).
 */
export const ListingsCatalogEntrySchema = z.object({
  /** URL slug del módulo (`restaurants`, `things-to-do`, `shopping`). Único. */
  key: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-]*$/, {
      message: 'listing module key must be lowercase, hyphens, no leading dash.',
    }),
  /** Label visible en el sidebar y en el tile del Home. */
  label: z.string().min(1).max(64),
  /** Nombre del icono Lucide (string para ser serializable). */
  iconKey: z.string().min(1).max(64).default('UtensilsCrossed'),
  /** Master toggle de visibilidad del módulo. */
  enabled: z.boolean().default(true),
  /** Heroimage + taxonomies + items. */
  catalog: ListingsCatalogSchema,
});

export type ListingsCatalogEntry = z.infer<typeof ListingsCatalogEntrySchema>;

export const ListingsModuleSchema = z
  .array(ListingsCatalogEntrySchema)
  .superRefine((arr, ctx) => {
    const seen = new Set<string>();
    arr.forEach((entry, idx) => {
      if (seen.has(entry.key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [idx, 'key'],
          message: `duplicate listing module key "${entry.key}"`,
        });
      }
      seen.add(entry.key);
    });
  });

export type ListingsModule = z.infer<typeof ListingsModuleSchema>;

const EMPTY_LISTINGS_CATALOG: ListingsCatalog = {
  heroImage: '',
  subcategories: [],
  features: [],
  listings: [],
};

/**
 * Defaults canónicos del template — 3 listing modules: Restaurants, Things to Do, Stay.
 */
export function defaultListings(): ListingsModule {
  return [
    {
      key: 'restaurants',
      label: 'Restaurants',
      iconKey: 'UtensilsCrossed',
      enabled: true,
      catalog: { ...EMPTY_LISTINGS_CATALOG },
    },
    {
      key: 'things-to-do',
      label: 'Things to Do',
      iconKey: 'Sparkles',
      enabled: true,
      catalog: { ...EMPTY_LISTINGS_CATALOG },
    },
    {
      key: 'stay',
      label: 'Stay',
      iconKey: 'BedDouble',
      enabled: true,
      catalog: { ...EMPTY_LISTINGS_CATALOG },
    },
  ];
}

/**
 * Migra el shape antiguo `{restaurants, thingsToDo, stay}` al array dinámico.
 * Idempotente: si ya es array, lo devuelve tal cual.
 */
export function migrateListings(raw: unknown): ListingsModule {
  if (Array.isArray(raw)) {
    const parsed = ListingsModuleSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    return defaultListings();
  }
  if (raw && typeof raw === 'object') {
    const old = raw as Record<string, unknown>;
    const grab = (key: string): ListingsCatalog => {
      const v = old[key];
      if (v && typeof v === 'object') {
        const c = v as Record<string, unknown>;
        return {
          heroImage: typeof c.heroImage === 'string' ? c.heroImage : '',
          subcategories: Array.isArray(c.subcategories) ? (c.subcategories as string[]) : [],
          features: Array.isArray(c.features) ? (c.features as string[]) : [],
          listings: Array.isArray(c.listings) ? (c.listings as ListingItem[]) : [],
        };
      }
      return { ...EMPTY_LISTINGS_CATALOG };
    };
    return [
      { key: 'restaurants', label: 'Restaurants', iconKey: 'UtensilsCrossed', enabled: true, catalog: grab('restaurants') },
      { key: 'things-to-do', label: 'Things to Do', iconKey: 'Sparkles', enabled: true, catalog: grab('thingsToDo') },
      { key: 'stay', label: 'Stay', iconKey: 'BedDouble', enabled: true, catalog: grab('stay') },
    ];
  }
  return defaultListings();
}

export function makeBlankListing(): ListingItem {
  return {
    slug: `listing-${Date.now()}`,
    title: 'Untitled',
    subcategory: '',
    image: '',
    hours: '',
    priceRange: 2,
    features: [],
    popularity: 50,
    address: '',
    phone: '',
    coords: { lat: 0, lng: 0 },
    website: '',
    description: '',
    directions: [],
  };
}

/**
 * Genera una key única para un listing module nuevo o duplicado.
 * Si `base` es 'restaurants' y ya existe, devuelve 'restaurants-2', '...-3', etc.
 */
export function uniqueListingKey(existing: ListingsModule, base: string): string {
  const taken = new Set(existing.map((e) => e.key));
  const slug = base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'module';
  if (!taken.has(slug)) return slug;
  let i = 2;
  while (taken.has(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}

/**
 * Duplica un listing entry — clona schema (label, subcategories, features) +
 * limpia los listings (los items NO se duplican: el operador empieza limpio).
 */
export function duplicateListingEntry(
  source: ListingsCatalogEntry,
  existing: ListingsModule,
): ListingsCatalogEntry {
  const newKey = uniqueListingKey(existing, `${source.key}`);
  return {
    key: newKey,
    label: `${source.label} (Copy)`,
    iconKey: source.iconKey,
    enabled: true,
    catalog: {
      heroImage: source.catalog.heroImage,
      subcategories: [...source.catalog.subcategories],
      features: [...source.catalog.features],
      listings: [],
    },
  };
}

/**
 * Crea un listing entry vacío con label dado por el usuario. La key se deriva
 * del label en kebab-case y se hace único.
 */
export function makeBlankListingEntry(
  label: string,
  existing: ListingsModule,
  iconKey = 'UtensilsCrossed',
): ListingsCatalogEntry {
  const trimmed = label.trim() || 'New module';
  return {
    key: uniqueListingKey(existing, trimmed),
    label: trimmed,
    iconKey,
    enabled: true,
    catalog: { ...EMPTY_LISTINGS_CATALOG },
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Events                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const DateIsoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD.' });

const TimeHmSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, { message: 'time must be HH:MM (24h).' });

const PriceBandSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const EventTicketSchema = z.object({
  priceDisplay: z.string().min(1).max(64),
  purchaseUrl: z.string().max(2048),
});

export const EventItemSchema = z.object({
  slug: ItemSlugSchema,
  title: z.string().min(1).max(160),
  category: z.string().max(64).default(''),
  image: z.string().default(''),
  date: DateIsoSchema,
  startTime: TimeHmSchema,
  endTime: TimeHmSchema,
  venue: z.string().max(120).default(''),
  priceMode: z.enum(['free', 'paid']).default('free'),
  priceBand: PriceBandSchema.optional(),
  features: z.array(z.string().max(64)).default([]),
  popularity: z.number().min(0).max(100).default(50),
  address: z.string().max(280).default(''),
  phone: z.string().max(64).default(''),
  coords: CoordsSchema.default({ lat: 0, lng: 0 }),
  website: z.string().max(2048).default(''),
  ticketsUrl: z.string().max(2048).optional(),
  description: z.string().max(4000).default(''),
  directions: z.array(DirectionStepSchema).default([]),
  ticket: EventTicketSchema.optional(),
});

export type EventItem = z.infer<typeof EventItemSchema>;

export const EventsModuleSchema = z.object({
  label: z.string().min(1).max(64),
  heroImage: z.string().default(''),
  categories: z.array(z.string().max(64)).default([]),
  venues: z.array(z.string().max(120)).default([]),
  features: z.array(z.string().max(64)).default([]),
  events: z.array(EventItemSchema).superRefine(uniqueBySlug).default([]),
});

export type EventsModule = z.infer<typeof EventsModuleSchema>;

export function defaultEvents(): EventsModule {
  return {
    label: 'Events',
    heroImage: '',
    categories: [],
    venues: [],
    features: [],
    events: [],
  };
}

export function makeBlankEvent(): EventItem {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  return {
    slug: `event-${Date.now()}`,
    title: 'Untitled event',
    category: '',
    image: '',
    date: iso,
    startTime: '18:00',
    endTime: '20:00',
    venue: '',
    priceMode: 'free',
    features: [],
    popularity: 50,
    address: '',
    phone: '',
    coords: { lat: 0, lng: 0 },
    website: '',
    description: '',
    directions: [],
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Tickets (wrapper derivado de events)                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export const TicketsModuleSchema = z.object({
  label: z.string().min(1).max(64),
  heroImage: z.string().default(''),
  /** Subset of `events.categories` that should appear as ticket tabs. */
  categories: z.array(z.string().max(64)).default([]),
  venues: z.array(z.string().max(120)).default([]),
  features: z.array(z.string().max(64)).default([]),
  fallbackHero: z.string().default(''),
  copy: z.string().max(2000).default(''),
});

export type TicketsModule = z.infer<typeof TicketsModuleSchema>;

export function defaultTickets(): TicketsModule {
  return {
    label: 'Tickets',
    heroImage: '',
    categories: [],
    venues: [],
    features: [],
    fallbackHero: '',
    copy: '',
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Passes                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export const PassActivitySchema = z.object({
  slug: ItemSlugSchema,
  title: z.string().min(1).max(160),
  image: z.string().default(''),
  description: z.string().max(2000).default(''),
  website: z.string().max(2048).default(''),
});

export type PassActivity = z.infer<typeof PassActivitySchema>;

export const PassItemSchema = z.object({
  slug: ItemSlugSchema,
  title: z.string().min(1).max(160),
  cover: z.string().default(''),
  bandwangoUrl: z.string().max(2048).default(''),
  tagline: z.string().max(280).optional(),
  activities: z.array(PassActivitySchema).superRefine(uniqueBySlug).default([]),
});

export type PassItem = z.infer<typeof PassItemSchema>;

export const PassesModuleSchema = z.object({
  label: z.string().min(1).max(64),
  heroImage: z.string().default(''),
  passes: z.array(PassItemSchema).superRefine(uniqueBySlug).default([]),
  qrLogo: z.string().optional(),
});

export type PassesModule = z.infer<typeof PassesModuleSchema>;

export function defaultPasses(): PassesModule {
  return {
    label: 'Passes',
    heroImage: '',
    passes: [],
  };
}

export function makeBlankPass(): PassItem {
  return {
    slug: `pass-${Date.now()}`,
    title: 'Untitled pass',
    cover: '',
    bandwangoUrl: '',
    activities: [],
  };
}

export function makeBlankPassActivity(): PassActivity {
  return {
    slug: `activity-${Date.now()}`,
    title: 'New activity',
    image: '',
    description: '',
    website: '',
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Trails                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export const TrailDifficultySchema = z.enum(['Easy', 'Moderate', 'Hard']);
export type TrailDifficulty = z.infer<typeof TrailDifficultySchema>;

export const TrailTypeSchema = z.enum(['Loop', 'Out & Back', 'Point to Point']);
export type TrailType = z.infer<typeof TrailTypeSchema>;

export const TrailConsiderationsSchema = z.object({
  distance: z.string().max(64).default(''),
  difficulty: TrailDifficultySchema.default('Easy'),
  duration: z.string().max(64).optional(),
  elevationGain: z.string().max(64).optional(),
  trailType: TrailTypeSchema.optional(),
  dogFriendly: z.boolean().optional(),
});

export const TrailMapSchema = z.object({
  geojson: z.object({
    type: z.literal('LineString'),
    coordinates: z.array(z.tuple([z.number(), z.number()])),
  }),
  defaultCenter: CoordsSchema.optional(),
  defaultZoom: z.number().min(0).max(22).optional(),
});

export const TrailItemSchema = z.object({
  slug: ItemSlugSchema,
  title: z.string().min(1).max(160),
  subcategory: z.string().max(64).default(''),
  image: z.string().default(''),
  hours: z.string().max(64).default(''),
  features: z.array(z.string().max(64)).default([]),
  popularity: z.number().min(0).max(100).default(50),
  address: z.string().max(280).default(''),
  phone: z.string().max(64).default(''),
  coords: CoordsSchema.default({ lat: 0, lng: 0 }),
  website: z.string().max(2048).default(''),
  description: z.string().max(4000).default(''),
  directions: z.array(DirectionStepSchema).default([]),
  considerations: TrailConsiderationsSchema,
  trailMap: TrailMapSchema,
});

export type TrailItem = z.infer<typeof TrailItemSchema>;

export const TrailsModuleSchema = z.object({
  label: z.string().min(1).max(64),
  heroImage: z.string().default(''),
  subcategories: z.array(z.string().max(64)).default([]),
  features: z.array(z.string().max(64)).default([]),
  difficulties: z.array(TrailDifficultySchema).default(['Easy', 'Moderate', 'Hard']),
  trailTypes: z
    .array(TrailTypeSchema)
    .default(['Loop', 'Out & Back', 'Point to Point']),
  trails: z.array(TrailItemSchema).superRefine(uniqueBySlug).default([]),
});

export type TrailsModule = z.infer<typeof TrailsModuleSchema>;

export function defaultTrails(): TrailsModule {
  return {
    label: 'Trails',
    heroImage: '',
    subcategories: [],
    features: [],
    difficulties: ['Easy', 'Moderate', 'Hard'],
    trailTypes: ['Loop', 'Out & Back', 'Point to Point'],
    trails: [],
  };
}

export function makeBlankTrail(): TrailItem {
  return {
    slug: `trail-${Date.now()}`,
    title: 'Untitled trail',
    subcategory: '',
    image: '',
    hours: '',
    features: [],
    popularity: 50,
    address: '',
    phone: '',
    coords: { lat: 0, lng: 0 },
    website: '',
    description: '',
    directions: [],
    considerations: { distance: '', difficulty: 'Easy' },
    trailMap: { geojson: { type: 'LineString', coordinates: [] } },
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  KioskConfig                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

const SlugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/, {
    message: 'slug must be lowercase letters, digits and hyphens (1–64 chars).',
  });

export const KioskConfigSchema = z.object({
  slug: SlugSchema,
  nombre: z.string().min(1).max(120),
  branding: BrandingSchema,
  /** Lista de tiles del Home — ordenada, con toggle on/off y label editable. */
  modules: ModulesSchema.optional(),
  /** Idle/Billboard: variant + idle timeout. */
  billboard: BillboardSchema.optional(),
  /** Avatar IA flotante (Ask Anything) — config editable desde el sidebar. */
  aiAvatar: AiAvatarSchema.optional(),
  /** Módulo Survey — intro + preguntas + contact capture + thank you. */
  survey: SurveySchema.optional(),
  /** Módulo Deals — lista de cupones + feature catalog + hero. */
  deals: DealsModuleSchema.optional(),
  /** Módulo Photo Booth — backgrounds, frames, filters, stickers, share. */
  photoBooth: PhotoBoothSchema.optional(),
  /** Módulo Digital Brochure — categorías + listado de PDFs. */
  brochures: BrochuresModuleSchema.optional(),
  /** Módulo Social Wall — handles, highlights, posts. */
  socialWall: SocialWallSchema.optional(),
  /** Módulo Guestbook — pin catalog, countries, seed pins. */
  guestbook: GuestbookSchema.optional(),
  /** Módulos Listings (Restaurants / Things to Do / Stay) — catálogo completo. */
  listings: ListingsModuleSchema.optional(),
  /** Módulo Events — categories, venues, lista de eventos. */
  events: EventsModuleSchema.optional(),
  /** Módulo Tickets — wrapper derivado de events ticketables. */
  tickets: TicketsModuleSchema.optional(),
  /** Módulo Passes — lista de passes con activities. */
  passes: PassesModuleSchema.optional(),
  /** Módulo Trails — subcategorías, difficulties, trailTypes, trails. */
  trails: TrailsModuleSchema.optional(),
  /** Versión actual publicada (incrementa en cada publish aprobado). */
  currentVersion: z.number().int().nonnegative().default(0),
});

export type KioskConfig = z.infer<typeof KioskConfigSchema>;

export const ConfigMetaSchema = z.object({
  slug: SlugSchema,
  owner: z.string().email().optional(),
  createdAt: z.string(),
  lastEditor: z.string().email().optional(),
  lastEditedAt: z.string(),
  currentVersion: z.number().int().nonnegative().default(0),
});

export type ConfigMeta = z.infer<typeof ConfigMetaSchema>;

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/** Brand por defecto (TrueOmni). Útil al crear cliente nuevo desde plantilla. */
export const DEFAULT_BRANDING: Branding = {
  primary: '#004F8B',
  secondary: '#0088CE',
  tertiary: '#B9BD39',
  fonts: { display: 'Montserrat', body: 'Open Sans' },
};

/** Crea un KioskConfig nuevo a partir de slug+nombre, clonando branding default. */
export function makeBlankConfig(slug: string, nombre: string): KioskConfig {
  return {
    slug,
    nombre,
    branding: { ...DEFAULT_BRANDING },
    modules: defaultModules(),
    billboard: { ...DEFAULT_BILLBOARD },
    aiAvatar: { ...DEFAULT_AI_AVATAR },
    survey: structuredClone(DEFAULT_SURVEY),
    deals: structuredClone(DEFAULT_DEALS),
    photoBooth: structuredClone(DEFAULT_PHOTO_BOOTH),
    brochures: structuredClone(DEFAULT_BROCHURES),
    socialWall: structuredClone(DEFAULT_SOCIAL_WALL),
    guestbook: structuredClone(DEFAULT_GUESTBOOK),
    listings: defaultListings(),
    events: defaultEvents(),
    tickets: defaultTickets(),
    passes: defaultPasses(),
    trails: defaultTrails(),
    currentVersion: 0,
  };
}
