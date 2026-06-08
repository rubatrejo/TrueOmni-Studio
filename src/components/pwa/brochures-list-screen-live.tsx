'use client';

import type { ComponentProps } from 'react';

import type { PwaDigitalBrochureModuleConfig } from '@/lib/config';

import { BrochuresListScreen } from './brochures-list-screen';
import { usePwaSection } from './pwa-bridge-context';

type BrochuresData = Omit<ComponentProps<typeof BrochuresListScreen>, 'texts'>;

/**
 * Wrapper live del listado de Digital Brochure. Lee el override de
 * `features.pwa.digitalBrochure` y sustituye solo los textos; las categorías y los
 * brochures vienen del server. No toca `BrochuresListScreen`.
 */
export function BrochuresListScreenLive({
  config,
  ...data
}: BrochuresData & {
  config: PwaDigitalBrochureModuleConfig;
}) {
  const cfg = usePwaSection('digitalBrochure', config) ?? config;
  return <BrochuresListScreen {...data} texts={cfg} />;
}
