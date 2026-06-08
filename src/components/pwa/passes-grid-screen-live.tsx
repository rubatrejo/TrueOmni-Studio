'use client';

import type { ComponentProps } from 'react';

import type { PwaPassesModuleConfig } from '@/lib/config';

import { PassesGridScreen } from './passes-grid-screen';
import { usePwaSection } from './pwa-bridge-context';

type PassesData = Omit<ComponentProps<typeof PassesGridScreen>, 'title'>;

/**
 * Wrapper live del grid de Passes. Lee el override de `features.pwa.passes` y
 * sustituye el título; los passes vienen del server. No toca `PassesGridScreen`.
 */
export function PassesGridScreenLive({
  config,
  ...data
}: PassesData & {
  config: PwaPassesModuleConfig;
}) {
  const cfg = usePwaSection('passes', config) ?? config;
  return <PassesGridScreen {...data} title={cfg.title} />;
}
