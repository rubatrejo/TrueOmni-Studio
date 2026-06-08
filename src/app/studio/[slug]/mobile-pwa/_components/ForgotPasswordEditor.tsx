'use client';

import type { PwaForgotPasswordConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

/**
 * Editor del flujo "Forgot Password" de la PWA: paso 1 (`ForgotPasswordScreen`) +
 * paso 2 "Check Your Email" (`CheckEmailScreen`). Solo textos white-label; el fondo
 * se comparte con Welcome/Login.
 */

const EMPTY: PwaForgotPasswordConfig = {
  title: '',
  body: '',
  emailPlaceholder: '',
  resetCta: '',
  createAccountCta: '',
  sent: { title: '', body: '', createAccountCta: '', tryAgainCta: '' },
};

export function ForgotPasswordEditor({
  value,
  onChange,
}: {
  value: PwaForgotPasswordConfig | undefined;
  onChange: (next: PwaForgotPasswordConfig) => void;
}) {
  const v: PwaForgotPasswordConfig = {
    ...EMPTY,
    ...value,
    sent: { ...EMPTY.sent, ...value?.sent },
  };
  const s = v.sent;
  const setSent = (patch: Partial<PwaForgotPasswordConfig['sent']>) =>
    onChange({ ...v, sent: { ...s, ...patch } });

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Forgot Password"
        description="White-label texts of the forgot-password flow: the email step and the confirmation screen."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="Step 1 · Forgot password">
          <PwaField label="Title" value={v.title} onChange={(title) => onChange({ ...v, title })} />
          <PwaField
            label="Body"
            value={v.body}
            onChange={(body) => onChange({ ...v, body })}
            multiline
          />
          <PwaField
            label="Email placeholder"
            value={v.emailPlaceholder}
            onChange={(emailPlaceholder) => onChange({ ...v, emailPlaceholder })}
          />
          <PwaField
            label="Reset button"
            value={v.resetCta}
            onChange={(resetCta) => onChange({ ...v, resetCta })}
          />
          <PwaField
            label="Create account link"
            value={v.createAccountCta}
            onChange={(createAccountCta) => onChange({ ...v, createAccountCta })}
          />
        </PwaGroup>

        <PwaGroup title="Step 2 · Check your email">
          <PwaField label="Title" value={s.title} onChange={(title) => setSent({ title })} />
          <PwaField label="Body" value={s.body} onChange={(body) => setSent({ body })} multiline />
          <PwaField
            label="Create account button"
            value={s.createAccountCta}
            onChange={(createAccountCta) => setSent({ createAccountCta })}
          />
          <PwaField
            label="Try again button"
            value={s.tryAgainCta}
            onChange={(tryAgainCta) => setSent({ tryAgainCta })}
          />
        </PwaGroup>
      </div>
    </div>
  );
}
