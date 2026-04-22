import type { MapSource } from './config';

/**
 * Item agregado del módulo Map. Normaliza Listings + Events a una misma
 * forma para renderizarse como pins/cards/burbujas sin ramificar por fuente.
 *
 * `source` — chip de categoría lógico (Play/Eat/Stay/Events).
 * `moduleSlug` — key real del módulo origen en `features.home.modules`
 *   (ej. 'restaurants', 'things-to-do', 'stay', 'events'), usada para
 *   navegar al detail con `/home/{moduleSlug}/{slug}`.
 */
export interface MapItem {
  source: MapSource;
  moduleSlug: string;
  slug: string;
  title: string;
  /** Subcategory o category uppercase-friendly ("Mexican", "Music"). */
  subcategory: string;
  image: string;
  coords: { lat: number; lng: number };
  address: string;
  phone?: string;
  /** Features/tags (subset del `module.features`). */
  features: string[];
  /** Para sort "Most Popular" si se necesita. */
  popularity: number;
  /** Listings: "7 am – 11 pm". Events: no usado. */
  hours?: string;
  /** Texto derivado "Open until 11:00 pm" si se puede calcular. */
  openTodayLabel?: string;
  /** Events: "Fri, Dec 10 · 7 pm". */
  dateLabel?: string;
  priceRange?: 1 | 2 | 3 | 4;
  priceMode?: 'free' | 'paid';
}
