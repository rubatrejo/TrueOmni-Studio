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
  /** Imagen o video del hero header del Home (y módulos). Cuando está set,
   *  reemplaza al default `/assets/home/header-bg.jpg` en TODOS los hero
   *  headers del kiosk (Dashboard, Listings, Events, etc.). */
  homeHero: z
    .object({
      kind: z.enum(['image', 'video']).default('image'),
      src: z.string().default(''),
    })
    .optional(),
  /** Gradient overlay sobre el hero header — entre la foto y el logo+widgets.
   *  Valores hex 6 u 8 dígitos (alpha). Si está set, reemplaza el gradient
   *  hardcoded `rgba(0,79,139, *)` del header.tsx. */
  heroGradient: z
    .object({
      from: z
        .string()
        .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
        .default('#004f8be6'),
      to: z
        .string()
        .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
        .default('#004f8b00'),
      angle: z.number().min(0).max(360).default(180),
    })
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
  /**
   * Override de iconos Lucide por moduleKey (events, tickets, passes, trails, etc).
   * El operador escoge el icono desde el Modules tab. Si vacío/undefined,
   * se usa el icono canónico de `MODULE_ICONS`.
   */
  iconOverrides: z.record(z.string(), z.string()).default({}),
  /**
   * Imágenes custom (data URL o path) por moduleKey. Sobrescribe ambos
   * `iconOverrides` y el icono canónico cuando está poblado para un key.
   * Mismas dimensiones que un Lucide para coherencia visual.
   */
  customIcons: z.record(z.string(), z.string()).default({}),
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
  { key: 'itinerary-builder', label: 'Trip Planner', enabled: true },
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
    iconOverrides: {},
    customIcons: {},
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Billboard (idle / splash)                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export const BILLBOARD_VARIANTS = [0, 1, 2, 3] as const;
export type BillboardVariant = (typeof BILLBOARD_VARIANTS)[number];

export const BILLBOARD_LOGO_SIZES = ['S', 'M', 'L', 'XL'] as const;
export type BillboardLogoSize = (typeof BILLBOARD_LOGO_SIZES)[number];

/**
 * Mapa logoSize → altura en px del logo idle del Billboard.
 * `XL` = doble de `L` para clientes con logos largos o pictogramas que se
 * benefician de un hero idle mucho más prominente (pedido del operador).
 */
export const BILLBOARD_LOGO_SIZE_PX: Record<BillboardLogoSize, number> = {
  S: 80,
  M: 128,
  L: 180,
  XL: 360,
};

/**
 * Mapa footerLogoSize → altura en px del logo del footer del Billboard.
 * Más pequeño que el hero (BILLBOARD_LOGO_SIZE_PX) — el SVG original era 65px.
 * `XL` = doble de `L` (96 → 192) por simetría con el hero, aunque en la
 * mayoría de variants el footer XL queda apretado contra el "Powered by".
 */
export const BILLBOARD_FOOTER_LOGO_SIZE_PX: Record<BillboardLogoSize, number> = {
  S: 48,
  M: 65,
  L: 96,
  XL: 192,
};

/**
 * Settings específicos del variant 0 ("Dark Hero"): permite personalizar
 * el background (imagen o video), el botón TOUCH HERE y la opacidad del
 * overlay sin tocar código.
 */
export const BillboardB0Schema = z.object({
  background: z
    .object({
      /** `image` o `video`. Video se renderiza con `autoplay loop muted`. */
      type: z.enum(['image', 'video']).default('image'),
      /** Path absoluto al asset (ej. `/assets/billboard-0/hero.jpg`). */
      src: z.string().default('/assets/billboard-0/hero.jpg'),
    })
    .default({ type: 'image', src: '/assets/billboard-0/hero.jpg' }),
  touchHere: z
    .object({
      /** Texto del botón. Si vacío, usa la key i18n `billboard_touch_here`. */
      label: z.string().default(''),
      /** True = renderiza en 2 líneas (separa por espacio o por \n).
       *  False = una sola línea ancha. */
      twoLines: z.boolean().default(true),
      /** Ancho del botón en px (default SVG: 548). */
      width: z.number().int().min(280).max(900).default(548),
      /** Alto del botón en px (default SVG: 342). */
      height: z.number().int().min(120).max(500).default(342),
      /** Tamaño de fuente en px. Default SVG: 90. */
      fontSize: z.number().int().min(36).max(160).default(90),
    })
    .default({ label: '', twoLines: true, width: 548, height: 342, fontSize: 90 }),
  /** Opacidad del overlay oscuro entre background y contenido. 0 = sin
   *  overlay, 1 = totalmente negro. Útil cuando el bg es muy claro y el
   *  logo blanco se pierde. (Legacy: si overlay.mode no se setea, este
   *  valor sigue mandando con color #000.) */
  overlayOpacity: z.number().min(0).max(1).default(0),
  /** Overlay configurable: solid color o gradient. Si está poblado,
   *  reemplaza el comportamiento de overlayOpacity. */
  overlay: z
    .object({
      mode: z.enum(['solid', 'gradient']).default('solid'),
      /** Color hex del modo solid (ej. '#000000'). */
      color: z
        .string()
        .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
        .default('#000000'),
      /** Opacidad 0-1 del modo solid. */
      opacity: z.number().min(0).max(1).default(0),
      /** Configuración del gradient cuando mode='gradient'. */
      gradient: z
        .object({
          from: z
            .string()
            .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
            .default('#000000'),
          to: z
            .string()
            .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
            .default('#00000000'),
          /** Ángulo en grados del linear-gradient. 180 = top→bottom. */
          angle: z.number().min(0).max(360).default(180),
        })
        .default({ from: '#000000', to: '#00000000', angle: 180 }),
    })
    .default({
      mode: 'solid',
      color: '#000000',
      opacity: 0,
      gradient: { from: '#000000', to: '#00000000', angle: 180 },
    }),
});

export type BillboardB0Config = z.infer<typeof BillboardB0Schema>;

export const DEFAULT_BILLBOARD_B0: BillboardB0Config = {
  background: { type: 'image', src: '/assets/billboard-0/hero.jpg' },
  touchHere: { label: '', twoLines: true, width: 548, height: 342, fontSize: 90 },
  overlayOpacity: 0,
  overlay: {
    mode: 'solid',
    color: '#000000',
    opacity: 0,
    gradient: { from: '#000000', to: '#00000000', angle: 180 },
  },
};

/**
 * Settings idle compartidos por TODOS los variants (B0/B1/B2/B3): background
 * editable + Touch Here button + overlay. Antes solo B0 tenía este shape;
 * ahora B1/B2/B3 también lo usan para que el operador pueda customizar de
 * forma consistente. Cada variant runtime aplica los campos que tienen
 * sentido en su layout (algunos como width/height del button no aplican a
 * todos los layouts y se ignoran silenciosamente).
 */
export const BillboardVariantSettingsSchema = BillboardB0Schema;
export type BillboardVariantSettings = BillboardB0Config;

/** Alias retrocompat para el shape solo-background (deprecated, usar VariantSettings). */
export type BillboardVariantBackground = { background?: { type: 'image' | 'video'; src: string } };

/**
 * Background compartido por las 4 variants del idle (B0/B1/B2/B3). El operador
 * sube UNA imagen/video y se aplica al hero de los 4 layouts. Para overrides
 * por variant existe `b{N}.background` (legacy/back-compat) — el runtime
 * prefiere el shared cuando está poblado.
 */
export const BillboardBackgroundSchema = z.object({
  type: z.enum(['image', 'video']).default('image'),
  src: z.string().default('/assets/billboard-0/hero.jpg'),
});

export const BillboardSchema = z.object({
  /** Cuál de los 4 layouts del Billboard idle se muestra. */
  variant: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  /** Segundos sin actividad en /home antes del aviso de timeout. */
  idleTimeoutSec: z.number().int().min(15).max(600).default(60),
  /**
   * Background compartido por las 4 variants idle. Cambia este campo y los
   * 4 layouts heredan la misma imagen/video de hero. Tiene prioridad sobre
   * `b{N}.background` (legacy).
   */
  background: BillboardBackgroundSchema.default({
    type: 'image',
    src: '/assets/billboard-0/hero.jpg',
  }),
  /**
   * Tamaño del logo idle en B0/B2/B3 (B1 no muestra logo idle grande).
   * Mapeo: S=80px, M=128px (default), L=180px.
   */
  logoSize: z.enum(BILLBOARD_LOGO_SIZES).default('M'),
  /**
   * Tamaño del logo del footer en TODAS las variantes idle. Independiente
   * de `logoSize` (que aplica al hero principal). Mapeo: S=80px, M=128px,
   * L=180px (mismo enum que el hero).
   */
  footerLogoSize: z.enum(BILLBOARD_LOGO_SIZES).default('M'),
  /**
   * Posición absoluta (top-left) del slot del logo idle dentro del canvas
   * 1080×1920. Solo aplica a las variantes con logo grande (B0/B2/B3).
   * Opcional — si `undefined`, cada variant renderiza el logo en su
   * posición histórica del SVG original. El operador puede arrastrar el
   * logo via el 9-point picker o los sliders del editor.
   *
   * El slot ocupa `694×logoSize` independientemente de la posición — el
   * logo se mantiene contenido (object-fit) dentro de ese rectángulo.
   */
  logoPosition: z
    .object({
      x: z.number().int().min(0).max(1080),
      y: z.number().int().min(0).max(1920),
    })
    .optional(),
  /**
   * Lista ordenada de IDs de módulos a mostrar en los slots del Billboard
   * (B1/B2/B3 — B0 no tiene grid). Máximo 4. Los IDs corresponden a
   * `modules.tiles[].key` activos en el Modules tab.
   */
  modules: z.array(z.string()).max(4).default([]),
  /** Settings idle del variant 0 (Dark Hero). Mismo shape que el resto. */
  b0: BillboardVariantSettingsSchema.optional(),
  /** Settings idle del variant 1 (Grid + Hero). */
  b1: BillboardVariantSettingsSchema.optional(),
  /** Settings idle del variant 2 (Hero + Carousel). */
  b2: BillboardVariantSettingsSchema.optional(),
  /** Settings idle del variant 3 (Banner + 4 cards). */
  b3: BillboardVariantSettingsSchema.optional(),
});

export type BillboardConfig = z.infer<typeof BillboardSchema>;

export const DEFAULT_BILLBOARD: BillboardConfig = {
  variant: 0,
  idleTimeoutSec: 60,
  logoSize: 'M',
  footerLogoSize: 'M',
  modules: [],
  // Background unificado en las 4 variantes para consistencia visual al
  // alternar entre ellas. Editado desde la sección "Background (shared)" del
  // editor. Los `b{N}` quedan para overlay/touchHere/etc per-variant.
  background: { type: 'image', src: '/assets/billboard-0/hero.jpg' },
  b0: DEFAULT_BILLBOARD_B0,
  b1: { ...DEFAULT_BILLBOARD_B0 },
  b2: { ...DEFAULT_BILLBOARD_B0 },
  b3: { ...DEFAULT_BILLBOARD_B0 },
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
    labels: z.object({ low: z.string().max(64), high: z.string().max(64) }).optional(),
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
const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be ISO date (yyyy-mm-dd)');

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
  tiktok: z.string().max(64).optional(),
  youtube: z.string().max(64).optional(),
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
  /**
   * Zoom default de la cámara (1.0 = sin zoom, 0.5 = más alejado / cabe
   * más gente, 2.0 = más cerca). El runtime aplica `transform: scale()`
   * al `<video>` element del Photo Booth. Útil cuando el kiosk está
   * físicamente muy cerca del usuario y se necesita encuadrar a varias
   * personas sin que se alejen tanto.
   */
  cameraZoom: z.number().min(0.5).max(2).optional(),
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
  backgrounds: [{ id: 'bg-original', image: '', label: 'Original' }],
  frames: [],
  filters: [
    { id: 'filter-none', label: 'Original', cssFilter: 'none' },
    { id: 'filter-bw', label: 'B&W', cssFilter: 'grayscale(1)' },
    { id: 'filter-warm', label: 'Warm', cssFilter: 'saturate(1.2) contrast(1.05)' },
  ],
  stickers: [],
  timer: { enabled: true, default: 5, options: [3, 5, 10] },
  edgeFeather: 3,
  cameraZoom: 1,
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
  /**
   * Imagen completa del pin (círculo + pointer). Empty string permitido
   * para clientes nuevos que aún no han subido assets — el runtime kiosk
   * usa un fallback en ese caso.
   */
  image: z.string(),
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
  pinCatalog: [{ id: 'pin-default', image: '', label: 'Default' }],
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

const PriceRangeSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

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
  /**
   * Imagen custom (data URL o path) que sustituye el iconKey de Lucide cuando
   * está poblado. Permite al operador subir su propio SVG/PNG con las
   * mismas dimensiones que los Lucide (24×24 a 32×32 idealmente).
   */
  customIcon: z.string().max(200000).optional(),
  /** Master toggle de visibilidad del módulo. */
  enabled: z.boolean().default(true),
  /** Heroimage + taxonomies + items. */
  catalog: ListingsCatalogSchema,
});

export type ListingsCatalogEntry = z.infer<typeof ListingsCatalogEntrySchema>;

export const ListingsModuleSchema = z.array(ListingsCatalogEntrySchema).superRefine((arr, ctx) => {
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
      {
        key: 'restaurants',
        label: 'Restaurants',
        iconKey: 'UtensilsCrossed',
        enabled: true,
        catalog: grab('restaurants'),
      },
      {
        key: 'things-to-do',
        label: 'Things to Do',
        iconKey: 'Sparkles',
        enabled: true,
        catalog: grab('thingsToDo'),
      },
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
  const slug =
    base
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
 * COPIA los items para que el operador no arranque vacío. El slug se deriva
 * del nuevo label "(Copy)" para evitar slugs como `stay-2` cuando el operador
 * intenta crear "Shopping" duplicando Stay y renombrando.
 */
export function duplicateListingEntry(
  source: ListingsCatalogEntry,
  existing: ListingsModule,
): ListingsCatalogEntry {
  const newLabel = `${source.label} Copy`;
  const newKey = uniqueListingKey(existing, newLabel);
  return {
    key: newKey,
    label: newLabel,
    iconKey: source.iconKey,
    enabled: true,
    catalog: {
      heroImage: source.catalog.heroImage,
      subcategories: [...source.catalog.subcategories],
      features: [...source.catalog.features],
      // Clonar los items con nuevos slugs (cada listing.slug debe ser único
      // dentro del KioskConfig). Cambiamos prefijo por la nueva key.
      listings: source.catalog.listings.map((l, i) => ({
        ...l,
        slug: `${newKey}-${String(i + 1).padStart(3, '0')}`,
      })),
    },
  };
}

/**
 * Crea un listing entry con label dado por el usuario. La key se deriva
 * del label en kebab-case y se hace único. Si hay listings modules existentes,
 * el catálogo se hidrata con los items del primero (cambiándoles los slugs)
 * para que el operador no arranque con la lista vacía. Esto cumple el
 * requerimiento "auto-cargar listings relacionados" cuando se añade un módulo.
 */
export function makeBlankListingEntry(
  label: string,
  existing: ListingsModule,
  iconKey = 'UtensilsCrossed',
): ListingsCatalogEntry {
  const trimmed = label.trim() || 'New module';
  const key = uniqueListingKey(existing, trimmed);
  // Template = "Things to Do" (más genérico que Restaurants, donde
  // datos como precio/menú salen raros en categorías custom como
  // "Shopping" o "Party"). Fallback al primer module si no existe.
  const template = existing.find((e) => e.key === 'things-to-do') ?? existing[0];
  const catalog = template
    ? {
        heroImage: template.catalog.heroImage,
        subcategories: [...template.catalog.subcategories],
        features: [...template.catalog.features],
        listings: template.catalog.listings.map((l, i) => ({
          ...l,
          slug: `${key}-${String(i + 1).padStart(3, '0')}`,
        })),
      }
    : { ...EMPTY_LISTINGS_CATALOG };
  return { key, label: trimmed, iconKey, enabled: true, catalog };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Events                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const DateIsoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD.' });

const TimeHmSchema = z.string().regex(/^\d{2}:\d{2}$/, { message: 'time must be HH:MM (24h).' });

const PriceBandSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

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
  trailTypes: z.array(TrailTypeSchema).default(['Loop', 'Out & Back', 'Point to Point']),
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
/*  Trip Builder (Itinerary)                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export const ItineraryAiOptionSchema = z.object({
  value: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  /** Solo aplica a la question `key === 'duration'` — número de días sugeridos. */
  days: z.number().int().min(0).max(30).optional(),
  /**
   * Categoría del kiosk a la que apunta esta option (e.g. 'restaurants',
   * 'things-to-do', 'trails', 'events'). Usada por el AI Itinerary para
   * filtrar resultados a un módulo específico cuando el usuario marca
   * esta option.
   */
  categoryKey: z.string().max(64).optional(),
  /** Subcategoría dentro del categoryKey elegido (e.g. 'Hiking', 'Mexican'). */
  subcategoryKey: z.string().max(120).optional(),
});

export type ItineraryAiOption = z.infer<typeof ItineraryAiOptionSchema>;

export const ITINERARY_QUESTION_TYPES = ['single', 'multi'] as const;
export type ItineraryQuestionType = (typeof ITINERARY_QUESTION_TYPES)[number];

export const ItineraryAiQuestionSchema = z.object({
  /** Estable per-instance — sólo vive en KV/Studio, NO se publica a fs. */
  id: z.string().min(1).max(64),
  /** Slug semántico del wizard ('duration', 'travel_type', 'activities', …). */
  key: z.string().min(1).max(64),
  kicker: z.string().max(80).default(''),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(200).optional(),
  type: z.enum(ITINERARY_QUESTION_TYPES),
  options: z.array(ItineraryAiOptionSchema).min(1).max(20),
});

export type ItineraryAiQuestion = z.infer<typeof ItineraryAiQuestionSchema>;

export const ItineraryLocalListingStopSchema = z.object({
  slug: z.string().min(1).max(120),
  kind: z.string().min(1).max(64),
  moduleSlug: z.string().min(1).max(120),
});

export const ItineraryLocalListingSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  image: z.string().default(''),
  stops: z.array(ItineraryLocalListingStopSchema).default([]),
});

export type ItineraryLocalListing = z.infer<typeof ItineraryLocalListingSchema>;

export const ItineraryBuilderSchema = z.object({
  /**
   * Toggle del flujo AI del Trip Planner. Mapea a `ai.enabled` en
   * `features.home.itinerary.ai.enabled`. Cuando es false, el botón
   * "AI Itinerary" del welcome popup se oculta y los visitantes solo
   * pueden construir el itinerario manualmente. El módulo Trip Planner
   * sigue activo (controlado por systemModules.itineraryBuilder).
   */
  aiEnabled: z.boolean().default(true),
  loadingImage: z.string().default(''),
  defaultTitleTemplate: z.string().max(200).default(''),
  /**
   * Hero image compartida por TODAS las questions del wizard. Antes vivía
   * por question (legacy `question.hero_image`). Mantenemos el shape legacy
   * al publicar copiando este valor a cada question's `hero_image`.
   */
  wizardHeroImage: z.string().default(''),
  questions: z.array(ItineraryAiQuestionSchema).max(8).default([]),
  /** Itinerarios pre-armados curados — passthrough en Studio v1 (sin UI). */
  localListings: z.array(ItineraryLocalListingSchema).default([]),
});

export type ItineraryBuilderConfig = z.infer<typeof ItineraryBuilderSchema>;

export const DEFAULT_ITINERARY_BUILDER: ItineraryBuilderConfig = {
  aiEnabled: true,
  loadingImage: '',
  defaultTitleTemplate: '',
  wizardHeroImage: '',
  questions: [],
  localListings: [],
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Integrations (weather, mapbox, analytics, external API)                  */
/* ────────────────────────────────────────────────────────────────────────── */

export const WEATHER_PROVIDERS = ['open-meteo', 'openweather'] as const;
export type WeatherProvider = (typeof WEATHER_PROVIDERS)[number];

export const WEATHER_UNITS = ['metric', 'imperial'] as const;
export type WeatherUnits = (typeof WEATHER_UNITS)[number];

/**
 * Token OAuth de una plataforma social. `connected: false` = el operador
 * no completó el flow (o el token expiró sin refresh). El refresh token,
 * cuando aplica, se guarda en `refreshToken` y se usa en `/api/oauth/{platform}/refresh`.
 *
 * Hallazgo #13 audit Studio (2026-05-05). Schema preparado para activación
 * — endpoints OAuth pendientes de credenciales de developer (ver doc handoff).
 */
export const SocialOauthTokenSchema = z.object({
  connected: z.boolean().default(false),
  /** Access token (ofuscado en UI; nunca cruza al iframe del preview). */
  accessToken: z.string().default(''),
  /** Refresh token (cuando la plataforma lo soporta — IG, FB largos, X). */
  refreshToken: z.string().default(''),
  /** ISO timestamp de expiración del access token. */
  expiresAt: z.string().default(''),
  /** Scopes concedidos (auditing). */
  scopes: z.array(z.string()).default([]),
  /** Username/handle conectado (para mostrar en UI: "@miusuario"). */
  handle: z.string().max(128).default(''),
});
export type SocialOauthToken = z.infer<typeof SocialOauthTokenSchema>;

export function defaultSocialOauthToken(): SocialOauthToken {
  return {
    connected: false,
    accessToken: '',
    refreshToken: '',
    expiresAt: '',
    scopes: [],
    handle: '',
  };
}

export const IntegrationsConfigSchema = z.object({
  api: z
    .object({
      baseUrl: z.string().max(2048).default(''),
    })
    .default({ baseUrl: '' }),
  mapbox: z
    .object({
      token: z.string().max(2048).default(''),
    })
    .default({ token: '' }),
  analytics: z
    .object({
      gaId: z.string().max(64).default(''),
    })
    .default({ gaId: '' }),
  weather: z
    .object({
      provider: z.enum(WEATHER_PROVIDERS).default('open-meteo'),
      apiKey: z.string().max(256).default(''),
      city: z.string().max(120).default(''),
      units: z.enum(WEATHER_UNITS).default('metric'),
    })
    .default({ provider: 'open-meteo', apiKey: '', city: '', units: 'metric' }),
  /** Satisfi Labs — chatbot backend. No UI — only credentials stored for the runtime. */
  satisfi: z
    .object({
      apiKey: z.string().max(256).default(''),
      hubId: z.string().max(128).default(''),
    })
    .default({ apiKey: '', hubId: '' }),
  /** Tavus — replica/persona used by the AI Avatar module. */
  tavus: z
    .object({
      apiKey: z.string().max(256).default(''),
      replicaId: z.string().max(128).default(''),
      personaId: z.string().max(128).default(''),
    })
    .default({ apiKey: '', replicaId: '', personaId: '' }),
  /** Bandwango — partner data feed (passes, deals, listings). */
  bandwango: z
    .object({
      apiKey: z.string().max(256).default(''),
      partnerId: z.string().max(128).default(''),
    })
    .default({ apiKey: '', partnerId: '' }),
  /** CrowdRiff — social media aggregator that powers the Social Wall. */
  crowdriff: z
    .object({
      apiKey: z.string().max(256).default(''),
      galleryId: z.string().max(128).default(''),
    })
    .default({ apiKey: '', galleryId: '' }),
  /** Viator — tours & tickets feed. */
  viator: z
    .object({
      apiKey: z.string().max(256).default(''),
      partnerId: z.string().max(128).default(''),
    })
    .default({ apiKey: '', partnerId: '' }),
  /**
   * OAuth tokens per social platform — usados para que el Social Wall
   * jale feeds reales (en lugar del aggregator CrowdRiff). Hallazgo #13
   * del audit (2026-05-05).
   *
   * El flow OAuth real está bloqueado por infra externa: cada plataforma
   * requiere registro de app de developer + scopes + manejo de refresh
   * tokens. Ver `.planning/2026-05-06-social-oauth-handoff.md` para la
   * lista de credenciales que el operador (Rubén) debe crear.
   *
   * El schema vive aquí para que el endpoint `/api/oauth/[platform]/callback`
   * (cuando se implemente) tenga dónde persistir los tokens y el editor
   * sepa el "connection state" del kiosk.
   */
  socialOauth: z
    .object({
      instagram: SocialOauthTokenSchema,
      facebook: SocialOauthTokenSchema,
      tiktok: SocialOauthTokenSchema,
      x: SocialOauthTokenSchema,
    })
    .default({
      instagram: defaultSocialOauthToken(),
      facebook: defaultSocialOauthToken(),
      tiktok: defaultSocialOauthToken(),
      x: defaultSocialOauthToken(),
    }),
});
export type IntegrationsConfig = z.infer<typeof IntegrationsConfigSchema>;

export function defaultIntegrations(): IntegrationsConfig {
  return {
    api: { baseUrl: '' },
    mapbox: { token: '' },
    analytics: { gaId: '' },
    weather: { provider: 'open-meteo', apiKey: '', city: '', units: 'metric' },
    satisfi: { apiKey: '', hubId: '' },
    tavus: { apiKey: '', replicaId: '', personaId: '' },
    bandwango: { apiKey: '', partnerId: '' },
    crowdriff: { apiKey: '', galleryId: '' },
    viator: { apiKey: '', partnerId: '' },
    socialOauth: {
      instagram: defaultSocialOauthToken(),
      facebook: defaultSocialOauthToken(),
      tiktok: defaultSocialOauthToken(),
      x: defaultSocialOauthToken(),
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Ads (advertisements — popups, hero banners, bottom strips)               */
/* ────────────────────────────────────────────────────────────────────────── */

export const AD_KINDS = ['popup', 'hero', 'bottom'] as const;
export type AdKind = (typeof AD_KINDS)[number];

export const AD_THEMES = ['dark', 'light'] as const;
export type AdTheme = (typeof AD_THEMES)[number];

export const AdSchema = z.object({
  id: SlugStringSchema,
  kind: z.enum(AD_KINDS),
  image: z.string().max(2048).default(''),
  alt: z.string().max(280).optional(),
  routes: z.array(z.string().min(1).max(280)).default([]),
  enabled: z.boolean().default(true),
  theme: z.enum(AD_THEMES).default('dark'),
});
export type Ad = z.infer<typeof AdSchema>;

function uniqueById<T extends { id: string }>(arr: T[], ctx: z.RefinementCtx) {
  const seen = new Set<string>();
  arr.forEach((item, idx) => {
    if (seen.has(item.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [idx, 'id'],
        message: `duplicate id "${item.id}" — must be unique.`,
      });
    }
    seen.add(item.id);
  });
}

export const AdsModuleSchema = z.object({
  ads: z.array(AdSchema).superRefine(uniqueById).default([]),
});
export type AdsModule = z.infer<typeof AdsModuleSchema>;

export function defaultAds(): AdsModule {
  return { ads: [] };
}

export function makeBlankAd(kind: AdKind = 'popup'): Ad {
  return {
    id: `ad-${Date.now()}`,
    kind,
    image: '',
    alt: '',
    routes: [],
    enabled: true,
    theme: 'dark',
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  i18n bundle (vive en KV bajo `i18n:<slug>`, separado del KioskConfig)    */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Locales por defecto al crear un kiosk nuevo. El operador puede añadir
 * cualquier ISO 639-1 vía el AddLanguageModal del Studio. **`en` es
 * canonical** y no se puede borrar (enforced en UI + backend).
 */
export const DEFAULT_LOCALES = ['en', 'es', 'fr', 'de', 'pt', 'ja'] as const;

/**
 * @deprecated Usar `DEFAULT_LOCALES` para factory defaults o `Object.keys(bundle)`
 *             para iterar locales reales del kiosk activo. `LOCALES` solo se
 *             mantiene como alias de back-compat — el sistema soporta locales
 *             dinámicos desde 2026-05.
 */
export const LOCALES = DEFAULT_LOCALES;

/**
 * Type loose: cualquier código ISO 639-1 (string). Antes era un union estricto
 * de los 6 default locales; ahora el operador puede añadir cualquier idioma.
 * Para validar formato ISO usar `LOCALE_CODE_REGEX` de `locale-catalog.ts`.
 */
export type Locale = string;

const LocaleStringsSchema = z.record(z.string(), z.string().max(2000));
export type LocaleStrings = z.infer<typeof LocaleStringsSchema>;

/**
 * Bundle dinámico: cualquier locale code es key válida. El kiosk runtime
 * (`i18n-provider.tsx`) ya itera con `Object.keys` y hace fallback a
 * `defaultLocale` y luego a `en` para keys missing.
 */
export const I18nBundleSchema = z.record(z.string(), LocaleStringsSchema);
export type I18nBundle = z.infer<typeof I18nBundleSchema>;

export function defaultI18nBundle(): I18nBundle {
  return { en: {}, es: {}, fr: {}, de: {}, pt: {}, ja: {} };
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

export const KIOSK_ORIENTATIONS = ['portrait', 'landscape', 'mobile-pwa'] as const;
export type KioskOrientation = (typeof KIOSK_ORIENTATIONS)[number];

/**
 * Dimensiones canónicas de cada orientación. Usadas por el PreviewPanel del
 * Studio y por el KioskCanvas del runtime para enforcer el viewport.
 */
export const ORIENTATION_DIMENSIONS: Record<KioskOrientation, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1920 },
  landscape: { w: 1920, h: 1080 },
  // iPhone 14 Pro estándar (393×852 → redondeado). El runtime PWA es
  // responsive desde aquí hacia abajo (small phones se escalan).
  'mobile-pwa': { w: 390, h: 844 },
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Map module                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

/** Source lógico del pin custom — coincide con MapSource del kiosk runtime. */
export const MapSourceSchema = z.enum(['restaurants', 'things-to-do', 'stay', 'events']);
export type MapSourceKey = z.infer<typeof MapSourceSchema>;

/** Pin fijo añadido por el operador (no derivado de listings). */
export const MapCustomPinSchema = z.object({
  id: ShortIdSchema,
  label: z.string().min(1).max(120),
  /** Categoría del pin — controla el color y, si no hay `iconKey`, el icono. */
  source: MapSourceSchema.default('things-to-do'),
  /**
   * Icono del catálogo extendido (`shopping`, `coffee`, `bar`, `hospital`,
   * `museum`, `bus`, `beach`, `info`, `parking`, `star`). Si vacío, se usa
   * el icono canónico de la categoría (`source`).
   */
  iconKey: z.string().max(32).default(''),
  coords: CoordsSchema,
  /** Dirección humanizable opcional (se muestra en el bubble). */
  address: z.string().max(280).default(''),
});

/** Body por default del Map welcome popup. Se usa como fallback runtime
 *  cuando el operador no ha seteado un body custom (kiosks viejos en KV
 *  guardaron `body: ''`). Importable por componentes para renderizarlo
 *  cuando el body merged sale vacío. */
export const DEFAULT_MAP_WELCOME_BODY =
  'Tap a pin to see details — restaurants, things to do, places to stay and upcoming events near you.';

export const MapWelcomeCopySchema = z.object({
  title: z.string().max(160).default('Welcome to {client} Map'),
  subtitle: z.string().max(160).default('Powered by Google Maps'),
  body: z.string().max(600).default(DEFAULT_MAP_WELCOME_BODY),
  cta: z.string().max(64).default('Start'),
});

export const MapChipsSchema = z.object({
  play: z.string().max(48).default('Things to Do'),
  eat: z.string().max(48).default('Restaurants'),
  stay: z.string().max(48).default('Stay'),
  events: z.string().max(48).default('Events'),
});

export const MapPinSizeSchema = z.enum(['S', 'M', 'L']);
export type MapPinSize = z.infer<typeof MapPinSizeSchema>;

/** Multiplicador `icon-size` que aplica Mapbox al pin SVG default 140×188. */
export const MAP_PIN_SIZE_SCALE: Record<MapPinSize, number> = {
  S: 0.75,
  M: 1.0,
  L: 1.3,
};

/** Override de icono por categoría — vacío = icono canónico de la categoría. */
export const MapCategoryIconsSchema = z.object({
  restaurants: z.string().max(32).default(''),
  'things-to-do': z.string().max(32).default(''),
  stay: z.string().max(32).default(''),
  events: z.string().max(32).default(''),
});

export const MapSchema = z.object({
  /** Centro inicial del mapa al abrir el módulo. Si vacío usa `client.coords`. */
  defaultCenter: CoordsSchema.optional(),
  /** Zoom inicial (1–22, default 13 = ciudad). */
  defaultZoom: z.number().min(1).max(22).default(13),
  /** Ventana de eventos a mostrar (días desde hoy). */
  eventsWindowDays: z.number().int().min(1).max(60).default(7),
  /** Tamaño global de TODOS los pins (canónicos + custom). */
  pinSize: MapPinSizeSchema.default('M'),
  /** Override del icono por categoría (escoger del catálogo extendido). */
  categoryIcons: MapCategoryIconsSchema.default({
    restaurants: '',
    'things-to-do': '',
    stay: '',
    events: '',
  }),
  /** Labels de los chips de categoría (sobre los 4 sources canónicos). */
  chips: MapChipsSchema.default({
    play: 'Things to Do',
    eat: 'Restaurants',
    stay: 'Stay',
    events: 'Events',
  }),
  /** Welcome popup al abrir el módulo. Si todos los campos están vacíos, no se muestra. */
  welcomeCopy: MapWelcomeCopySchema.default({
    title: 'Welcome to {client} Map',
    subtitle: 'Powered by Google Maps',
    body: DEFAULT_MAP_WELCOME_BODY,
    cta: 'Start',
  }),
  /** Pins fijos custom (no derivados de listings). Se añaden al canvas como pins extra. */
  customPins: z.array(MapCustomPinSchema).default([]),
});

export type MapConfig = z.infer<typeof MapSchema>;
export type MapCustomPin = z.infer<typeof MapCustomPinSchema>;

export const DEFAULT_MAP: MapConfig = {
  defaultZoom: 13,
  eventsWindowDays: 7,
  pinSize: 'M',
  categoryIcons: { restaurants: '', 'things-to-do': '', stay: '', events: '' },
  chips: { play: 'Things to Do', eat: 'Restaurants', stay: 'Stay', events: 'Events' },
  welcomeCopy: {
    title: 'Welcome to {client} Map',
    subtitle: 'Powered by Google Maps',
    body: DEFAULT_MAP_WELCOME_BODY,
    cta: 'Start',
  },
  customPins: [],
};

export const KioskConfigSchema = z.object({
  slug: SlugSchema,
  nombre: z.string().min(1).max(120),
  /**
   * Orientación primaria del kiosk — la que se renderiza por default al abrir
   * el editor. Internamente todos los clientes pueden exportarse en las 3
   * orientaciones (portrait/landscape/mobile-pwa); este campo solo controla
   * qué viewport se ve primero y qué bundle es el "canónico" del cliente.
   */
  orientation: z.enum(KIOSK_ORIENTATIONS).default('portrait'),
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
  /** Módulo Map — centro/zoom, welcome popup, chips, custom pins. */
  map: MapSchema.optional(),
  /** Módulo Trip Builder — toggle AI flow + questions del wizard + local_listings. */
  itineraryBuilder: ItineraryBuilderSchema.optional(),
  /** Sistema de ads (popups, hero banners, bottom strips) por ruta. */
  ads: AdsModuleSchema.optional(),
  /** Integraciones (weather, mapbox, analytics, external API). */
  integrations: IntegrationsConfigSchema.optional(),
  /**
   * Datos del cliente que se usan en el kiosk runtime: website (footer/share)
   * y location ("Davenport, FL"). El operador los introduce al crear el
   * kiosk; se pueden editar luego desde Branding.
   */
  clientInfo: z
    .object({
      website: z.string().max(2048).default(''),
      location: z.string().max(120).default(''),
      /**
       * Coords lat/lng resueltas por geocoding al crear el kiosk.
       * Se aplican a `client.coords` en el publish y centran el módulo
       * Map + tiles que muestran distance.
       */
      coords: z.object({ lat: z.number(), lng: z.number() }).optional(),
    })
    .optional(),
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
export function makeBlankConfig(
  slug: string,
  nombre: string,
  orientation: KioskOrientation = 'portrait',
): KioskConfig {
  return {
    slug,
    nombre,
    orientation,
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
    itineraryBuilder: structuredClone(DEFAULT_ITINERARY_BUILDER),
    ads: defaultAds(),
    integrations: defaultIntegrations(),
    currentVersion: 0,
  };
}
