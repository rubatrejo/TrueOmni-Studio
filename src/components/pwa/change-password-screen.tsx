'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';

import { S } from './mobile-layer';
import { PwaAlertModal } from './pwa-alert-modal';
import { PwaPrimaryButton } from './pwa-button';
import { LockIcon } from './signup-icons';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const BG = 'assets/pwa/dashboard/hero.jpg';

const LOCK_PATH =
  'M7.231,111.008A7.249,7.249,0,0,1,0,103.768V45.851a7.249,7.249,0,0,1,7.231-7.24H84.358a7.25,7.25,0,0,1,7.231,7.24v57.917a7.25,7.25,0,0,1-7.231,7.24ZM69.9,33.785V28.958a24.1,24.1,0,1,0-48.2,0v4.827h-4.82V28.958a28.923,28.923,0,1,1,57.846,0v4.827Z';

interface ChangePasswordTexts {
  title: string;
  body: string;
  newPlaceholder: string;
  confirmPlaceholder: string;
  helper: string;
  establishCta: string;
  error: { title: string; body: string; tryAgainCta: string; closeCta: string };
  success: { title: string; doneCta: string };
}

function Field({
  top,
  icon,
  ...input
}: { top: number; icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div
      className="absolute rounded-[2px] bg-white/30"
      style={{ left: 24, top, width: 328, height: 46 }}
    >
      <div className="absolute text-white" style={{ left: 14, top: 14 }}>
        {icon}
      </div>
      <input
        className="absolute bg-transparent text-white outline-none placeholder:text-white/90"
        style={{ left: 46, right: 12, top: 0, bottom: 0, fontSize: 14, ...OPEN_SANS }}
        {...input}
      />
    </div>
  );
}

/**
 * Change Your Password (`/pwa/profile/password`) — pantallas 3 (form) + 4 (error alert,
 * `PwaAlertModal`) + 5 (success state). Validación mock: New + Confirm coinciden y no vacíos
 * → success; si no → error. DONE vuelve a Edit Profile.
 */
export function ChangePasswordScreen({
  texts,
  doneHref,
}: {
  texts: ChangePasswordTexts;
  doneHref: string;
}) {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errorOpen, setErrorOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  const establish = () => {
    if (pw.length === 0 || pw !== confirm) {
      setErrorOpen(true);
      return;
    }
    setSuccess(true);
  };

  const Background = (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${resolveAssetUrl(BG)}")` }}
      />
      <div className="absolute inset-0 bg-black/80" />
    </>
  );

  // Pantalla 5 — success
  if (success) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-background">
        {Background}
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 812, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <svg
            className="absolute"
            style={{ left: 137, top: 120 }}
            width={100}
            height={100}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <div
            className="absolute text-center text-white"
            style={{ left: 0, top: 304, width: 375, fontSize: 24, lineHeight: 1, ...OPEN_SANS }}
          >
            {texts.success.title}
          </div>
          <PwaPrimaryButton
            onClick={() => router.push(doneHref)}
            className="absolute rounded-[2px] uppercase"
            style={{ left: 24, top: 720, width: 328, height: 46, fontSize: 14, letterSpacing: 0.5 }}
          >
            {texts.success.doneCta}
          </PwaPrimaryButton>
        </div>
      </div>
    );
  }

  // Pantallas 3/4 — form (+ error modal)
  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {Background}
      <div
        className="absolute left-0 top-0"
        style={{ width: 375, height: 812, transform: `scale(${S})`, transformOrigin: 'top left' }}
      >
        {/* Back */}
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.push(doneHref)}
          className="absolute"
          style={{ left: 12, top: 46, width: 40, height: 40 }}
        >
          <svg
            className="mx-auto"
            width={11.87}
            height={20.36}
            viewBox="0 0 11.87 20.36"
            fill="#fff"
            aria-hidden
          >
            <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
          </svg>
        </button>

        {/* Lock */}
        <svg
          className="absolute text-white"
          style={{ left: 142, top: 139 }}
          width={91.589}
          height={111.008}
          viewBox="0 0 91.589 111.008"
          fill="currentColor"
          aria-hidden
        >
          <path d={LOCK_PATH} />
        </svg>

        {/* Título + body */}
        <div
          className="absolute text-center text-white"
          style={{ left: 0, top: 278, width: 375, fontSize: 24, lineHeight: 1, ...OPEN_SANS }}
        >
          {texts.title}
        </div>
        <div
          className="absolute text-center font-bold text-white"
          style={{ left: 40, top: 322, width: 295, fontSize: 14, lineHeight: '19px', ...OPEN_SANS }}
        >
          {texts.body}
        </div>

        {/* Fields */}
        <Field
          top={402}
          icon={<LockIcon />}
          type="password"
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder={texts.newPlaceholder}
        />
        <Field
          top={468}
          icon={<LockIcon />}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={texts.confirmPlaceholder}
        />

        {/* Helper */}
        <div
          className="absolute text-center text-white"
          style={{ left: 40, top: 530, width: 295, fontSize: 12, lineHeight: '17px', ...OPEN_SANS }}
        >
          {texts.helper}
        </div>

        {/* ESTABLISH NEW PASSWORD */}
        <PwaPrimaryButton
          onClick={establish}
          className="absolute rounded-[2px] uppercase"
          style={{ left: 59, top: 633, width: 258, height: 46, fontSize: 14, letterSpacing: 0.5 }}
        >
          {texts.establishCta}
        </PwaPrimaryButton>
      </div>

      <PwaAlertModal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        title={texts.error.title}
        body={texts.error.body}
        primaryCta={texts.error.tryAgainCta}
        secondaryCta={texts.error.closeCta}
        onSecondary={() => setErrorOpen(false)}
      />
    </div>
  );
}
