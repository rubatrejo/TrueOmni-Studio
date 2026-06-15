import { z } from 'zod';

/**
 * Primitivas zod compartidas entre dominios del schema del Studio.
 * Extraídas del monolito `schema.ts` (F-QA-12). Internas a la carpeta
 * `schema/`: el barrel NO las re-exporta, así la API pública de
 * `@/lib/studio/schema` queda idéntica a antes del split.
 */

export const SlugStringSchema = z
  .string()
  .min(1)
  .max(96)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'must be lowercase letters/digits/hyphens');

export const ShortIdSchema = z.string().min(1).max(64);

export const CoordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/* ────────────────────────────────────────────────────────────────────────── */
/*  Catalog primitives compartidos                                           */
/* ────────────────────────────────────────────────────────────────────────── */

export const ItemSlugSchema = z
  .string()
  .min(1)
  .max(96)
  .regex(/^[a-z0-9][a-z0-9-]*$/, {
    message: 'item slug must be lowercase letters, digits and hyphens.',
  });

export const DirectionStepSchema = z.object({
  icon: z.string().max(32),
  distance: z.string().max(64),
  instruction: z.string().max(280),
});

export const PriceRangeSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

/** Ensure all `slug` values inside an array are unique. */
export function uniqueBySlug<T extends { slug: string }>(arr: T[], ctx: z.RefinementCtx) {
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
