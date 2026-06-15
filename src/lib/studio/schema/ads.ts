import { z } from 'zod';

import { SlugStringSchema } from './primitives';

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
