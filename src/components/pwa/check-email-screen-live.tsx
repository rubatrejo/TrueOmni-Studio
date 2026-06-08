'use client';

import type { ComponentProps } from 'react';

import type { PwaForgotPasswordConfig } from '@/lib/config';

import { CheckEmailScreen } from './check-email-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live del paso 2 de Forgot Password ("Check Your Email"). Si hay override
 * de `features.pwa.forgotPassword` reconstruye los textos desde `sent`; si no, usa
 * los del server. El fondo y el href vienen del server. No toca `CheckEmailScreen`.
 */
export function CheckEmailScreenLive({
  config,
  ...data
}: ComponentProps<typeof CheckEmailScreen> & {
  config?: PwaForgotPasswordConfig;
}) {
  const cfg = usePwaSection('forgotPassword', config);
  return (
    <CheckEmailScreen
      {...data}
      texts={
        cfg
          ? {
              title: cfg.sent.title,
              body: cfg.sent.body,
              createAccountCta: cfg.sent.createAccountCta,
              tryAgainCta: cfg.sent.tryAgainCta,
            }
          : data.texts
      }
    />
  );
}
