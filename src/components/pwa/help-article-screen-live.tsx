'use client';

import type { ComponentProps } from 'react';

import type { PwaHelpConfig } from '@/lib/config';

import { HelpArticleScreen } from './help-article-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live del detalle de artículo de Help. Lee el override de
 * `features.pwa.help` y sustituye en vivo el header y los textos de feedback; la
 * pregunta y la respuesta (con `{client_name}` interpolado en server) vienen del
 * server. No toca `HelpArticleScreen`.
 */
export function HelpArticleScreenLive({
  config,
  ...data
}: ComponentProps<typeof HelpArticleScreen> & {
  config?: PwaHelpConfig;
}) {
  const cfg = usePwaSection('help', config);
  return (
    <HelpArticleScreen
      {...data}
      headerTitle={cfg?.title ?? data.headerTitle}
      helpfulPrompt={cfg?.helpfulPrompt ?? data.helpfulPrompt}
      helpfulYes={cfg?.helpfulYes ?? data.helpfulYes}
      helpfulNo={cfg?.helpfulNo ?? data.helpfulNo}
      thanks={cfg?.thanks ?? data.thanks}
    />
  );
}
