import { z } from 'zod';

import { ItemSlugSchema, uniqueBySlug } from './primitives';

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
