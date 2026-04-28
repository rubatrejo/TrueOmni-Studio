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

export const BrandingSchema = z.object({
  primary: HexColor,
  secondary: HexColor,
  tertiary: HexColor,
  /** Path relativo a `clients/<slug>/assets/` o data URL si aún no se publicó. */
  logo: z.string().optional(),
  /** Path relativo a `clients/<slug>/assets/` para el favicon. */
  favicon: z.string().optional(),
  fonts: z
    .object({
      /** Fuente para titulares (h1/h2/h3 + CTAs). */
      display: z.string().default('Montserrat'),
      /** Fuente para body (texto general). */
      body: z.string().default('Open Sans'),
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
    currentVersion: 0,
  };
}
