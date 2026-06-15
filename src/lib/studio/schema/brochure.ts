import { z } from 'zod';

import { SlugStringSchema } from './primitives';

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
