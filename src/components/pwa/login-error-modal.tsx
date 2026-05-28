'use client';

import { PwaAlertModal } from './pwa-alert-modal';

interface LoginErrorTexts {
  title: string;
  body: string;
  tryAgainCta: string;
  createAccountCta: string;
}

interface LoginErrorModalProps {
  open: boolean;
  onClose: () => void;
  /** Acción de "Create Account" (navega al signup). */
  onCreateAccount?: () => void;
  texts: LoginErrorTexts;
}

/**
 * Modal de error de login (validación mock fallida). Es una instancia de
 * `PwaAlertModal`: "Try Again" cierra, "Create Account" lleva al signup.
 */
export function LoginErrorModal({ open, onClose, onCreateAccount, texts }: LoginErrorModalProps) {
  return (
    <PwaAlertModal
      open={open}
      onClose={onClose}
      title={texts.title}
      body={texts.body}
      primaryCta={texts.tryAgainCta}
      secondaryCta={texts.createAccountCta}
      onSecondary={onCreateAccount}
    />
  );
}
