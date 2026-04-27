import type {
  HomeEventsModule,
  HomeModule,
  HomeModuleVariant,
  HomeTrailsModule,
  ItineraryStopKind,
  KioskConfig,
} from './config';

/** Slug del módulo "places to stay" — el único excluido del Itinerary Builder. */
const STAY_MODULE_SLUG = 'stay';

/** Slug fijo del tab de itinerarios pre-armados. */
export const LOCAL_LISTINGS_TAB_SLUG = '__local-listings';

/** Tabs que el Itinerary Builder soporta. */
export interface ItineraryTab {
  /** Key estable. Coincide con `moduleSlug` cuando viene de un módulo del cliente. */
  slug: string;
  label: string;
  /** Si es false, este tab es el de Local Listings (pre-built itineraries). */
  isModule: boolean;
  /** Tipo del bucket de favoritos asociado (solo para tabs de módulo). */
  kind?: ItineraryStopKind;
  /** Discriminador del HomeModuleVariant (solo para tabs de módulo). */
  moduleKind?: 'listings' | 'events' | 'trails';
}

/** Discriminador kind → bucket de favoritos. */
function moduleToKind(moduleKind: 'listings' | 'events' | 'trails'): ItineraryStopKind {
  if (moduleKind === 'events') return 'event';
  if (moduleKind === 'trails') return 'trail';
  return 'listing';
}

/** True si el módulo aporta items con coords mapeables al Itinerary Builder. */
function isItineraryEligible(slug: string, mod: HomeModuleVariant): boolean {
  if (slug === STAY_MODULE_SLUG) return false;
  const kind = mod.kind ?? 'listings';
  return kind === 'listings' || kind === 'events' || kind === 'trails';
}

/**
 * Devuelve la lista ordenada de tabs del Itinerary Builder para el cliente activo.
 * - Excluye `places-to-stay` (los hoteles no van en el itinerario).
 * - Incluye solo módulos cuyo `kind` sea `'listings' | 'events' | 'trails'`.
 * - Antepone el tab fijo `Local Listings` solo si el cliente declaró
 *   `local_listings.length > 0`.
 *
 * El orden de los tabs sigue el orden de `features.home.modules` del config.
 */
export function getItineraryTabs(
  config: KioskConfig,
  localListingsLabel: string,
): ItineraryTab[] {
  const tabs: ItineraryTab[] = [];
  const itinerary = config.features?.home?.itinerary;
  if (itinerary?.local_listings && itinerary.local_listings.length > 0) {
    tabs.push({
      slug: LOCAL_LISTINGS_TAB_SLUG,
      label: localListingsLabel,
      isModule: false,
    });
  }

  const modules = config.features?.home?.modules ?? {};
  for (const [slug, mod] of Object.entries(modules)) {
    if (!isItineraryEligible(slug, mod)) continue;
    const moduleKind = (mod.kind ?? 'listings') as 'listings' | 'events' | 'trails';
    tabs.push({
      slug,
      label: mod.label,
      isModule: true,
      kind: moduleToKind(moduleKind),
      moduleKind,
    });
  }
  return tabs;
}

/** Helpers de type narrow ergonómicos. */
export function isListingsModule(mod: HomeModuleVariant): mod is HomeModule {
  return (mod.kind ?? 'listings') === 'listings';
}
export function isEventsModule(mod: HomeModuleVariant): mod is HomeEventsModule {
  return mod.kind === 'events';
}
export function isTrailsModule(mod: HomeModuleVariant): mod is HomeTrailsModule {
  return mod.kind === 'trails';
}
