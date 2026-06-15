import { z } from 'zod';

import { ItemSlugSchema, DirectionStepSchema, CoordsSchema, uniqueBySlug } from './primitives';

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
