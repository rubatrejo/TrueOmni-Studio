import { z } from 'zod';

import { ShortIdSchema } from './primitives';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Photo Booth                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

export const PhotoBoothBackgroundSchema = z.object({
  id: ShortIdSchema,
  /** Path o data URL. Vacío = sin reemplazo (foto original sin chroma). */
  image: z.string(),
  label: z.string().min(1).max(64),
  thumbnail: z.string().optional(),
});

export const PhotoBoothFrameSchema = z.object({
  id: ShortIdSchema,
  image: z.string(),
  label: z.string().min(1).max(64),
  thumbnail: z.string().optional(),
});

export const PhotoBoothFilterSchema = z.object({
  id: ShortIdSchema,
  label: z.string().min(1).max(64),
  /** Valor de `ctx.filter` / `style.filter`. Ej. "grayscale(1)". */
  cssFilter: z.string().min(1).max(280),
  thumbnail: z.string().optional(),
});

export const PhotoBoothStickerSchema = z.object({
  id: ShortIdSchema,
  /** PNG con transparencia (path o data URL). */
  image: z.string().min(1),
  label: z.string().min(1).max(64),
  /** Ancho default al añadir (px en sistema 1080×1920). */
  defaultWidth: z.number().int().min(50).max(800).optional(),
});

export const PhotoBoothTimerSchema = z.object({
  enabled: z.boolean(),
  default: z.number().int().min(0).max(60),
  options: z.array(z.number().int().min(0).max(60)).min(1).max(8),
});

export const PhotoBoothSocialSchema = z.object({
  x: z.string().max(64).optional(),
  facebook: z.string().max(64).optional(),
  instagram: z.string().max(64).optional(),
  tiktok: z.string().max(64).optional(),
  youtube: z.string().max(64).optional(),
});

export const PhotoBoothSchema = z.object({
  enabled: z.boolean(),
  backgrounds: z.array(PhotoBoothBackgroundSchema).min(1).max(50),
  frames: z.array(PhotoBoothFrameSchema).max(50),
  filters: z.array(PhotoBoothFilterSchema).max(50),
  stickers: z.array(PhotoBoothStickerSchema).max(50),
  timer: PhotoBoothTimerSchema.optional(),
  shareUrlTemplate: z.string().max(280).optional(),
  social: PhotoBoothSocialSchema.optional(),
  shareCardLogo: z.string().optional(),
  shareBackground: z.string().optional(),
  edgeFeather: z.number().int().min(0).max(20).optional(),
  /**
   * Zoom default de la cámara (1.0 = sin zoom, 0.5 = más alejado / cabe
   * más gente, 2.0 = más cerca). El runtime aplica `transform: scale()`
   * al `<video>` element del Photo Booth. Útil cuando el kiosk está
   * físicamente muy cerca del usuario y se necesita encuadrar a varias
   * personas sin que se alejen tanto.
   */
  cameraZoom: z.number().min(0.5).max(2).optional(),
});

export type PhotoBoothBackground = z.infer<typeof PhotoBoothBackgroundSchema>;
export type PhotoBoothFrame = z.infer<typeof PhotoBoothFrameSchema>;
export type PhotoBoothFilter = z.infer<typeof PhotoBoothFilterSchema>;
export type PhotoBoothSticker = z.infer<typeof PhotoBoothStickerSchema>;
export type PhotoBoothTimerConfig = z.infer<typeof PhotoBoothTimerSchema>;
export type PhotoBoothConfig = z.infer<typeof PhotoBoothSchema>;

let _photoBoothIdSeq = 0;
export function newPhotoBoothId(prefix = 'pb'): string {
  return `${prefix}-${Date.now().toString(36)}-${++_photoBoothIdSeq}`;
}

export const DEFAULT_PHOTO_BOOTH: PhotoBoothConfig = {
  enabled: true,
  backgrounds: [{ id: 'bg-original', image: '', label: 'Original' }],
  frames: [],
  filters: [
    { id: 'filter-none', label: 'Original', cssFilter: 'none' },
    { id: 'filter-bw', label: 'B&W', cssFilter: 'grayscale(1)' },
    { id: 'filter-warm', label: 'Warm', cssFilter: 'saturate(1.2) contrast(1.05)' },
  ],
  stickers: [],
  timer: { enabled: true, default: 5, options: [3, 5, 10] },
  edgeFeather: 3,
  cameraZoom: 1,
};
