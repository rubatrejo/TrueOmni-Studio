'use client';

import type { PwaScavengerHuntConfig } from '@/lib/config';

import { usePwaSection } from '../pwa-bridge-context';

import { HuntHowItWorks } from './hunt-how-it-works';

/**
 * Wrapper live de la pantalla "How it works" de Scavenger Hunt. Lee el override
 * del slice `features.pwa.scavengerHunt` (preview en vivo del Studio) y cae al
 * valor del server fuera del Studio. No toca `HuntHowItWorks`.
 */
export function HuntHowItWorksLive({ config }: { config: PwaScavengerHuntConfig }) {
  const sh = usePwaSection('scavengerHunt', config) ?? config;
  return <HuntHowItWorks config={sh} />;
}
