import { z } from 'zod';

import { SlugStringSchema } from './primitives';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Deals                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

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
