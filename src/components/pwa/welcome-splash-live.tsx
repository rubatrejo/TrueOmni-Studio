'use client';

import type { PwaWelcomeConfig } from '@/lib/config';

import { usePwaActiveSection, usePwaIsOverridden, usePwaSection } from './pwa-bridge-context';
import { WelcomeSplash } from './welcome-splash';

/**
 * Wrapper live del Welcome splash. Lee el override del slice
 * `features.pwa.welcome` (preview en vivo del Studio) y cae al valor del server
 * fuera del Studio.
 *
 * F-PWA-2: el auto-advance a Login se congela SOLO cuando se está editando la
 * sección Welcome del editor (para poder verla); en el runtime real y en
 * cualquier otra sección del preview fluye normal. Lección 2026-06-06: el freeze
 * depende de la sección activa, no de "estar en el Studio" (antes auto-avanzaba
 * siempre y Welcome era inverificable). No toca `WelcomeSplash`.
 */
export function WelcomeSplashLive({
  welcome,
  logoAlt,
}: {
  welcome: PwaWelcomeConfig | undefined;
  logoAlt: string;
}) {
  const w = usePwaSection('welcome', welcome);
  // El Welcome muestra el mismo logo idle que el Login → reutiliza su tamaño/posición.
  const login = usePwaSection('login', undefined);
  const isOverridden = usePwaIsOverridden();
  const activeSection = usePwaActiveSection();
  // Congelar solo si estamos en el preview Y editando la sección Welcome.
  // Sin nextHref, WelcomeSplash no auto-navega y queda mostrando el splash.
  const frozen = isOverridden && activeSection === 'welcome';

  return (
    <WelcomeSplash
      background={w?.background ?? 'assets/pwa/welcome-bg.jpg'}
      logoAlt={logoAlt}
      autoAdvanceMs={w?.autoAdvanceMs ?? 2500}
      nextHref={frozen ? undefined : '/pwa/login'}
      logoSize={login?.logoSize}
      logoOffset={login?.logoOffset}
    />
  );
}
