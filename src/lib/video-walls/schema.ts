/**
 * Schema Zod del producto Video Walls.
 *
 * Diseño cliente-primero idéntico al de signage. **Reusa** los schemas
 * de branding, header, events, social, news, modules y schedule desde
 * `signage/schema.ts` (mismo shape de data — un cliente con ambos
 * productos activos comparte data via `loadVideoWallClient` que lee de
 * `signage:*` cuando existe).
 *
 * Lo único realmente distinto:
 *   1. `GridConfig` reemplaza `defaultOrientation`.
 *   2. `VideoWallTemplateSlot` ancla en celdas (no píxeles).
 *   3. `VideoWallConfig` carga `grid` además de playlist/settings.
 *   4. `VideoWallClientFile.walls[]` reemplaza `displays[]`.
 */
import { z } from 'zod';

import {
  SignageBrandingSchema,
  SignageEventSchema,
  SignageHeaderSchema,
  SignageLocationSchema,
  SignageNewsConfigSchema,
  SignageSlideScheduleSchema,
  SignageSlotConfigSchema,
  SignageSocialDataSchema,
} from '@/lib/signage/schema';

import { GRID_CONFIG_IDS } from './dimensions';

// ---------------------------------------------------------------------------
//  Settings + slide
// ---------------------------------------------------------------------------

export const VideoWallSettingsSchema = z.object({
  targetResolution: z.enum(['1080p', '4k']).default('1080p'),
  audio: z.boolean().default(false),
  defaultDurationMs: z.number().int().min(1000).max(600_000).default(7000),
  defaultTransition: z.enum(['cut', 'fade', 'slide-left', 'slide-up']).default('cut'),
  sleepSchedule: z
    .object({
      enabled: z.boolean(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
    })
    .optional(),
});
export type VideoWallSettings = z.infer<typeof VideoWallSettingsSchema>;

export const VideoWallSlideSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().min(1),
  slots: z.array(SignageSlotConfigSchema),
  durationMs: z.number().int().min(1000).max(600_000),
  schedule: SignageSlideScheduleSchema.default({ kind: 'always', hideOutsideSchedule: true }),
  transition: z.enum(['cut', 'fade', 'slide-left', 'slide-up']).optional(),
});
export type VideoWallSlide = z.infer<typeof VideoWallSlideSchema>;

// ---------------------------------------------------------------------------
//  Cliente + wall config
// ---------------------------------------------------------------------------

export const VideoWallClientFileSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  locale: z.enum(['en', 'es', 'fr', 'de', 'pt', 'ja']),
  timezone: z.string().min(1),
  location: SignageLocationSchema,
  website: z.string().url().optional(),
  branding: SignageBrandingSchema,
  header: SignageHeaderSchema,
  /** Slugs de los walls del cliente. Se resuelven por separado vía
   *  `loadVideoWall(clientSlug, wallSlug)`. */
  walls: z.array(z.string().min(1)),
});
export type VideoWallClientFile = z.infer<typeof VideoWallClientFileSchema>;

export const VideoWallClientResolvedSchema = VideoWallClientFileSchema.extend({
  events: z.array(SignageEventSchema),
  social: SignageSocialDataSchema,
  news: SignageNewsConfigSchema,
});
export type VideoWallClientResolved = z.infer<typeof VideoWallClientResolvedSchema>;

export const VideoWallConfigSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  /** Grid configuration fija. Ver `dimensions.ts` para canvas dims derivadas. */
  grid: z.enum(GRID_CONFIG_IDS),
  settings: VideoWallSettingsSchema,
  playlist: z.array(VideoWallSlideSchema).default([]),
  playlists: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        slides: z.array(VideoWallSlideSchema),
      }),
    )
    .optional(),
  activePlaylistId: z.string().optional(),
});
export type VideoWallConfig = z.infer<typeof VideoWallConfigSchema>;

// ---------------------------------------------------------------------------
//  Re-exports de los schemas compartidos para conveniencia
// ---------------------------------------------------------------------------

export {
  SignageBrandingSchema as VideoWallBrandingSchema,
  SignageEventSchema as VideoWallEventSchema,
  SignageHeaderSchema as VideoWallHeaderSchema,
  SignageLocationSchema as VideoWallLocationSchema,
  SignageModuleInstanceSchema as VideoWallModuleInstanceSchema,
  SignageNewsConfigSchema as VideoWallNewsConfigSchema,
  SignageSlideScheduleSchema as VideoWallSlideScheduleSchema,
  SignageSlotConfigSchema as VideoWallSlotConfigSchema,
  SignageSocialDataSchema as VideoWallSocialDataSchema,
} from '@/lib/signage/schema';

export type {
  SignageBranding as VideoWallBranding,
  SignageEvent as VideoWallEvent,
  SignageHeader as VideoWallHeader,
  SignageLocation as VideoWallLocation,
  SignageModuleInstance as VideoWallModuleInstance,
  SignageModuleKind as VideoWallModuleKind,
  SignageNewsConfig as VideoWallNewsConfig,
  SignageSlideSchedule as VideoWallSlideSchedule,
  SignageSlotConfig as VideoWallSlotConfig,
  SignageSocialData as VideoWallSocialData,
} from '@/lib/signage/schema';
