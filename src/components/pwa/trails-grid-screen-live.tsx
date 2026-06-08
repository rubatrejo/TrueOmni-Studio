'use client';

import type { ComponentProps } from 'react';

import type { PwaTrailsModuleConfig } from '@/lib/config';

import { ListingsGridScreen } from './listings-grid-screen';
import { usePwaSection } from './pwa-bridge-context';

type GridData = Omit<ComponentProps<typeof ListingsGridScreen>, 'searchPlaceholder' | 'categories'>;

/**
 * Wrapper live del grid de Trails. Lee el override de `features.pwa.trails`
 * (preview en vivo del Studio) y sustituye solo los textos (searchPlaceholder +
 * categories), dejando la data del server. Análogo a `ListingsGridScreenLive`
 * pero con `PwaTrailsModuleConfig` (Trails no comparte el tipo de los listings).
 * No toca `ListingsGridScreen`.
 */
export function TrailsGridScreenLive({
  config,
  ...data
}: GridData & {
  config: PwaTrailsModuleConfig;
}) {
  const cfg = usePwaSection('trails', config) ?? config;
  return (
    <ListingsGridScreen
      {...data}
      searchPlaceholder={cfg.searchPlaceholder}
      categories={cfg.categories}
    />
  );
}
