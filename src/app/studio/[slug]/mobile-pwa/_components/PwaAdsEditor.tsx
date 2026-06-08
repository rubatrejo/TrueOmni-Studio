'use client';

import type { AdvertisementsConfig } from '@/lib/config';
import type { AdKind, AdsModule } from '@/lib/studio/schema';

import { AdsEditor } from '../../../_components/AdsEditor';

import { PwaPanelHeader } from './pwa-ui';

/**
 * Editor de ads de la PWA. Reutiliza el `AdsEditor` del kiosk (CRUD + import/export)
 * pero apuntado al catálogo propio de la PWA (`features.pwa.ads`) con rutas `/pwa/*`
 * y dimensiones mobile. El `AdsEditor` tipa `enabled`/`theme` como requeridos
 * (schema) mientras el slice PWA los deja opcionales (config): rellenamos los
 * defaults al entrar y el resultado (schema `Ad`) es asignable de vuelta a
 * `AdvertisementsConfig`.
 */

/** Rutas `/pwa/*` pre-seleccionables en el picker (paralelo a las del kiosk). */
const PWA_AD_ROUTES: readonly string[] = [
  '/pwa/dashboard',
  '/pwa/restaurants',
  '/pwa/things-to-do',
  '/pwa/stay',
  '/pwa/events',
  '/pwa/tickets',
  '/pwa/passes',
  '/pwa/deals',
  '/pwa/trails',
  '/pwa/map',
  '/pwa/digital-brochure',
  '/pwa/social-wall',
];

/** Dimensiones que cubre cada tipo en el canvas mobile 390×844. */
const PWA_AD_DIMENSIONS: Record<AdKind, string> = {
  hero: '390×255',
  bottom: '390×146',
  popup: '340×~600',
};

export function PwaAdsEditor({
  value,
  onChange,
}: {
  value: AdvertisementsConfig | undefined;
  onChange: (next: AdvertisementsConfig) => void;
}) {
  const asModule: AdsModule = {
    ads: (value?.ads ?? []).map((a) => ({
      id: a.id,
      kind: a.kind,
      image: a.image,
      alt: a.alt ?? '',
      routes: a.routes,
      enabled: a.enabled ?? true,
      theme: a.theme ?? 'dark',
    })),
  };

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Ads"
        description="Hero, bottom-banner and popup ads of the mobile app. Pick the /pwa routes where each one shows; assets use the mobile sizes."
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <AdsEditor
          value={asModule}
          onChange={(next) => onChange({ ads: next.ads })}
          commonRoutes={PWA_AD_ROUTES}
          kindDimensions={PWA_AD_DIMENSIONS}
        />
      </div>
    </div>
  );
}
