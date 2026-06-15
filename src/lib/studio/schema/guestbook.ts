import { z } from 'zod';

import { ShortIdSchema, CoordsSchema } from './primitives';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Guestbook                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export const GuestbookPinOptionSchema = z.object({
  id: ShortIdSchema,
  /**
   * Imagen completa del pin (círculo + pointer). Empty string permitido
   * para clientes nuevos que aún no han subido assets — el runtime kiosk
   * usa un fallback en ese caso.
   */
  image: z.string(),
  /** Versión solo-círculo (sin pointer) para el popup. */
  circleImage: z.string().optional(),
  label: z.string().min(1).max(64),
});

export const GuestbookCountrySchema = z.object({
  /** ISO 3166-1 alpha-2 (US, MX, …). */
  code: z
    .string()
    .min(2)
    .max(2)
    .regex(/^[A-Z]{2}$/, 'must be 2 uppercase letters'),
  name: z.string().min(1).max(64),
});

export const GuestbookSeedPinSchema = z.object({
  id: ShortIdSchema,
  authorName: z.string().min(1).max(120),
  zipCode: z.string().min(1).max(20),
  coords: CoordsSchema,
  pinImage: z.string().min(1),
  /** Etiqueta human-readable: "Today", "Yesterday", "Jan 14". */
  dateLabel: z.string().min(1).max(64),
  address: z.string().min(1).max(280),
  comment: z.string().max(1000).optional(),
});

export const GuestbookSchema = z.object({
  label: z.string().min(1).max(64),
  heroImage: z.string().default(''),
  pinCatalog: z.array(GuestbookPinOptionSchema).min(1).max(20),
  countries: z.array(GuestbookCountrySchema).max(300),
  seedPins: z.array(GuestbookSeedPinSchema).max(500),
  earthStart: z
    .object({
      center: CoordsSchema,
      zoom: z.number().min(0).max(20),
    })
    .optional(),
});

export type GuestbookPinOption = z.infer<typeof GuestbookPinOptionSchema>;
export type GuestbookCountry = z.infer<typeof GuestbookCountrySchema>;
export type GuestbookSeedPin = z.infer<typeof GuestbookSeedPinSchema>;
export type GuestbookConfig = z.infer<typeof GuestbookSchema>;

let _guestbookIdSeq = 0;
export function newGuestbookId(prefix = 'gb'): string {
  return `${prefix}-${Date.now().toString(36)}-${++_guestbookIdSeq}`;
}

const COMMON_COUNTRIES: GuestbookCountry[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'AU', name: 'Australia' },
];

export const DEFAULT_GUESTBOOK: GuestbookConfig = {
  label: 'Guestbook',
  heroImage: '',
  pinCatalog: [{ id: 'pin-default', image: '', label: 'Default' }],
  countries: COMMON_COUNTRIES,
  seedPins: [],
  earthStart: { center: { lat: 30, lng: 0 }, zoom: 1.5 },
};

export function makeBlankSeedPin(): GuestbookSeedPin {
  return {
    id: newGuestbookId('seed'),
    authorName: 'New visitor',
    zipCode: '',
    coords: { lat: 0, lng: 0 },
    pinImage: '',
    dateLabel: 'Today',
    address: '',
  };
}

export function makeBlankPinOption(): GuestbookPinOption {
  return {
    id: newGuestbookId('pin'),
    image: '',
    label: 'New pin',
  };
}
