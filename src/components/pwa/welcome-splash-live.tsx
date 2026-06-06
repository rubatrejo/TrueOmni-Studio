'use client';

import type { PwaWelcomeConfig } from '@/lib/config';

import { usePwaIsOverridden, usePwaSection } from './pwa-bridge-context';
import { WelcomeSplash } from './welcome-splash';

/**
 * Wrapper live del Welcome splash. Lee el override del slice
 * `features.pwa.welcome` (preview en vivo del Studio) y cae al valor del server
 * fuera del Studio. Dentro del editor (override activo) suprime el auto-advance
 * a Login para que el splash quede visible y editable. No toca `WelcomeSplash`.
 */
export function WelcomeSplashLive({
  welcome,
  logoAlt,
}: {
  welcome: PwaWelcomeConfig | undefined;
  logoAlt: string;
}) {
  const w = usePwaSection('welcome', welcome);
  const isOverridden = usePwaIsOverridden();

  return (
    <WelcomeSplash
      background={w?.background ?? 'assets/pwa/welcome-bg.jpg'}
      logoAlt={logoAlt}
      autoAdvanceMs={w?.autoAdvanceMs ?? 2500}
      nextHref={isOverridden ? undefined : '/pwa/login'}
    />
  );
}
