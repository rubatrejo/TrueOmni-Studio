import type { Viewport } from 'next';
import type { ReactNode } from 'react';

import { I18nProvider } from '@/components/i18n-provider';
import { PwaAdsProvider } from '@/components/pwa/ads/pwa-ads-context';
import { PwaBridgeProvider } from '@/components/pwa/pwa-bridge-context';
import { StudioBridge } from '@/components/studio-bridge';
import { getAdsFromConfig } from '@/lib/ads';
import { getClientSlug } from '@/lib/client-env';
import { getConfig } from '@/lib/config';
import { loadAllLocales } from '@/lib/i18n-server';

/**
 * Viewport mobile de la PWA. Solo aplica al subárbol `(pwa)`; el kiosk hereda
 * el default de Next desde el root layout y no se ve afectado.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

/**
 * Layout del grupo PWA. Replica el patrón del kiosk: pre-carga server-side los
 * locales del cliente activo y los pasa al `I18nProvider`.
 *
 * Fase Pz: monta el `StudioBridge` (branding/locale live + handshake) y el
 * `PwaBridgeProvider` (override reactivo del slice `features.pwa`). Ambos son
 * inertes fuera del iframe del Studio — solo reaccionan a `postMessage` del
 * host — así que no afectan el runtime normal de la PWA.
 */
export default async function PwaLayout({ children }: { children: ReactNode }) {
  const config = await getConfig();
  const slug = getClientSlug();
  const lang = config.features?.languages;
  const available = lang?.available ?? ['en'];
  const defaultLocale = lang?.default ?? 'en';
  const localesMap = await loadAllLocales(slug, available);
  const ads = getAdsFromConfig(config);

  return (
    <I18nProvider localesMap={localesMap} defaultLocale={defaultLocale} available={available}>
      <PwaBridgeProvider initial={config.features?.pwa ?? null}>
        <PwaAdsProvider ads={ads}>{children}</PwaAdsProvider>
        <StudioBridge />
      </PwaBridgeProvider>
    </I18nProvider>
  );
}
