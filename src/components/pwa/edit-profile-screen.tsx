'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { usePhotoSession } from '@/hooks/use-photo-session';
import { resolveAssetUrl } from '@/lib/asset-url';

import { S } from './mobile-layer';
import { PhotoSourceSheet } from './photo-source-sheet';
import { PwaPrimaryButton } from './pwa-button';
import { PwaSubHeader } from './pwa-sub-header';
import { ChevronDownIcon, FlagIcon, MailIcon, MapPinIcon, UserIcon } from './signup-icons';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface EditProfileTexts {
  title: string;
  editPhoto: string;
  changePasswordCta: string;
  saveCta: string;
  prefill: { name: string; email: string; state: string; zip: string; country: string };
}

interface EditProfileScreenProps {
  texts: EditProfileTexts;
  /** Foto inicial (mock); si no, avatar silueta. */
  photo?: string;
  photoSheetTexts: {
    takePhoto: string;
    chooseGallery: string;
    cancelSheet: string;
    sizeHint: string;
  };
}

function Field({
  top,
  left,
  width,
  icon,
  value,
  onChange,
  right,
}: {
  top: number;
  left: number;
  width: number;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="absolute rounded-[2px] bg-white/30" style={{ left, top, width, height: 46 }}>
      <div className="absolute text-white" style={{ left: 14, top: 14 }}>
        {icon}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute bg-transparent text-white outline-none"
        style={{ left: 46, right: 30, top: 0, bottom: 0, fontSize: 14, ...OPEN_SANS }}
      />
      {right ? (
        <div className="absolute text-white" style={{ right: 12, top: 13 }}>
          {right}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Edit Profile (`/pwa/profile/edit`) — pantalla 2. Avatar + EDIT PHOTO (PhotoSourceSheet),
 * campos prellenados (mock), CHANGE PASSWORD → /password, SAVE → vuelve a Profile, gear →
 * Settings. Patrón full-screen del Login (fondo + scrim + layer).
 */
export function EditProfileScreen({ texts, photo, photoSheetTexts }: EditProfileScreenProps) {
  const router = useRouter();
  // Foto: blob nuevo con revoke automático (C5); si no hay, el prefill `photo`.
  const { blobUrl, setBlob } = usePhotoSession();
  const photoUrl = blobUrl ?? photo ?? null;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState(texts.prefill.name);
  const [email, setEmail] = useState(texts.prefill.email);
  const [stateField, setStateField] = useState(texts.prefill.state);
  const [zip, setZip] = useState(texts.prefill.zip);
  const [country, setCountry] = useState(texts.prefill.country);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${resolveAssetUrl('assets/pwa/dashboard/hero.jpg')}")` }}
      />
      <div className="absolute inset-0 bg-black/80" />

      <div
        className="absolute left-0 top-0"
        style={{ width: 375, height: 812, transform: `scale(${S})`, transformOrigin: 'top left' }}
      >
        <PwaSubHeader
          title={texts.title}
          backHref="/pwa/profile"
          right={
            <button
              type="button"
              aria-label="Settings"
              onClick={() => router.push('/pwa/profile/settings')}
            >
              <svg
                width={22}
                height={22}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
              </svg>
            </button>
          }
        />

        {/* Avatar + EDIT PHOTO */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="absolute overflow-hidden rounded-full bg-cover bg-center"
          style={{
            left: 136,
            top: 116,
            width: 103,
            height: 103,
            backgroundColor: 'hsl(var(--foreground) / 0.25)',
            ...(photoUrl ? { backgroundImage: `url("${photoUrl}")` } : {}),
          }}
        >
          {!photoUrl ? (
            <span className="absolute left-1/2 top-[26px] -translate-x-1/2 text-white/90">
              <UserIcon size={40} />
            </span>
          ) : null}
          <span
            className="absolute bottom-0 left-0 flex w-full items-center justify-center bg-[hsl(var(--brand-primary))]/85 py-1.5 font-bold uppercase text-white"
            style={{ fontSize: 10, letterSpacing: 0.5, ...OPEN_SANS }}
          >
            {texts.editPhoto}
          </span>
        </button>

        {/* Campos prellenados */}
        <Field
          top={239}
          left={23}
          width={328}
          icon={<UserIcon />}
          value={name}
          onChange={setName}
        />
        <Field
          top={305}
          left={23}
          width={328}
          icon={<MailIcon />}
          value={email}
          onChange={setEmail}
        />
        <Field
          top={371}
          left={23}
          width={158}
          icon={<MapPinIcon />}
          value={stateField}
          onChange={setStateField}
        />
        <Field
          top={371}
          left={193}
          width={158}
          icon={<MapPinIcon />}
          value={zip}
          onChange={setZip}
        />
        <Field
          top={437}
          left={23}
          width={328}
          icon={<FlagIcon />}
          value={country}
          onChange={setCountry}
          right={<ChevronDownIcon size={18} />}
        />

        {/* CHANGE PASSWORD (outline) */}
        <PwaPrimaryButton
          variant="outline"
          onClick={() => router.push('/pwa/profile/password')}
          className="absolute rounded-[2px] uppercase"
          style={{ left: 22, top: 565, width: 328, height: 46, fontSize: 14, letterSpacing: 0.5 }}
        >
          {texts.changePasswordCta}
        </PwaPrimaryButton>
        {/* SAVE */}
        <PwaPrimaryButton
          onClick={() => router.push('/pwa/profile')}
          className="absolute rounded-[2px] uppercase"
          style={{ left: 23, top: 633, width: 328, height: 46, fontSize: 14, letterSpacing: 0.5 }}
        >
          {texts.saveCta}
        </PwaPrimaryButton>
      </div>

      <PhotoSourceSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        texts={photoSheetTexts}
        onPicked={setBlob}
      />
    </div>
  );
}
