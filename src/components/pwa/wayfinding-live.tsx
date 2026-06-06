'use client';

import type { PwaWayfindingModuleConfig } from '@/lib/config';

import { usePwaSection } from './pwa-bridge-context';
import { WayfindingScreen } from './wayfinding-screen';

/**
 * Wrapper live de la pantalla principal de Wayfinding. Lee el override del slice
 * `features.pwa.wayfinding` (preview en vivo del Studio) y cae al valor del
 * server fuera del Studio. No toca `WayfindingScreen`.
 */
export function WayfindingLive({ config }: { config: PwaWayfindingModuleConfig }) {
  const wf = usePwaSection('wayfinding', config) ?? config;
  return <WayfindingScreen config={wf} />;
}
