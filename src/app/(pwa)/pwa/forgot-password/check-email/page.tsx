import { CheckEmailScreen } from '@/components/pwa/check-email-screen';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  title: 'Check Your Email',
  body: 'We just sent you instructions on how to reset your password',
  createAccountCta: 'CREATE ACCOUNT',
  tryAgainCta: 'TRY AGAIN',
};

/**
 * Check Your Email (`/pwa/forgot-password/check-email`) — paso 2 del flujo.
 * Contenido desde `config.features.pwa.forgotPassword.sent`.
 */
export default async function PwaCheckEmailPage() {
  const config = await getConfig();
  const pwa = config.features?.pwa;
  const sent = pwa?.forgotPassword?.sent ?? FALLBACK;
  const background =
    pwa?.login?.background ?? pwa?.welcome?.background ?? 'assets/pwa/welcome-bg.jpg';

  return (
    <MobileCanvas>
      <CheckEmailScreen
        background={background}
        texts={{
          title: sent.title,
          body: sent.body,
          createAccountCta: sent.createAccountCta,
          tryAgainCta: sent.tryAgainCta,
        }}
        forgotHref="/pwa/forgot-password"
      />
    </MobileCanvas>
  );
}
