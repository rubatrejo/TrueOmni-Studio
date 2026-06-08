'use client';

import type { ComponentProps } from 'react';

import type { PwaPassesModuleConfig } from '@/lib/config';

import { PassDetailScreen } from './pass-detail-screen';
import { usePwaSection } from './pwa-bridge-context';

type PassDetailData = Omit<ComponentProps<typeof PassDetailScreen>, 'texts'>;

/**
 * Wrapper live del detalle de Passes. Lee el override de `features.pwa.passes` y
 * sustituye los textos (eyebrow, viewWebsite, activitiesEmpty…); el pass viene del
 * server. No toca `PassDetailScreen`.
 */
export function PassDetailScreenLive({
  config,
  ...data
}: PassDetailData & {
  config: PwaPassesModuleConfig;
}) {
  const cfg = usePwaSection('passes', config) ?? config;
  return <PassDetailScreen {...data} texts={cfg} />;
}
