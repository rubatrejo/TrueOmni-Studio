import { z } from 'zod';

import { ItemSlugSchema, DirectionStepSchema, CoordsSchema, uniqueBySlug } from './primitives';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Events                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const DateIsoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD.' });

const TimeHmSchema = z.string().regex(/^\d{2}:\d{2}$/, { message: 'time must be HH:MM (24h).' });

const PriceBandSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

export const EventTicketSchema = z.object({
  priceDisplay: z.string().min(1).max(64),
  purchaseUrl: z.string().max(2048),
});

export const EventItemSchema = z.object({
  slug: ItemSlugSchema,
  title: z.string().min(1).max(160),
  category: z.string().max(64).default(''),
  image: z.string().default(''),
  date: DateIsoSchema,
  startTime: TimeHmSchema,
  endTime: TimeHmSchema,
  venue: z.string().max(120).default(''),
  priceMode: z.enum(['free', 'paid']).default('free'),
  priceBand: PriceBandSchema.optional(),
  features: z.array(z.string().max(64)).default([]),
  popularity: z.number().min(0).max(100).default(50),
  address: z.string().max(280).default(''),
  phone: z.string().max(64).default(''),
  coords: CoordsSchema.default({ lat: 0, lng: 0 }),
  website: z.string().max(2048).default(''),
  ticketsUrl: z.string().max(2048).optional(),
  description: z.string().max(4000).default(''),
  directions: z.array(DirectionStepSchema).default([]),
  ticket: EventTicketSchema.optional(),
});

export type EventItem = z.infer<typeof EventItemSchema>;

export const EventsModuleSchema = z.object({
  label: z.string().min(1).max(64),
  heroImage: z.string().default(''),
  categories: z.array(z.string().max(64)).default([]),
  venues: z.array(z.string().max(120)).default([]),
  features: z.array(z.string().max(64)).default([]),
  /** Alimentado por un feed de proveedor → editor por-producto read-only. */
  feedConnected: z.boolean().optional(),
  events: z.array(EventItemSchema).superRefine(uniqueBySlug).default([]),
});

export type EventsModule = z.infer<typeof EventsModuleSchema>;

export function defaultEvents(): EventsModule {
  return {
    label: 'Events',
    heroImage: '',
    categories: [],
    venues: [],
    features: [],
    events: [],
  };
}

export function makeBlankEvent(): EventItem {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  return {
    slug: `event-${Date.now()}`,
    title: 'Untitled event',
    category: '',
    image: '',
    date: iso,
    startTime: '18:00',
    endTime: '20:00',
    venue: '',
    priceMode: 'free',
    features: [],
    popularity: 50,
    address: '',
    phone: '',
    coords: { lat: 0, lng: 0 },
    website: '',
    description: '',
    directions: [],
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Tickets (wrapper derivado de events)                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export const TicketsModuleSchema = z.object({
  label: z.string().min(1).max(64),
  heroImage: z.string().default(''),
  /** Subset of `events.categories` that should appear as ticket tabs. */
  categories: z.array(z.string().max(64)).default([]),
  venues: z.array(z.string().max(120)).default([]),
  features: z.array(z.string().max(64)).default([]),
  fallbackHero: z.string().default(''),
  copy: z.string().max(2000).default(''),
});

export type TicketsModule = z.infer<typeof TicketsModuleSchema>;

export function defaultTickets(): TicketsModule {
  return {
    label: 'Tickets',
    heroImage: '',
    categories: [],
    venues: [],
    features: [],
    fallbackHero: '',
    copy: '',
  };
}
