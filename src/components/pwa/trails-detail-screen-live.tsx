'use client';

import type { ComponentProps } from 'react';

import type { PwaTrailsModuleConfig } from '@/lib/config';

import { ListingsDetailScreen, type ListingDetailTexts } from './listings-detail-screen';
import { usePwaSection } from './pwa-bridge-context';

type DetailData = Omit<ComponentProps<typeof ListingsDetailScreen>, 'texts'>;

/**
 * Wrapper live del detalle de Trails. Lee el override de `features.pwa.trails` y
 * sustituye en vivo el subset de textos que viven en `detail.*`
 * (headerTitle/eyebrow/call/website/favoritos/seeDirections/description). El
 * resto de `texts` (openNowUntil/moreHours/businessHours — vacíos en Trails) se
 * preserva del server. Los labels del panel Considerations y de los tabs del
 * mapa van mezclados con data dentro de `buildPwaListingDetail` (server) y NO se
 * actualizan en vivo — misma limitación que el botón "MENU" del detalle de
 * listings; se reflejan al recargar / publicar. No toca `ListingsDetailScreen`.
 */
export function TrailsDetailScreenLive({
  config,
  texts,
  ...data
}: DetailData & {
  config: PwaTrailsModuleConfig;
  texts: ListingDetailTexts;
}) {
  const cfg = usePwaSection('trails', config) ?? config;
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
