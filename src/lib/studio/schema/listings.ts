import { z } from 'zod';

import {
  ItemSlugSchema,
  DirectionStepSchema,
  PriceRangeSchema,
  CoordsSchema,
  uniqueBySlug,
} from './primitives';

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
  /**
   * Foto por sub-categoría (name → URL/dataURL) para la pantalla de
   * sub-categorías del KIOSK. Mapa paralelo a `subcategories` (no cambia su
   * tipo string[]) para no romper filtros/propagación. La PWA tiene sus propias
   * fotos en `features.pwa.<module>.categories[].image`. Editable en el Studio.
   */
  subcategoryImages: z.record(z.string(), z.string()).optional(),
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
  /**
   * Marca que este módulo se alimenta de un feed de proveedor (contenido a
   * nivel cliente, ver `client-content-sync.ts`). Cuando es true, el editor de
   * listings por-producto lo muestra read-only — el contenido se gestiona desde
   * la tab "Data feeds". Default false = módulo manual editable como siempre.
   */
  feedConnected: z.boolean().optional(),
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
