'use client';

import type { ComponentProps } from 'react';

import type { PwaTicketsModuleConfig } from '@/lib/config';

import { ListingsDetailScreen, type ListingDetailTexts } from './listings-detail-screen';
import { usePwaSection } from './pwa-bridge-context';

type DetailData = Omit<ComponentProps<typeof ListingsDetailScreen>, 'texts'>;

/**
 * Wrapper live del detalle de Tickets. Igual que `EventsDetailScreenLive` pero con
 * `features.pwa.tickets`. El CTA "BUY TICKET · {precio}" (`heroPrimaryAction`) va
 * mezclado con data y NO es live. No toca `ListingsDetailScreen`.
 */
export function TicketsDetailScreenLive({
  config,
  texts,
  ...data
}: DetailData & {
  config: PwaTicketsModuleConfig;
  texts: ListingDetailTexts;
}) {
  const cfg = usePwaSection('tickets', config) ?? config;
  const liveTexts: ListingDetailTexts = {
    ...texts,
    headerTitle: cfg.title,
    eyebrow: cfg.detail.eyebrow,
    call: cfg.detail.call,
    website: cfg.detail.website,
    addFavorite: cfg.detail.addFavorite,
    removeFavorite: cfg.detail.removeFavorite,
    seeDirections: cfg.detail.seeDirections,
    description: cfg.detail.description,
  };
  return <ListingsDetailScreen {...data} texts={liveTexts} />;
}
