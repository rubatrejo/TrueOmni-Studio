/**
 * Schema Zod del producto Digital Displays (signage).
 *
 * Vive completamente separado del schema del kiosk. Todos los nombres prefijados
 * con "Signage" para evitar colisiones. Tipos derivados con z.infer.
 *
 * En DS0 los módulos tienen shape mínima válida para placeholders. Cada sub-fase
 * de template (DS3..DS10) refina el módulo correspondiente. Las shapes son
 * forward-compatible: añadir campos opcionales no rompe configs existentes.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
//  Cliente — branding, header, location
// ---------------------------------------------------------------------------

export const SignageLocationSchema = z.object({
  city: z.string().min(1),
  lat: z.number(),
  lon: z.number(),
});
export type SignageLocation = z.infer<typeof SignageLocationSchema>;

export const SignageBrandingSchema = z.object({
  logos: z.object({
    default: z.string().min(1),
    dark: z.string().optional(),
  }),
  fonts: z.object({
    default: z.string().min(1),
    display: z.string().optional(),
  }),
  /** Overrides puntuales de tokens CSS (key: nombre sin --signage-, value: HSL "H S% L%"). */
  tokens: z.record(z.string(), z.string()).optional(),
});
export type SignageBranding = z.infer<typeof SignageBrandingSchema>;

const HeaderBackgroundColor = z.object({
  kind: z.literal('color'),
  color: z.string(),
});
const HeaderBackgroundGradient = z.object({
  kind: z.literal('gradient'),
  from: z.string(),
  to: z.string(),
  angle: z.number().optional(),
});
const HeaderBackgroundImage = z.object({
  kind: z.literal('image'),
  src: z.string(),
});
export const SignageHeaderBackgroundSchema = z.discriminatedUnion('kind', [
  HeaderBackgroundColor,
  HeaderBackgroundGradient,
  HeaderBackgroundImage,
]);
export type SignageHeaderBackground = z.infer<typeof SignageHeaderBackgroundSchema>;

export const SignageHeaderSchema = z.object({
  /** top default; bottom mueve el header al fondo y el body content al área superior. */
  position: z.enum(['top', 'bottom']),
  height: z.union([z.literal(80), z.literal(100), z.literal(120)]),
  layout: z.enum(['logo-left', 'logo-center', 'logo-right']),
  background: SignageHeaderBackgroundSchema,
  showLogo: z.boolean(),
  showWeather: z.boolean(),
  showClock: z.boolean(),
  clockFormat: z.enum(['12h', '24h']),
  weatherUnits: z.enum(['metric', 'imperial']),
  forecastDays: z.union([z.literal(0), z.literal(3), z.literal(5)]),
});
export type SignageHeader = z.infer<typeof SignageHeaderSchema>;

// ---------------------------------------------------------------------------
//  Cliente — events / social / news (data compartida entre displays)
// ---------------------------------------------------------------------------

export const SignageEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  startsAt: z.string(), // ISO local
  location: z.string().optional(),
  image: z.string().optional(),
  category: z.string().optional(),
});
export type SignageEvent = z.infer<typeof SignageEventSchema>;

export const SignageSocialPostSchema = z.object({
  id: z.string().min(1),
  author: z.string().min(1),
  image: z.string().optional(),
  network: z.enum(['instagram', 'tiktok', 'facebook', 'x']).optional(),
  caption: z.string().optional(),
});
export type SignageSocialPost = z.infer<typeof SignageSocialPostSchema>;

export const SignageFeaturedTweetSchema = z.object({
  id: z.string().min(1),
  author: z.string().min(1),
  handle: z.string().optional(),
  publishedAt: z.string().optional(),
  body: z.string().min(1),
  network: z.enum(['x', 'instagram', 'facebook', 'tiktok']),
  hashtag: z.string().optional(),
  image: z.string().optional(),
  avatar: z.string().optional(),
});
export type SignageFeaturedTweet = z.infer<typeof SignageFeaturedTweetSchema>;

export const SignageSocialDataSchema = z.object({
  filter: z
    .object({
      hashtag: z.string().nullable().optional(),
      network: z.string().nullable().optional(),
    })
    .optional(),
  posts: z.array(SignageSocialPostSchema),
  featuredTweet: SignageFeaturedTweetSchema.optional(),
});
export type SignageSocialData = z.infer<typeof SignageSocialDataSchema>;

export const SignageNewsItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  publishedAt: z.string().optional(),
  source: z.string().optional(),
  url: z.string().optional(),
});
export type SignageNewsItem = z.infer<typeof SignageNewsItemSchema>;

const NewsSourceManual = z.object({
  kind: z.literal('manual'),
  items: z.array(SignageNewsItemSchema),
});
const NewsSourceRss = z.object({
  kind: z.literal('rss'),
  url: z.string().url(),
  maxItems: z.number().int().min(1).max(50).optional(),
});
const NewsSourceApi = z.object({
  kind: z.literal('api'),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
  maxItems: z.number().int().min(1).max(50).optional(),
});
export const SignageNewsSourceSchema = z.discriminatedUnion('kind', [
  NewsSourceManual,
  NewsSourceRss,
  NewsSourceApi,
]);
export type SignageNewsSource = z.infer<typeof SignageNewsSourceSchema>;

export const SignageNewsConfigSchema = z.object({
  source: SignageNewsSourceSchema,
  rotationIntervalSec: z.number().int().min(2).max(60),
});
export type SignageNewsConfig = z.infer<typeof SignageNewsConfigSchema>;

// ---------------------------------------------------------------------------
//  Display — settings + playlist
// ---------------------------------------------------------------------------

export const SignageDisplaySettingsSchema = z.object({
  targetResolution: z.enum(['1080p', '4k']),
  audio: z.boolean(),
  defaultDurationMs: z.number().int().min(1000).max(600_000),
  defaultTransition: z.enum(['cut', 'fade', 'slide-left', 'slide-up']),
  sleepSchedule: z
    .object({
      enabled: z.boolean(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
    })
    .optional(),
});
export type SignageDisplaySettings = z.infer<typeof SignageDisplaySettingsSchema>;

export const SignageSlideScheduleSchema = z.object({
  kind: z.enum(['always', 'hours', 'date-range']),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  hideOutsideSchedule: z.boolean().default(true),
});
export type SignageSlideSchedule = z.infer<typeof SignageSlideScheduleSchema>;

// ---------------------------------------------------------------------------
//  Módulos (instances dentro de slots de templates)
//
//  Cada módulo en DS0 tiene shape mínima. Las sub-fases de template las refinan.
// ---------------------------------------------------------------------------

const ModuleEvents = z.object({
  kind: z.literal('events'),
  layout: z.enum(['hero-grid', 'list', 'mosaic']).default('hero-grid'),
  maxItems: z.number().int().min(1).max(20).default(5),
  filter: z
    .object({
      categories: z.array(z.string()).optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    })
    .optional(),
  titleOverride: z.string().optional(),
});

const ModuleSocial = z.object({
  kind: z.literal('social'),
  layout: z.enum(['grid-tweet', 'mosaic', 'single', 'ticker']).default('grid-tweet'),
  maxPosts: z.number().int().min(1).max(24).default(6),
  rotationIntervalSec: z.number().int().min(2).max(60).default(8),
  filter: z
    .object({
      hashtag: z.string().optional(),
      network: z.string().optional(),
    })
    .optional(),
});

const ModuleVideoImage = z.object({
  kind: z.literal('video-image'),
  asset: z.object({
    url: z.string().min(1),
    kind: z.enum(['video', 'image']),
  }),
  loop: z.boolean().default(true),
  fit: z.enum(['cover', 'contain']).default('cover'),
});

const ModuleAds = z.object({
  kind: z.literal('ads'),
  asset: z.object({
    url: z.string().min(1),
    kind: z.enum(['image', 'video']).default('image'),
  }),
  link: z.string().optional(),
  qr: z.string().optional(),
  weight: z.number().int().min(1).max(10).default(1),
});

const ModuleNews = z.object({
  kind: z.literal('news'),
  /** Por defecto el cliente provee la config a nivel cliente (`news.json`); el slide solo overridea opcionales. */
  layout: z.enum(['icon-headline-body', 'card']).default('icon-headline-body'),
  maxItems: z.number().int().min(1).max(10).optional(),
});

const ModuleWeather = z.object({
  kind: z.literal('weather'),
  /** Weather suele vivir solo en el header. Si aparece como slot, layout determina renderer. */
  layout: z.enum(['compact', 'detailed', 'hero']).default('compact'),
});

export const SignageModuleInstanceSchema = z.discriminatedUnion('kind', [
  ModuleEvents,
  ModuleSocial,
  ModuleVideoImage,
  ModuleAds,
  ModuleNews,
  ModuleWeather,
]);
export type SignageModuleInstance = z.infer<typeof SignageModuleInstanceSchema>;
export type SignageModuleKind = SignageModuleInstance['kind'];

export const SignageSlotConfigSchema = z.object({
  slotKey: z.string().min(1),
  module: SignageModuleInstanceSchema,
});
export type SignageSlotConfig = z.infer<typeof SignageSlotConfigSchema>;

export const SignageSlideSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().min(1),
  slots: z.array(SignageSlotConfigSchema),
  durationMs: z.number().int().min(1000).max(600_000),
  schedule: SignageSlideScheduleSchema.default({ kind: 'always', hideOutsideSchedule: true }),
  transition: z.enum(['cut', 'fade', 'slide-left', 'slide-up']).optional(),
});
export type SignageSlide = z.infer<typeof SignageSlideSchema>;

// ---------------------------------------------------------------------------
//  Cliente y display de runtime
// ---------------------------------------------------------------------------

export const SignageClientFileSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  locale: z.enum(['en', 'es', 'fr', 'de', 'pt', 'ja']),
  timezone: z.string().min(1),
  location: SignageLocationSchema,
  branding: SignageBrandingSchema,
  header: SignageHeaderSchema,
  displays: z.array(z.string().min(1)),
});
export type SignageClientFile = z.infer<typeof SignageClientFileSchema>;

/** Cliente resuelto runtime: incluye events / social / news además del client.json. */
export const SignageClientResolvedSchema = SignageClientFileSchema.extend({
  events: z.array(SignageEventSchema),
  social: SignageSocialDataSchema,
  news: SignageNewsConfigSchema,
});
export type SignageClientResolved = z.infer<typeof SignageClientResolvedSchema>;

export const SignageDisplayConfigSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  settings: SignageDisplaySettingsSchema,
  playlist: z.array(SignageSlideSchema),
});
export type SignageDisplayConfig = z.infer<typeof SignageDisplayConfigSchema>;
