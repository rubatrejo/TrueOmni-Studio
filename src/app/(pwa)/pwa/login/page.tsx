import { LoginScreen } from '@/components/pwa/login-screen';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig, type PwaLoginConfig } from '@/lib/config';

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

/**
 * Pantalla Login de la PWA (`/pwa/login`). Auth mockeado (frontend pixel-perfect).
 * `dashboardHref` se omite hasta que exista el Dashboard.
 */
export default async function PwaLoginPage() {
  const config = await getConfig();
  const pwa = config.features?.pwa;
  const login = pwa?.login ?? FALLBACK_LOGIN;
  const background = login.background ?? pwa?.welcome?.background ?? 'assets/pwa/welcome-bg.jpg';

  return (
    <MobileCanvas>
      <LoginScreen
        background={background}
        logoAlt={config.branding.logo.alt}
        texts={login}
        dashboardHref="/pwa/dashboard"
      />
    </MobileCanvas>
  );
}
