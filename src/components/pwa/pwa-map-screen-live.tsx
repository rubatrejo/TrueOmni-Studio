'use client';

import type { ComponentProps } from 'react';

import type { PwaMapModuleConfig } from '@/lib/config';

import { usePwaSection } from './pwa-bridge-context';
import { PwaMapScreen } from './pwa-map-screen';

type MapData = Omit<
  ComponentProps<typeof PwaMapScreen>,
  'title' | 'tabs' | 'resultsLabel' | 'distanceSuffix' | 'allLabel' | 'categories' | 'filterTexts'
>;

/**
 * Wrapper live del Map agregado. Lee el override de `features.pwa.map` y sustituye
 * solo los textos (title, tabs, results, distance, allLabel, las etiquetas de los
 * chips de categoría y los textos de filtros); los listings, mapItems y features
 * vienen del server. No toca `PwaMapScreen`.
 */
export function PwaMapScreenLive({
  config,
  ...data
}: MapData & {
  config: PwaMapModuleConfig;
}) {
  const cfg = usePwaSection('map', config) ?? config;
  return (
    <PwaMapScreen
      {...data}
      title={cfg.title}
      tabs={cfg.tabs}
      resultsLabel={cfg.resultsLabel}
      distanceSuffix={cfg.distanceSuffix}
      allLabel={cfg.allLabel}
      categories={cfg.categories}
      filterTexts={cfg.filters}
    />
  );
}
