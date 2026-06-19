import { LoginScreenLive } from '@/components/pwa/login-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig, type PwaLoginConfig } from '@/lib/config';
import { resolvePwaConfigImages } from '@/lib/pwa-image-inheritance';

export const dynamic = 'force-dynamic';

/** Fallback defensivo (el cliente default siempre trae `features.pwa.login`). */
const FALLBACK_LOGIN: PwaLoginConfig = {
  loginWith: 'LOGIN WITH',
  emailPlaceholder: 'Email Address',
  passwordPlaceholder: 'Password',
  forgotPassword: 'Forgot your password?',
  loginCta: 'LOGIN',
  createAccountCta: 'CREATE NEW ACCOUNT',
  skipLogin: 'Skip Login',
};

/** Fallback de textos del modal de error de login. */
const FALLBACK_ERROR = {
  title: 'Oops! Login Failed',
  body: 'There was an error that prevented you from logging in. Please try again or create a new account.',
  tryAgainCta: 'Try Again',
  createAccountCta: 'Create New Account',
};

/**
 * Pantalla Login de la PWA (`/pwa/login`). Auth mockeado (frontend pixel-perfect).
 * LOGIN valida email/password (mock); si falla muestra el modal de error.
 */
export default async function PwaLoginPage() {
  const config = await getConfig();
  const pwa = config.features?.pwa;
  // Slice con imágenes heredadas LIVE del kiosk. El background del Login ya
  // resuelve la cadena login → welcome → idle del kiosk (ver el helper).
  const resolvedPwa = resolvePwaConfigImages(config);
  const login = resolvedPwa?.login ?? pwa?.login ?? FALLBACK_LOGIN;
  const background =
    login.background ?? resolvedPwa?.welcome?.background ?? 'assets/pwa/welcome-bg.jpg';

  return (
    <MobileCanvas>
      <LoginScreenLive
        login={login}
        loginError={pwa?.loginError ?? FALLBACK_ERROR}
        logoAlt={config.branding.logo.alt}
        background={background}
      />
    </MobileCanvas>
  );
}
