import { ForgotPasswordScreenLive } from '@/components/pwa/forgot-password-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  title: 'Forgot Your Password?',
  body: 'Enter your email below and we’ll send you a link to reset your password',
  emailPlaceholder: 'Email Address',
  resetCta: 'RESET PASSWORD',
  createAccountCta: 'Create New Account',
};

/**
 * Forgot Your Password? (`/pwa/forgot-password`) — paso 1 del flujo, desde el Login.
 * Contenido desde `config.features.pwa.forgotPassword`; fondo compartido con Welcome/Login.
 */
export default async function PwaForgotPasswordPage() {
  const config = await getConfig();
  const pwa = config.features?.pwa;
  const fp = pwa?.forgotPassword ?? FALLBACK;
  const background =
    pwa?.login?.background ?? pwa?.welcome?.background ?? 'assets/pwa/welcome-bg.jpg';

  return (
    <MobileCanvas>
      <ForgotPasswordScreenLive
        config={pwa?.forgotPassword}
        background={background}
        texts={{
          title: fp.title,
          body: fp.body,
          emailPlaceholder: fp.emailPlaceholder,
          resetCta: fp.resetCta,
          createAccountCta: fp.createAccountCta,
        }}
        checkEmailHref="/pwa/forgot-password/check-email"
      />
    </MobileCanvas>
  );
}
