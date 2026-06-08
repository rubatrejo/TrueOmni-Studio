'use client';

import type { ComponentProps } from 'react';

import type { PwaTicketsModuleConfig } from '@/lib/config';

import { usePwaSection } from './pwa-bridge-context';
import { TicketsScreen } from './tickets-screen';

type TicketsData = Omit<ComponentProps<typeof TicketsScreen>, 'texts'>;

/**
 * Wrapper live de la timeline de Tickets. Lee el override de `features.pwa.tickets`
 * y sustituye solo los textos; los tickets vienen del server. No toca
 * `TicketsScreen`.
 */
export function TicketsScreenLive({
  config,
  ...data
}: TicketsData & {
  config: PwaTicketsModuleConfig;
}) {
  const cfg = usePwaSection('tickets', config) ?? config;
  return <TicketsScreen {...data} texts={cfg} />;
}
