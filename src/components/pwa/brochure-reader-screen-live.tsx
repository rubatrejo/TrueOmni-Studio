'use client';

import type { ComponentProps } from 'react';

import type { PwaDigitalBrochureModuleConfig } from '@/lib/config';

import { BrochureReaderScreen } from './brochure-reader-screen';
import { usePwaSection } from './pwa-bridge-context';

type ReaderData = Omit<ComponentProps<typeof BrochureReaderScreen>, 'texts'>;

/**
 * Wrapper live del reader de Digital Brochure. Lee el override de
 * `features.pwa.digitalBrochure` y sustituye solo los textos (loading, error,
 * etc.); el brochure (PDF) viene del server. No toca `BrochureReaderScreen`.
 */
export function BrochureReaderScreenLive({
  config,
  ...data
}: ReaderData & {
  config: PwaDigitalBrochureModuleConfig;
}) {
  const cfg = usePwaSection('digitalBrochure', config) ?? config;
  return <BrochureReaderScreen {...data} texts={cfg} />;
}
