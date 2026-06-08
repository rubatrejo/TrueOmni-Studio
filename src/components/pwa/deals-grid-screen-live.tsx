'use client';

import type { ComponentProps } from 'react';

import type { PwaDealsModuleConfig } from '@/lib/config';

import { DealsGridScreen } from './deals-grid-screen';
import { usePwaSection } from './pwa-bridge-context';

type DealsData = Omit<ComponentProps<typeof DealsGridScreen>, 'texts'>;

/**
 * Wrapper live del grid de Deals. Lee el override de `features.pwa.deals` y
 * sustituye solo los textos (grid, sort, filtros y sheet de canje van todos en
 * `texts`); los cupones vienen del server. No toca `DealsGridScreen`.
 */
export function DealsGridScreenLive({
  config,
  ...data
}: DealsData & {
  config: PwaDealsModuleConfig;
}) {
  const cfg = usePwaSection('deals', config) ?? config;
  return <DealsGridScreen {...data} texts={cfg} />;
}
