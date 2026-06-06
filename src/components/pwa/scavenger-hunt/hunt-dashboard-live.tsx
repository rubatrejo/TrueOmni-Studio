'use client';

import type { PwaScavengerHuntConfig } from '@/lib/config';

import { usePwaSection } from '../pwa-bridge-context';

import { HuntDashboard } from './hunt-dashboard';

/**
 * Wrapper live del dashboard de Scavenger Hunt. Lee el override del slice
 * `features.pwa.scavengerHunt` que empuja el editor PWA del Studio (preview en
 * vivo) y cae al valor del server (`config`) fuera del Studio — comportamiento
 * idéntico al runtime normal. No toca `HuntDashboard`.
 */
export function HuntDashboardLive({ config }: { config: PwaScavengerHuntConfig }) {
  const sh = usePwaSection('scavengerHunt', config) ?? config;
  return <HuntDashboard config={sh} />;
}
