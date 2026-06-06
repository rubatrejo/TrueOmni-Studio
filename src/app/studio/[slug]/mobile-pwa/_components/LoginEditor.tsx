'use client';

import type { PwaLoginConfig, PwaLoginErrorConfig } from '@/lib/config';

import { ImageField } from '../../../_components/ImageField';

import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

/**
 * Editor de la pantalla de Login de la PWA. Edita dos slices: `login` (fondo +
 * labels del formulario y botones) y `loginError` (textos del modal de error de
 * validación). Todos los textos salen de config (cero hardcoded en runtime).
 */

const EMPTY_LOGIN: PwaLoginConfig = {
  loginWith: '',
  emailPlaceholder: '',
  passwordPlaceholder: '',
  forgotPassword: '',
  loginCta: '',
  createAccountCta: '',
  skipLogin: '',
};

const EMPTY_ERROR: PwaLoginErrorConfig = {
  title: '',
  body: '',
  tryAgainCta: '',
  createAccountCta: '',
};

export function LoginEditor({
  login,
  loginError,
  onChange,
}: {
  login: PwaLoginConfig | undefined;
  loginError: PwaLoginErrorConfig | undefined;
  onChange: (login: PwaLoginConfig, loginError: PwaLoginErrorConfig) => void;
}) {
  const l: PwaLoginConfig = { ...EMPTY_LOGIN, ...login };
  const e: PwaLoginErrorConfig = { ...EMPTY_ERROR, ...loginError };

  const setLogin = (patch: Partial<PwaLoginConfig>) => onChange({ ...l, ...patch }, e);
  const setError = (patch: Partial<PwaLoginErrorConfig>) => onChange(l, { ...e, ...patch });

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Login & Sign In"
        description="Background, form labels and buttons of the login screen, plus the texts of the login error dialog."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="Background">
          <ImageField
            label="Background image"
            hint="Fullscreen photo behind the form (390×844). Falls back to the Welcome background if empty."
            layout="cover"
            aspect="390/844"
            value={l.background}
            onChange={(next) => setLogin({ background: next })}
          />
        </PwaGroup>

        <PwaGroup title="Form">
          <PwaField
            label="Social login label"
            value={l.loginWith}
            onChange={(loginWith) => setLogin({ loginWith })}
          />
          <PwaField
            label="Email placeholder"
            value={l.emailPlaceholder}
            onChange={(emailPlaceholder) => setLogin({ emailPlaceholder })}
          />
          <PwaField
            label="Password placeholder"
            value={l.passwordPlaceholder}
            onChange={(passwordPlaceholder) => setLogin({ passwordPlaceholder })}
          />
          <PwaField
            label="Forgot password link"
            value={l.forgotPassword}
            onChange={(forgotPassword) => setLogin({ forgotPassword })}
          />
          <PwaField
            label="Login button"
            value={l.loginCta}
            onChange={(loginCta) => setLogin({ loginCta })}
          />
          <PwaField
            label="Create account button"
            value={l.createAccountCta}
            onChange={(createAccountCta) => setLogin({ createAccountCta })}
          />
          <PwaField
            label="Skip login button"
            value={l.skipLogin}
            onChange={(skipLogin) => setLogin({ skipLogin })}
          />
        </PwaGroup>

        <PwaGroup title="Error dialog">
          <PwaField label="Title" value={e.title} onChange={(title) => setError({ title })} />
          <PwaField label="Body" multiline value={e.body} onChange={(body) => setError({ body })} />
          <PwaField
            label="Try again button"
            value={e.tryAgainCta}
            onChange={(tryAgainCta) => setError({ tryAgainCta })}
          />
          <PwaField
            label="Create account button"
            value={e.createAccountCta}
            onChange={(createAccountCta) => setError({ createAccountCta })}
          />
        </PwaGroup>
      </div>
    </div>
  );
}
