import { CreateAccountScreenLive } from '@/components/pwa/create-account-screen-live';
import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  title: 'Create Account',
  namePlaceholder: 'Full Name',
  emailPlaceholder: 'Email Address',
  countryPlaceholder: 'Country',
  statePlaceholder: 'State',
  zipPlaceholder: 'Zip',
  passwordPlaceholder: 'Password*',
  confirmPasswordPlaceholder: 'Confirm Password*',
  helperText: 'Password must contain an upper & lowercase character, number, and special symbol.',
  signUpCta: 'SIGN UP',
  countrySheetTitle: 'Select Country',
  error: {
    title: 'Check Your Details',
    body: 'Please fill every field with a valid email and matching passwords.',
    okCta: 'OK',
  },
};

/**
 * Create Account (`/pwa/create-account`) — paso 1, desde cualquier botón "Create Account".
 * Contenido desde `config.features.pwa.createAccount`; fondo compartido con Welcome/Login.
 */
export default async function PwaCreateAccountPage() {
  const config = await getConfig();
  const pwa = config.features?.pwa;
  const ca = pwa?.createAccount;
  const texts = ca ?? FALLBACK;
  const background =
    pwa?.login?.background ?? pwa?.welcome?.background ?? 'assets/pwa/welcome-bg.jpg';

  return (
    <MobileCanvas>
      <CreateAccountScreenLive
        config={ca}
        background={background}
        logoAlt={config.branding.logo.alt}
        texts={{
          title: texts.title,
          namePlaceholder: texts.namePlaceholder,
          emailPlaceholder: texts.emailPlaceholder,
          countryPlaceholder: texts.countryPlaceholder,
          statePlaceholder: texts.statePlaceholder,
          zipPlaceholder: texts.zipPlaceholder,
          passwordPlaceholder: texts.passwordPlaceholder,
          confirmPasswordPlaceholder: texts.confirmPasswordPlaceholder,
          helperText: texts.helperText,
          signUpCta: texts.signUpCta,
          countrySheetTitle: texts.countrySheetTitle,
          error: texts.error,
        }}
        countries={ca?.countries ?? []}
        photoHref="/pwa/create-account/photo"
      />
    </MobileCanvas>
  );
}
