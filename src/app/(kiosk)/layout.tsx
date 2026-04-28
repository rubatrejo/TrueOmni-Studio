import type { ReactNode } from 'react';

import { I18nProvider } from '@/components/i18n-provider';
import { getClientSlug } from '@/lib/client-env';
import { getConfig } from '@/lib/config';
import { loadAllLocales } from '@/lib/i18n-server';

/**
 * Layout del grupo kiosk. Pre-carga server-side todos los locales del cliente
 * activo y los pasa al `I18nProvider` que envuelve el árbol del kiosk.
 *
 * El cambio de idioma client-side es instantáneo (lee del map pre-cargado).
 */
export default async function KioskLayout({ children }: { children: ReactNode }) {
  const config = await getConfig();
  const slug = getClientSlug();
  const lang = config.features?.languages;
  const available = lang?.available ?? ['en'];
  const defaultLocale = lang?.default ?? 'en';
  const localesMap = await loadAllLocales(slug, available);

  return (
    <I18nProvider localesMap={localesMap} defaultLocale={defaultLocale} available={available}>
      {children}
    </I18nProvider>
  );
}
