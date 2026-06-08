'use client';

import type { ComponentProps } from 'react';

import type { PwaTrailsModuleConfig } from '@/lib/config';

import { ListingsListScreen } from './listings-list-screen';
import { usePwaSection } from './pwa-bridge-context';

type ListData = Omit<
  ComponentProps<typeof ListingsListScreen>,
  'title' | 'tabs' | 'resultsLabel' | 'distanceSuffix' | 'filterTexts'
>;

/**
 * Wrapper live de la lista de Trails. Lee el override de `features.pwa.trails` y
 * sustituye solo los textos (title, tabs, resultsLabel, distanceSuffix,
 * filterTexts); la data (items, mapItems, listings, difficulties, trailTypes…)
 * viene del server. El `title` se resuelve por `categoryKey` con la config live
 * (igual que la page). Análogo a `ListingsListScreenLive` pero con
 * `PwaTrailsModuleConfig`. No toca `ListingsListScreen`.
 */
export function TrailsListScreenLive({
  config,
  categoryKey,
  ...data
}: ListData & {
  config: PwaTrailsModuleConfig;
  /** `cat` param de la lista: si está, el título es el label de esa categoría. */
  categoryKey?: string;
}) {
  const cfg = usePwaSection('trails', config) ?? config;
  const title = categoryKey
    ? (cfg.categories.find((c) => c.key === categoryKey)?.label ?? cfg.title)
    : cfg.title;
  return (
    <ListingsListScreen
      {...data}
      title={title}
      tabs={cfg.tabs}
      resultsLabel={cfg.resultsLabel}
      distanceSuffix={cfg.distanceSuffix}
      filterTexts={cfg.filters}
    />
  );
}
