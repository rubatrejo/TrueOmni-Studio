import { z } from 'zod';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Trip Builder (Itinerary)                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export const ItineraryAiOptionSchema = z.object({
  value: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  /** Solo aplica a la question `key === 'duration'` — número de días sugeridos. */
  days: z.number().int().min(0).max(30).optional(),
  /**
   * Categoría del kiosk a la que apunta esta option (e.g. 'restaurants',
   * 'things-to-do', 'trails', 'events'). Usada por el AI Itinerary para
   * filtrar resultados a un módulo específico cuando el usuario marca
   * esta option.
   */
  categoryKey: z.string().max(64).optional(),
  /** Subcategoría dentro del categoryKey elegido (e.g. 'Hiking', 'Mexican'). */
  subcategoryKey: z.string().max(120).optional(),
});

export type ItineraryAiOption = z.infer<typeof ItineraryAiOptionSchema>;

export const ITINERARY_QUESTION_TYPES = ['single', 'multi'] as const;
export type ItineraryQuestionType = (typeof ITINERARY_QUESTION_TYPES)[number];

export const ItineraryAiQuestionSchema = z.object({
  /** Estable per-instance — sólo vive en KV/Studio, NO se publica a fs. */
  id: z.string().min(1).max(64),
  /** Slug semántico del wizard ('duration', 'travel_type', 'activities', …). */
  key: z.string().min(1).max(64),
  kicker: z.string().max(80).default(''),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(200).optional(),
  type: z.enum(ITINERARY_QUESTION_TYPES),
  options: z.array(ItineraryAiOptionSchema).min(1).max(20),
});

export type ItineraryAiQuestion = z.infer<typeof ItineraryAiQuestionSchema>;

export const ItineraryLocalListingStopSchema = z.object({
  slug: z.string().min(1).max(120),
  kind: z.string().min(1).max(64),
  moduleSlug: z.string().min(1).max(120),
});

export const ItineraryLocalListingSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  image: z.string().default(''),
  stops: z.array(ItineraryLocalListingStopSchema).default([]),
});

export type ItineraryLocalListing = z.infer<typeof ItineraryLocalListingSchema>;

export const ItineraryBuilderSchema = z.object({
  /**
   * Toggle del flujo AI del Trip Planner. Mapea a `ai.enabled` en
   * `features.home.itinerary.ai.enabled`. Cuando es false, el botón
   * "AI Itinerary" del welcome popup se oculta y los visitantes solo
   * pueden construir el itinerario manualmente. El módulo Trip Planner
   * sigue activo (controlado por systemModules.itineraryBuilder).
   */
  aiEnabled: z.boolean().default(true),
  loadingImage: z.string().default(''),
  defaultTitleTemplate: z.string().max(200).default(''),
  /**
   * Hero image compartida por TODAS las questions del wizard. Antes vivía
   * por question (legacy `question.hero_image`). Mantenemos el shape legacy
   * al publicar copiando este valor a cada question's `hero_image`.
   */
  wizardHeroImage: z.string().default(''),
  questions: z.array(ItineraryAiQuestionSchema).max(8).default([]),
  /** Itinerarios pre-armados curados — passthrough en Studio v1 (sin UI). */
  localListings: z.array(ItineraryLocalListingSchema).default([]),
});

export type ItineraryBuilderConfig = z.infer<typeof ItineraryBuilderSchema>;

export const DEFAULT_ITINERARY_BUILDER: ItineraryBuilderConfig = {
  aiEnabled: true,
  loadingImage: '',
  defaultTitleTemplate: '',
  wizardHeroImage: '',
  questions: [],
  localListings: [],
};
