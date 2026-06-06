'use client';

import type { ComponentProps } from 'react';

import type { PwaListingsModuleConfig } from '@/lib/config';

import { ListingsDetailScreen, type ListingDetailTexts } from './listings-detail-screen';
import type { ListingsModuleKey } from './listings-grid-screen-live';
import { usePwaSection } from './pwa-bridge-context';

type DetailData = Omit<ComponentProps<typeof ListingsDetailScreen>, 'texts'>;

/**
 * Wrapper live del detalle de un módulo listings. Lee el override de
 * `features.pwa.<moduleKey>` y reconstruye el objeto `texts` con la config live;
 * la data (detail, heroPrimaryAction, considerations/trailMap de Trails…) viene
 * del server. Genérico para los 4 módulos. No toca `ListingsDetailScreen`.
 *
 * Nota: la etiqueta del `heroPrimaryAction` (botón "MENU") la resuelve el server
 * porque va mezclada con data (la imagen del menú) — no se actualiza en vivo.
 */
export function ListingsDetailScreenLive({
  moduleKey,
  config,
  ...data
}: DetailData & {
  moduleKey: ListingsModuleKey;
  config: PwaListingsModuleConfig;
}) {
  const cfg = usePwaSection(moduleKey, config) ?? config;
  const texts: ListingDetailTexts = {
    headerTitle: cfg.title,
    eyebrow: cfg.detail.eyebrow,
    call: cfg.detail.call,
    website: cfg.detail.website,
    addFavorite: cfg.detail.addFavorite,
    removeFavorite: cfg.detail.removeFavorite,
    seeDirections: cfg.detail.seeDirections,
    description: cfg.detail.description,
    openNowUntil: cfg.detail.openNowUntil,
    moreHours: cfg.detail.moreHours,
    openDiningGuide: cfg.detail.openDiningGuide,
    businessHours: cfg.businessHours,
  };
  return <ListingsDetailScreen {...data} texts={texts} />;
}
