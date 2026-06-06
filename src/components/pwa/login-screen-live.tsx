'use client';

import type { PwaLoginConfig, PwaLoginErrorConfig } from '@/lib/config';

import { LoginScreen } from './login-screen';
import { usePwaSection } from './pwa-bridge-context';

/**
 * Wrapper live de la pantalla de Login. Lee los overrides de `features.pwa.login`
 * y `features.pwa.loginError` (preview en vivo del Studio) y cae a los valores
 * del server fuera del Studio. El fondo resuelve la cadena live login → welcome →
 * fallback del server. No toca `LoginScreen`.
 */
export function LoginScreenLive({
  login,
  loginError,
  logoAlt,
  background,
}: {
  login: PwaLoginConfig;
  loginError: PwaLoginErrorConfig;
  logoAlt: string;
  background: string;
}) {
  const liveLogin = usePwaSection('login', login) ?? login;
  const liveError = usePwaSection('loginError', loginError) ?? loginError;
  const liveWelcome = usePwaSection('welcome', undefined);
  const bg = liveLogin.background ?? liveWelcome?.background ?? background;

  return (
    <LoginScreen
      background={bg}
      logoAlt={logoAlt}
      texts={liveLogin}
      dashboardHref="/pwa/dashboard"
      forgotHref="/pwa/forgot-password"
      errorTexts={liveError}
    />
  );
}
