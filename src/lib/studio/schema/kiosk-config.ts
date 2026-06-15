import { z } from 'zod';

import { AdsModuleSchema, defaultAds } from './ads';
import { AiAvatarSchema, DEFAULT_AI_AVATAR } from './ai-avatar';
import { BillboardSchema, DEFAULT_BILLBOARD } from './billboard';
import { type Branding, BrandingSchema } from './branding';
import { BrochuresModuleSchema, DEFAULT_BROCHURES } from './brochure';
import { DealsModuleSchema, DEFAULT_DEALS } from './deals';
import { EventsModuleSchema, defaultEvents, TicketsModuleSchema, defaultTickets } from './events';
import { GuestbookSchema, DEFAULT_GUESTBOOK } from './guestbook';
import { IntegrationsConfigSchema, defaultIntegrations } from './integrations';
import { ItineraryBuilderSchema, DEFAULT_ITINERARY_BUILDER } from './itinerary';
import { ListingsModuleSchema, defaultListings } from './listings';
import { MapSchema } from './map';
import { ModulesSchema, defaultModules } from './modules';
import { PassesModuleSchema, defaultPasses } from './passes';
import { PhotoBoothSchema, DEFAULT_PHOTO_BOOTH } from './photo-booth';
import { SocialWallSchema, DEFAULT_SOCIAL_WALL } from './social-wall';
import { SurveySchema, DEFAULT_SURVEY } from './survey';
import { TrailsModuleSchema, defaultTrails } from './trails';

/* ────────────────────────────────────────────────────────────────────────── */
/*  KioskConfig                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

const SlugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/, {
    message: 'slug must be lowercase letters, digits and hyphens (1–64 chars).',
  });

export const KIOSK_ORIENTATIONS = ['portrait', 'landscape', 'mobile-pwa'] as const;
export type KioskOrientation = (typeof KIOSK_ORIENTATIONS)[number];

/**
 * Dimensiones canónicas de cada orientación. Usadas por el PreviewPanel del
 * Studio y por el KioskCanvas del runtime para enforcer el viewport.
 */
export const ORIENTATION_DIMENSIONS: Record<KioskOrientation, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1920 },
  landscape: { w: 1920, h: 1080 },
  // iPhone 14 Pro estándar (393×852 → redondeado). El runtime PWA es
  // responsive desde aquí hacia abajo (small phones se escalan).
  'mobile-pwa': { w: 390, h: 844 },
};

export const KioskConfigSchema = z.object({
  slug: SlugSchema,
  nombre: z.string().min(1).max(120),
  /**
   * Orientación primaria del kiosk — la que se renderiza por default al abrir
   * el editor. Internamente todos los clientes pueden exportarse en las 3
   * orientaciones (portrait/landscape/mobile-pwa); este campo solo controla
   * qué viewport se ve primero y qué bundle es el "canónico" del cliente.
   */
  orientation: z.enum(KIOSK_ORIENTATIONS).default('portrait'),
  branding: BrandingSchema,
  /** Lista de tiles del Home — ordenada, con toggle on/off y label editable. */
  modules: ModulesSchema.optional(),
  /** Idle/Billboard: variant + idle timeout. */
  billboard: BillboardSchema.optional(),
  /** Avatar IA flotante (Ask Anything) — config editable desde el sidebar. */
  aiAvatar: AiAvatarSchema.optional(),
  /** Módulo Survey — intro + preguntas + contact capture + thank you. */
  survey: SurveySchema.optional(),
  /** Módulo Deals — lista de cupones + feature catalog + hero. */
  deals: DealsModuleSchema.optional(),
  /** Módulo Photo Booth — backgrounds, frames, filters, stickers, share. */
  photoBooth: PhotoBoothSchema.optional(),
  /** Módulo Digital Brochure — categorías + listado de PDFs. */
  brochures: BrochuresModuleSchema.optional(),
  /** Módulo Social Wall — handles, highlights, posts. */
  socialWall: SocialWallSchema.optional(),
  /** Módulo Guestbook — pin catalog, countries, seed pins. */
  guestbook: GuestbookSchema.optional(),
  /** Módulos Listings (Restaurants / Things to Do / Stay) — catálogo completo. */
  listings: ListingsModuleSchema.optional(),
  /** Módulo Events — categories, venues, lista de eventos. */
  events: EventsModuleSchema.optional(),
  /** Módulo Tickets — wrapper derivado de events ticketables. */
  tickets: TicketsModuleSchema.optional(),
  /** Módulo Passes — lista de passes con activities. */
  passes: PassesModuleSchema.optional(),
  /** Módulo Trails — subcategorías, difficulties, trailTypes, trails. */
  trails: TrailsModuleSchema.optional(),
  /** Módulo Map — centro/zoom, welcome popup, chips, custom pins. */
  map: MapSchema.optional(),
  /** Módulo Trip Builder — toggle AI flow + questions del wizard + local_listings. */
  itineraryBuilder: ItineraryBuilderSchema.optional(),
  /** Sistema de ads (popups, hero banners, bottom strips) por ruta. */
  ads: AdsModuleSchema.optional(),
  /** Integraciones (weather, mapbox, analytics, external API). */
  integrations: IntegrationsConfigSchema.optional(),
  /**
   * Datos del cliente que se usan en el kiosk runtime: website (footer/share)
   * y location ("Davenport, FL"). El operador los introduce al crear el
   * kiosk; se pueden editar luego desde Branding.
   */
  clientInfo: z
    .object({
      website: z.string().max(2048).default(''),
      location: z.string().max(120).default(''),
      /**
       * Coords lat/lng resueltas por geocoding al crear el kiosk.
       * Se aplican a `client.coords` en el publish y centran el módulo
       * Map + tiles que muestran distance.
       */
      coords: z.object({ lat: z.number(), lng: z.number() }).optional(),
    })
    .optional(),
  /** Versión actual publicada (incrementa en cada publish aprobado). */
  currentVersion: z.number().int().nonnegative().default(0),
});

export type KioskConfig = z.infer<typeof KioskConfigSchema>;

export const ConfigMetaSchema = z.object({
  slug: SlugSchema,
  owner: z.string().email().optional(),
  createdAt: z.string(),
  lastEditor: z.string().email().optional(),
  lastEditedAt: z.string(),
  currentVersion: z.number().int().nonnegative().default(0),
});

export type ConfigMeta = z.infer<typeof ConfigMetaSchema>;

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/** Brand por defecto (TrueOmni). Útil al crear cliente nuevo desde plantilla. */
export const DEFAULT_BRANDING: Branding = {
  primary: '#004F8B',
  secondary: '#0088CE',
  tertiary: '#B9BD39',
  fonts: { display: 'Montserrat', body: 'Open Sans' },
};

/** Crea un KioskConfig nuevo a partir de slug+nombre, clonando branding default. */
export function makeBlankConfig(
  slug: string,
  nombre: string,
  orientation: KioskOrientation = 'portrait',
): KioskConfig {
  return {
    slug,
    nombre,
    orientation,
    branding: { ...DEFAULT_BRANDING },
    modules: defaultModules(),
    billboard: { ...DEFAULT_BILLBOARD },
    aiAvatar: { ...DEFAULT_AI_AVATAR },
    survey: structuredClone(DEFAULT_SURVEY),
    deals: structuredClone(DEFAULT_DEALS),
    photoBooth: structuredClone(DEFAULT_PHOTO_BOOTH),
    brochures: structuredClone(DEFAULT_BROCHURES),
    socialWall: structuredClone(DEFAULT_SOCIAL_WALL),
    guestbook: structuredClone(DEFAULT_GUESTBOOK),
    listings: defaultListings(),
    events: defaultEvents(),
    tickets: defaultTickets(),
    passes: defaultPasses(),
    trails: defaultTrails(),
    itineraryBuilder: structuredClone(DEFAULT_ITINERARY_BUILDER),
    ads: defaultAds(),
    integrations: defaultIntegrations(),
    currentVersion: 0,
  };
}
