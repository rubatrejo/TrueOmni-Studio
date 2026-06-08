'use client';

import type { ComponentProps } from 'react';

import type { PwaHelpConfig } from '@/lib/config';

import { HelpContactScreen } from './help-contact-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live del contacto de Help. Lee el override de `features.pwa.help` y
 * sustituye en vivo los textos crudos del formulario; el "From" por defecto (nombre
 * del perfil) y el teléfono vienen del server. No toca `HelpContactScreen`.
 */
export function HelpContactScreenLive({
  config,
  ...data
}: ComponentProps<typeof HelpContactScreen> & {
  config?: PwaHelpConfig;
}) {
  const cfg = usePwaSection('help', config);
  const c = cfg?.contact;
  return (
    <HelpContactScreen
      {...data}
      title={c?.title ?? data.title}
      fromLabel={c?.fromLabel ?? data.fromLabel}
      messagePlaceholder={c?.messagePlaceholder ?? data.messagePlaceholder}
      send={c?.send ?? data.send}
      callCta={c?.callCta ?? data.callCta}
      successTitle={c?.successTitle ?? data.successTitle}
      successBody={c?.successBody ?? data.successBody}
    />
  );
}
