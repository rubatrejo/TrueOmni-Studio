'use client';

import type { ComponentProps } from 'react';

import type { PwaHelpConfig } from '@/lib/config';

import { HelpScreen } from './help-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live del landing de Help. Lee el override de `features.pwa.help` y
 * sustituye en vivo los textos crudos; los artículos FAQ (con `{client_name}`
 * interpolado en server) vienen del server. No toca `HelpScreen`.
 */
export function HelpScreenLive({
  config,
  ...data
}: ComponentProps<typeof HelpScreen> & {
  config?: PwaHelpConfig;
}) {
  const cfg = usePwaSection('help', config);
  return (
    <HelpScreen
      {...data}
      title={cfg?.title ?? data.title}
      searchPlaceholder={cfg?.searchPlaceholder ?? data.searchPlaceholder}
      noResults={cfg?.noResults ?? data.noResults}
      needMoreTitle={cfg?.needMoreTitle ?? data.needMoreTitle}
      needMoreBody={cfg?.needMoreBody ?? data.needMoreBody}
      contactCta={cfg?.contactCta ?? data.contactCta}
    />
  );
}
