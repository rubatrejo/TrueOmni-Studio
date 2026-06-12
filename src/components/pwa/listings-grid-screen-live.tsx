'use client';

import type { ComponentProps } from 'react';

import type { PwaListingCategory, PwaListingsModuleConfig } from '@/lib/config';

import { ListingsGridScreen } from './listings-grid-screen';
import { usePwaSection } from './pwa-bridge-context';

/** Keys de `PwaConfig` que comparten `PwaListingsModuleConfig`. (Trails tiene su
 *  propio tipo `PwaTrailsModuleConfig` y queda fuera de este wrapper genérico.) */
export type ListingsModuleKey = 'restaurants' | 'stay' | 'thingsToDo';

type GridData = Omit<ComponentProps<typeof ListingsGridScreen>, 'searchPlaceholder' | 'categories'>;

/**
 * Wrapper live del grid de un módulo listings. Lee el override de
 * `features.pwa.<moduleKey>` (preview en vivo del Studio) y sustituye solo los
 * textos (searchPlaceholder + categories), dejando la data del server. Genérico
 * para los 4 módulos. No toca `ListingsGridScreen`.
 *
 * Tiles: si el módulo del kiosk tiene sub-categorías, el grid las usa
 * (`subcategoryTiles`, foto compartida); si no, cae a las `categories` propias
 * de la PWA (retrocompat).
 */
export function ListingsGridScreenLive({
  moduleKey,
  config,
  subcategoryTiles,
  ...data
}: GridData & {
  moduleKey: ListingsModuleKey;
  config: PwaListingsModuleConfig;
  /** Tiles desde las sub-categorías del kiosk (server). Vacío → usa categories. */
  subcategoryTiles?: PwaListingCategory[];
}) {
  const cfg = usePwaSection(moduleKey, config) ?? config;
  const categories =
    subcategoryTiles && subcategoryTiles.length > 0 ? subcategoryTiles : cfg.categories;
  return (
    <ListingsGridScreen
      {...data}
      searchPlaceholder={cfg.searchPlaceholder}
      categories={categories}
    />
  );
}
