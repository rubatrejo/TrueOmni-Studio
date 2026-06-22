'use client';

import type { ComponentProps } from 'react';

import type { PwaCreateAccountConfig } from '@/lib/config';

import { CreateAccountScreen } from './create-account-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live del paso 1 de Create Account (formulario). Si hay override de
 * `features.pwa.createAccount` reconstruye los textos; si no, usa los del server. La
 * lista de países, el fondo, el logo y el href vienen del server. No toca
 * `CreateAccountScreen`.
 */
export function CreateAccountScreenLive({
  config,
  ...data
}: ComponentProps<typeof CreateAccountScreen> & {
  config?: PwaCreateAccountConfig;
}) {
  const cfg = usePwaSection('createAccount', config);
  // El fondo se resuelve por el bridge (login → welcome → fallback del server),
  // igual que LoginScreenLive. En el preview del Studio el iframe corre con
  // KIOSK_CLIENT=default, así que SIN esto el fondo se quedaba en el placeholder
  // del default; el override del cliente (con el idle heredado) llega por bridge.
  const liveLogin = usePwaSection('login', undefined);
  const liveWelcome = usePwaSection('welcome', undefined);
  const background = liveLogin?.background ?? liveWelcome?.background ?? data.background;
  return (
    <CreateAccountScreen
      {...data}
      background={background}
      texts={
        cfg
          ? {
              title: cfg.title,
              namePlaceholder: cfg.namePlaceholder,
              emailPlaceholder: cfg.emailPlaceholder,
              countryPlaceholder: cfg.countryPlaceholder,
              statePlaceholder: cfg.statePlaceholder,
              zipPlaceholder: cfg.zipPlaceholder,
              passwordPlaceholder: cfg.passwordPlaceholder,
              confirmPasswordPlaceholder: cfg.confirmPasswordPlaceholder,
              helperText: cfg.helperText,
              signUpCta: cfg.signUpCta,
              countrySheetTitle: cfg.countrySheetTitle,
              error: cfg.error,
            }
          : data.texts
      }
    />
  );
}
