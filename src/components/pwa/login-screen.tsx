'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { resolveAssetUrl } from '@/lib/asset-url';

import { AppleSocialIcon, FacebookSocialIcon, GoogleSocialIcon } from './social-icons';

/** El XD está a 375×812; el canvas es 390×844 → se escala el layer ×1.04. */
const SCALE = 390 / 375;
/** Fuente Open Sans (la usa el XD en labels y placeholders). */
const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface LoginTexts {
  loginWith: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  forgotPassword: string;
  loginCta: string;
  createAccountCta: string;
  skipLogin: string;
}

interface LoginScreenProps {
  /** Imagen de fondo fullscreen. */
  background: string;
  /** Alt del logo. */
  logoAlt: string;
  /** Textos de UI (desde config — cero hardcoded). */
  texts: LoginTexts;
  /** Destino tras Login/Skip (Dashboard). Si se omite, los botones no navegan aún. */
  dashboardHref?: string;
}

function MailIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      className="absolute h-4 w-4 text-white"
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      className="absolute h-4 w-4 text-white"
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

/**
 * Login de la PWA — pantalla 02 (`/pwa/login`).
 *
 * Render verbatim del XD (`designs/mobile-pwa/02-login.svg`, canvas 375×812 →
 * layer escalado ×1.04 a 390×844). Auth mockeado (inputs locales, sin backend).
 *
 * White-label: fondo + logo desde config/branding; botón LOGIN usa
 * `--pwa-primary`; textos desde `config.features.pwa.login`. El status bar del
 * XD (placeholder del SO) no se dibuja.
 */
export function LoginScreen({ background, logoAlt, texts, dashboardHref }: LoginScreenProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const goToDashboard = () => {
    if (dashboardHref) router.push(dashboardHref);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Fondo fullscreen + scrim negro 80%. */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${resolveAssetUrl(background)}")` }}
      />
      <div className="absolute inset-0 bg-black/80" />

      {/* Layer 375×812 con coords verbatim del XD, escalado al canvas 390×844. */}
      <div
        className="absolute left-0 top-0"
        style={{
          width: 375,
          height: 812,
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Logo */}
        <div className="absolute" style={{ left: 62, top: 122, width: 251.4, height: 46.2 }}>
          <TrueOmniLogo className="h-full w-full text-white" title={logoAlt} slot="idle" />
        </div>

        {/* LOGIN WITH */}
        <div
          className="absolute flex items-center justify-center font-bold uppercase text-white"
          style={{
            left: 0,
            top: 221.7,
            width: 375,
            height: 19,
            fontSize: 14,
            letterSpacing: 0.5,
            ...OPEN_SANS,
          }}
        >
          {texts.loginWith}
        </div>

        {/* Botones sociales (40×40) */}
        <div className="absolute" style={{ left: 100, top: 272.9 }}>
          <AppleSocialIcon />
        </div>
        <div className="absolute" style={{ left: 166, top: 271.9 }}>
          <FacebookSocialIcon />
        </div>
        <div className="absolute" style={{ left: 228, top: 271.9 }}>
          <GoogleSocialIcon />
        </div>

        {/* Campo Email */}
        <div
          className="absolute rounded-[2px] bg-white/30"
          style={{ left: 24, top: 349, width: 328, height: 46 }}
        >
          <MailIcon style={{ left: 14, top: 15 }} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={texts.emailPlaceholder}
            className="absolute bg-transparent text-white outline-none placeholder:text-white"
            style={{ left: 52, right: 14, top: 0, bottom: 0, fontSize: 14, ...OPEN_SANS }}
          />
        </div>

        {/* Campo Password */}
        <div
          className="absolute rounded-[2px] bg-white/30"
          style={{ left: 24, top: 415, width: 328, height: 46 }}
        >
          <LockIcon style={{ left: 14, top: 15 }} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={texts.passwordPlaceholder}
            className="absolute bg-transparent text-white outline-none placeholder:text-white"
            style={{ left: 52, right: 14, top: 0, bottom: 0, fontSize: 14, ...OPEN_SANS }}
          />
        </div>

        {/* Forgot your password? */}
        <button
          type="button"
          className="absolute flex items-center font-medium text-white underline"
          style={{ left: 24.5, top: 471, height: 17, fontSize: 12, ...OPEN_SANS }}
        >
          {texts.forgotPassword}
        </button>

        {/* LOGIN (acción primaria) */}
        <button
          type="button"
          onClick={goToDashboard}
          className="absolute flex items-center justify-center rounded-[4px] bg-[hsl(var(--pwa-primary))] font-bold uppercase text-white"
          style={{ left: 23.1, top: 569, width: 328, height: 44, fontSize: 14, letterSpacing: 0.5 }}
        >
          {texts.loginCta}
        </button>

        {/* CREATE NEW ACCOUNT (outline) */}
        <button
          type="button"
          className="absolute flex items-center justify-center rounded-[4px] border border-white font-bold uppercase text-white"
          style={{ left: 23, top: 633, width: 328, height: 44, fontSize: 14, letterSpacing: 0.5 }}
        >
          {texts.createAccountCta}
        </button>

        {/* Skip Login */}
        <button
          type="button"
          onClick={goToDashboard}
          className="absolute flex items-center justify-center font-bold text-white underline"
          style={{ left: 0, top: 753, width: 375, height: 19, fontSize: 14, ...OPEN_SANS }}
        >
          {texts.skipLogin}
        </button>
      </div>
    </div>
  );
}
