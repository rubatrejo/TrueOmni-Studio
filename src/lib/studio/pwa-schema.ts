import { z } from 'zod';

/**
 * Schema Zod del slice `features.pwa` (F-PWA-6). Estrategia permisiva: casi todo
 * `.optional()` y `.passthrough()` por slice, para validar forma sin rechazar
 * configs ya guardados en KV con campos extra. Se valida en detalle solo los 5
 * slices que el editor PWA muta con add/remove (F-PWA-5); el resto pasa tal cual.
 * Endurecer (campos desconocidos → error) es trabajo posterior.
 */

const Url = z.string().trim().url().or(z.literal('')); // permite vaciar el campo

// ── Scavenger Hunt ─────────────────────────────────────────────
const ScavengerTaskSchema = z
  .object({
    slug: z.string().min(1),
    type: z.enum(['photo', 'checkin', 'question']),
    name: z.string(),
    image: z.string().optional().default(''),
    address: z.string().optional(),
    coords: z.object({ lat: z.number(), lng: z.number() }),
    description: z.string().optional().default(''),
    directionsUrl: z.string().optional(),
    checkinRadius: z.number().min(0).optional(),
    question: z.string().optional(),
    options: z.array(z.string()).optional(),
    correctIndex: z.number().min(0).optional(),
  })
  .passthrough();

const ScavengerHuntSchema = z
  .object({
    slug: z.string().min(1),
    name: z.string(),
    image: z.string().optional().default(''),
    avatar: z.string().optional().default(''),
    taskCount: z.number().min(0).optional().default(0),
    tasks: z.array(ScavengerTaskSchema).default([]),
  })
  .passthrough();

export const PwaScavengerHuntConfigSchema = z
  .object({ hunts: z.array(ScavengerHuntSchema).optional() })
  .passthrough();

// ── Wayfinding ─────────────────────────────────────────────────
const WayfindingPointSchema = z.object({ x: z.number(), y: z.number() });

const WayfindingAmenitySchema = z
  .object({
    slug: z.string().min(1),
    name: z.string(),
    image: z.string().optional().default(''),
    destination: WayfindingPointSchema.optional().default({ x: 50, y: 50 }),
    routePoints: z.array(WayfindingPointSchema).default([]),
    steps: z
      .array(
        z.object({
          icon: z.enum(['location', 'left', 'right', 'straight', 'destination']),
          text: z.string(),
        }),
      )
      .default([]),
  })
  .passthrough();

const WayfindingFloorSchema = z
  .object({
    key: z.string().min(1),
    label: z.string(),
    floorPlanImage: z.string().optional().default(''),
    origin: WayfindingPointSchema.optional().default({ x: 50, y: 50 }),
    amenities: z.array(WayfindingAmenitySchema).default([]),
  })
  .passthrough();

export const PwaWayfindingConfigSchema = z
  .object({ floors: z.array(WayfindingFloorSchema).optional() })
  .passthrough();

// ── Notifications ──────────────────────────────────────────────
const PwaNotificationSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(['event', 'deal', 'info', 'alert']),
    title: z.string(),
    body: z.string().optional().default(''),
    image: z.string().optional(),
    timestamp: z.string(),
    action: z.object({ label: z.string(), href: z.string() }).optional(),
  })
  .passthrough();

export const PwaNotificationsConfigSchema = z
  .object({ seed: z.array(PwaNotificationSchema).optional() })
  .passthrough();

// ── Profile ────────────────────────────────────────────────────
const PwaProfileFavoriteSchema = z
  .object({
    title: z.string(),
    subcategory: z.string().optional().default(''),
    distance: z.string().optional().default(''),
    hours: z.string().optional().default(''),
    image: z.string().optional().default(''),
  })
  .passthrough();

const PwaProfileEventSchema = z
  .object({
    title: z.string(),
    time: z.string().optional().default(''),
    weekday: z.string().optional().default(''),
    day: z.string().optional().default(''),
    image: z.string().optional().default(''),
    accent: z.enum(['brand', 'pwa']).optional().default('brand'),
  })
  .passthrough();

export const PwaProfileConfigSchema = z
  .object({
    favorites: z
      .object({ items: z.array(PwaProfileFavoriteSchema).optional() })
      .passthrough()
      .optional(),
    upcomingEvents: z
      .object({ items: z.array(PwaProfileEventSchema).optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

// ── Connect With Us ────────────────────────────────────────────
export const PwaConnectWithUsConfigSchema = z
  .object({
    website: Url.optional(),
    social: z
      .object({
        x: Url.optional(),
        facebook: Url.optional(),
        instagram: Url.optional(),
        pinterest: Url.optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

// ── Raíz ───────────────────────────────────────────────────────
export const PwaConfigSchema = z
  .object({
    scavengerHunt: PwaScavengerHuntConfigSchema.optional(),
    wayfinding: PwaWayfindingConfigSchema.optional(),
    notifications: PwaNotificationsConfigSchema.optional(),
    profile: PwaProfileConfigSchema.optional(),
    connectWithUs: PwaConnectWithUsConfigSchema.optional(),
  })
  .passthrough();
