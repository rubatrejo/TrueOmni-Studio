'use client';

import type { ComponentProps } from 'react';

import type { PwaEventsModuleConfig } from '@/lib/config';

import { ListingsDetailScreen, type ListingDetailTexts } from './listings-detail-screen';
import { usePwaSection } from './pwa-bridge-context';

type DetailData = Omit<ComponentProps<typeof ListingsDetailScreen>, 'texts'>;

/**
 * Wrapper live del detalle de Events. Lee el override de `features.pwa.events` y
 * sustituye en vivo el subset de textos que viven en `detail.*`; el resto de
 * `texts` (openNowUntil/moreHours/businessHours — vacíos en Events) se preserva
 * del server. El `heroPrimaryAction` (GET TICKETS) va mezclado con data y NO es
 * live — se refleja al recargar / publicar. No toca `ListingsDetailScreen`.
 */
export function EventsDetailScreenLive({
  config,
  texts,
  ...data
}: DetailData & {
  config: PwaEventsModuleConfig;
  texts: ListingDetailTexts;
}) {
  const cfg = usePwaSection('events', config) ?? config;
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
