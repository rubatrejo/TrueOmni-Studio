import { z } from 'zod';

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
  /** Brand video del cliente (upload o YouTube URL). Source of truth en
   *  unified branding (`client:<slug>:branding.brandVideo`). El kiosk lo
   *  recibe vía sync para que el operador pueda seleccionarlo como Idle
   *  Background y Hero Header con un click. */
  brandVideo: z
    .object({
      kind: z.enum(['upload', 'youtube']).default('upload'),
      src: z.string().default(''),
    })
    .optional(),
  /** Idle background del Billboard — imagen, video o YouTube URL. Editado
   *  desde Branding → Media (4ta card) y desde el Billboard editor; el
   *  runtime billboard lo usa como override del default. */
  idleBackground: z
    .object({
      kind: z.enum(['image', 'video', 'youtube']).default('image'),
      src: z.string().default(''),
    })
    .optional(),
  /** Tamaño del logo del Hero Header del Home (S/M/L/XL). Escala el slot del
   *  logo del header (default M = 360×90), igual que el logo idle del
   *  Billboard. Si `undefined`, usa M. */
  heroLogoSize: z.enum(['S', 'M', 'L', 'XL']).optional(),
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
