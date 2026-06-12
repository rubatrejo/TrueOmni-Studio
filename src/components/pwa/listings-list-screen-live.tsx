'use client';

import type { ComponentProps } from 'react';

import type { PwaListingsModuleConfig } from '@/lib/config';

import type { ListingsModuleKey } from './listings-grid-screen-live';
import { ListingsListScreen } from './listings-list-screen';
import { usePwaSection } from './pwa-bridge-context';

type ListData = Omit<
  ComponentProps<typeof ListingsListScreen>,
  'title' | 'tabs' | 'resultsLabel' | 'distanceSuffix' | 'filterTexts' | 'initialSubcategory'
>;

/**
 * Wrapper live de la lista de un módulo listings. Lee el override de
 * `features.pwa.<moduleKey>` y sustituye solo los textos (title, tabs,
 * resultsLabel, distanceSuffix, filterTexts); la data (items, mapItems,
 * listings, pools…) viene del server. El `title` se resuelve por `categoryKey`
 * con la config live (igual que la page). Genérico para los 4 módulos
 * (incluido Trails, cuyos `difficulties`/`trailTypes` pasan como data). No toca
 * `ListingsListScreen`.
 */
export function ListingsListScreenLive({
  moduleKey,
  config,
  categoryKey,
  ...data
}: ListData & {
  moduleKey: ListingsModuleKey;
  config: PwaListingsModuleConfig;
  /** `cat` param de la lista: si está, el título es el label de esa categoría. */
  categoryKey?: string;
}) {
  const cfg = usePwaSection(moduleKey, config) ?? config;
  const category = categoryKey ? cfg.categories.find((c) => c.key === categoryKey) : undefined;
  // Si el grid navega con `?cat=<sub-categoría>` directa (tiles de sub-categorías
  // del kiosk), `categoryKey` no matchea ninguna `category` → ES el nombre de la
  // sub-categoría. Si matchea una `category` PWA, usamos su `subcategory` bind.
  const directSubcategory = categoryKey && !category ? categoryKey : undefined;
  const title = category?.label ?? directSubcategory ?? cfg.title;
  const initialSubcategory = category?.subcategory || directSubcategory || undefined;
  return (
    <ListingsListScreen
      {...data}
      title={title}
      tabs={cfg.tabs}
      resultsLabel={cfg.resultsLabel}
      distanceSuffix={cfg.distanceSuffix}
      filterTexts={cfg.filters}
      initialSubcategory={initialSubcategory}
    />
  );
}
