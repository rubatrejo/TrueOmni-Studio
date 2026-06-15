import { z } from 'zod';

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
 * Mapa heroLogoSize → dimensiones (px) del slot del logo del Hero Header del
 * Home Dashboard (y módulos que heredan el header). Mantiene el ratio 4:1 del
 * slot original (360×90 = M, default). Escala el slot completo; el logo
 * (object-contain / preserveAspectRatio) se ajusta dentro alineado a la izq.
 */
export const HERO_LOGO_SIZE_PX: Record<BillboardLogoSize, { w: number; h: number }> = {
  S: { w: 280, h: 70 },
  M: { w: 360, h: 90 },
  L: { w: 480, h: 120 },
  XL: { w: 600, h: 150 },
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
      fontSize: z.number().int().min(24).max(220).default(90),
      /** True = texto en MAYÚSCULAS. False (default) = Title Case (primera
       *  letra de cada palabra en mayúscula). */
      uppercase: z.boolean().default(false),
    })
    .default({
      label: '',
      twoLines: true,
      width: 548,
      height: 342,
      fontSize: 90,
      uppercase: false,
    }),
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
  touchHere: { label: '', twoLines: true, width: 548, height: 342, fontSize: 90, uppercase: false },
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
   * Posición del logo del FOOTER ("Powered by") dentro del canvas
   * 1080×1920. Solo aplica al Variant 1 (B0 idle) que tiene footer
   * con layout absoluto — los demás variants usan flex layout y
   * ignoran este override. Default histórico SVG: `{ x: 60, y: 1823 }`
   * (el footer es la franja brand-primary 218px de alto bottom).
   */
  footerLogoPosition: z
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
