'use client';

import type { PwaWelcomeConfig } from '@/lib/config';

import { usePwaSection } from './pwa-bridge-context';
import { WelcomeSplash } from './welcome-splash';

/**
 * Wrapper live del Welcome splash. Lee el override del slice
 * `features.pwa.welcome` (preview en vivo del Studio) y cae al valor del server
 * fuera del Studio. Auto-avanza a Login SIEMPRE — también dentro del preview del
 * Studio — para no bloquear el recorrido del flujo (el fondo editado ya se ve en
 * el ImageField del editor). No toca `WelcomeSplash`.
 */
export function WelcomeSplashLive({
  welcome,
  logoAlt,
}: {
  welcome: PwaWelcomeConfig | undefined;
  logoAlt: string;
}) {
  const w = usePwaSection('welcome', welcome);

  return (
    <WelcomeSplash
      background={w?.background ?? 'assets/pwa/welcome-bg.jpg'}
      logoAlt={logoAlt}
      autoAdvanceMs={w?.autoAdvanceMs ?? 2500}
      nextHref="/pwa/login"
    />
  );
}
