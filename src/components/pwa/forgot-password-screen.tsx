'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';

import { S } from './mobile-layer';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/** Sobre/email del campo (mismo glyph stroke que el Login, por consistencia). */
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

interface ForgotPasswordTexts {
  title: string;
  body: string;
  emailPlaceholder: string;
  resetCta: string;
  createAccountCta: string;
}

interface ForgotPasswordScreenProps {
  background: string;
  texts: ForgotPasswordTexts;
  /** Destino al pulsar RESET PASSWORD (paso 2). */
  checkEmailHref: string;
}

/**
 * Forgot Your Password? — paso 1 del flujo (`/pwa/forgot-password`), abierto desde
 * el link "Forgot your password?" del Login.
 *
 * Render verbatim del XD (`1-Forgot Password - Email.svg`, canvas 375×812 → layer
 * escalado ×1.04). Mismo patrón full-screen que el Login: fondo + scrim 80% + layer.
 * Auth mockeado: "RESET PASSWORD" navega a "Check Your Email". "Create New Account"
 * queda no-op hasta que exista el Sign Up.
 */
export function ForgotPasswordScreen({
  background,
  texts,
  checkEmailHref,
}: ForgotPasswordScreenProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${resolveAssetUrl(background)}")` }}
      />
      <div className="absolute inset-0 bg-black/80" />

      {/* Layer 375×812 con coords verbatim del XD, escalado al canvas 390×844. */}
      <div
        className="absolute left-0 top-0"
        style={{ width: 375, height: 812, transform: `scale(${S})`, transformOrigin: 'top left' }}
      >
        {/* Candado (verbatim del SVG, centrado ~187.5) */}
        <svg
          className="absolute text-white"
          style={{ left: 142, top: 96 }}
          width={91.589}
          height={111.008}
          viewBox="0 0 91.589 111.008"
          fill="currentColor"
          aria-hidden
        >
          <path d="M7.231,111.008A7.249,7.249,0,0,1,0,103.768V45.851a7.249,7.249,0,0,1,7.231-7.24H84.358a7.25,7.25,0,0,1,7.231,7.24v57.917a7.25,7.25,0,0,1-7.231,7.24ZM69.9,33.785V28.958a24.1,24.1,0,1,0-48.2,0v4.827h-4.82V28.958a28.923,28.923,0,1,1,57.846,0v4.827Z" />
        </svg>

        {/* Título */}
        <div
          className="absolute text-center text-white"
          style={{ left: 0, top: 232, width: 375, fontSize: 24, lineHeight: 1, ...OPEN_SANS }}
        >
          {texts.title}
        </div>

        {/* Body (2 líneas centradas) */}
        <div
          className="absolute text-center text-white"
          style={{
            left: 47.5,
            top: 280,
            width: 280,
            fontSize: 14,
            lineHeight: '19px',
            ...OPEN_SANS,
          }}
        >
          {texts.body}
        </div>

        {/* Campo Email */}
        <div
          className="absolute rounded-[2px] bg-white/30"
          style={{ left: 24, top: 364, width: 328, height: 46 }}
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

        {/* RESET PASSWORD */}
        <button
          type="button"
          onClick={() => router.push(checkEmailHref)}
          className="absolute flex items-center justify-center rounded-[2px] bg-[hsl(var(--pwa-primary))] font-bold uppercase text-white"
          style={{ left: 24, top: 452, width: 328, height: 46, fontSize: 14, letterSpacing: 0.5 }}
        >
          {texts.resetCta}
        </button>

        {/* Create New Account → signup */}
        <button
          type="button"
          onClick={() => router.push('/pwa/create-account')}
          className="absolute flex items-center justify-center font-semibold text-white underline"
          style={{ left: 0, top: 595, width: 375, height: 17, fontSize: 14, ...OPEN_SANS }}
        >
          {texts.createAccountCta}
        </button>
      </div>
    </div>
  );
}
