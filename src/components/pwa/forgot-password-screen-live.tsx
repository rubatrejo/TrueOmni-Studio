'use client';

import type { ComponentProps } from 'react';

import type { PwaForgotPasswordConfig } from '@/lib/config';

import { ForgotPasswordScreen } from './forgot-password-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live del paso 1 de Forgot Password. Si hay override de
 * `features.pwa.forgotPassword` (preview del Studio) reconstruye los textos; si no,
 * usa los del server (`texts`, ya con fallback). El fondo y el href vienen del
 * server. No toca `ForgotPasswordScreen`.
 */
export function ForgotPasswordScreenLive({
  config,
  ...data
}: ComponentProps<typeof ForgotPasswordScreen> & {
  config?: PwaForgotPasswordConfig;
}) {
  const cfg = usePwaSection('forgotPassword', config);
  return (
    <ForgotPasswordScreen
      {...data}
      texts={
        cfg
          ? {
              title: cfg.title,
              body: cfg.body,
              emailPlaceholder: cfg.emailPlaceholder,
              resetCta: cfg.resetCta,
              createAccountCta: cfg.createAccountCta,
            }
          : data.texts
      }
    />
  );
}
