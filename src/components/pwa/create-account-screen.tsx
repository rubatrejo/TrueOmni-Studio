'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { GuestbookCountry } from '@/lib/config';

import { S } from './mobile-layer';
import { PwaAlertModal } from './pwa-alert-modal';
import {
  ChevronDownIcon,
  FlagIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  UserIcon,
} from './signup-icons';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CreateAccountTexts {
  title: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  countryPlaceholder: string;
  statePlaceholder: string;
  zipPlaceholder: string;
  passwordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  helperText: string;
  signUpCta: string;
  countrySheetTitle: string;
  error: { title: string; body: string; okCta: string };
}

interface CreateAccountScreenProps {
  background: string;
  logoAlt: string;
  texts: CreateAccountTexts;
  countries: GuestbookCountry[];
  /** Destino tras SIGN UP válido (paso 2). */
  photoHref: string;
}

/** Chevron-left del header (verbatim del XD). */
function BackChevron() {
  return (
    <svg width={11.87} height={20.36} viewBox="0 0 11.87 20.36" fill="#fff" aria-hidden>
      <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
    </svg>
  );
}

/** Campo de texto con icono (patrón del Login: bg-white/30 + icono + input). */
function Field({
  left,
  top,
  width,
  icon,
  ...input
}: {
  left: number;
  top: number;
  width: number;
  icon: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="absolute rounded-[2px] bg-white/30" style={{ left, top, width, height: 46 }}>
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
 * Create Account — paso 1 del flujo de registro (`/pwa/create-account`).
 *
 * Render verbatim del XD (`1-Create Account.svg`, 375×812 → layer ×1.04). Patrón
 * full-screen del Login (fondo + scrim + layer). Auth mockeado: SIGN UP valida campos
 * (requeridos + email + passwords coinciden); si pasa navega al paso 2 (Upload Picture).
 */
export function CreateAccountScreen({
  background,
  logoAlt,
  texts,
  countries,
  photoHref,
}: CreateAccountScreenProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<GuestbookCountry | null>(null);
  const [stateField, setStateField] = useState('');
  const [zip, setZip] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  useEscapeToClose(sheetOpen, () => setSheetOpen(false));

  // Vuelve a la pantalla anterior; si se entró directo a la URL (sin historial), al Login.
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/pwa/login');
  };

  const handleSignUp = () => {
    const valid =
      name.trim() &&
      EMAIL_RE.test(email.trim()) &&
      country &&
      stateField.trim() &&
      zip.trim() &&
      password.length > 0 &&
      password === confirm;
    if (!valid) {
      setErrorOpen(true);
      return;
    }
    router.push(`${photoHref}?name=${encodeURIComponent(name.trim())}`);
  };

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
        {/* Header brand: back + título centrado */}
        <div
          className="absolute left-0 top-0 bg-[hsl(var(--brand-primary))]"
          style={{ width: 375, height: 88 }}
        />
        {/* Título: pointer-events-none para no tapar el botón de back (mismo z, va después en el DOM). */}
        <div
          className="pointer-events-none absolute text-center font-bold text-white"
          style={{
            left: 0,
            top: 50,
            width: 375,
            fontSize: 17,
            letterSpacing: '-0.024em',
            ...OPEN_SANS,
          }}
        >
          {texts.title}
        </div>
        <button
          type="button"
          aria-label="Back"
          onClick={handleBack}
          className="absolute flex items-center justify-center"
          style={{ left: 12, top: 46, width: 40, height: 40 }}
        >
          <BackChevron />
        </button>

        {/* Logo del cliente */}
        <div className="absolute" style={{ left: 89, top: 122.5, width: 197.269, height: 36.869 }}>
          <TrueOmniLogo className="h-full w-full text-white" title={logoAlt} slot="default" />
        </div>

        {/* Campos (offset XD 24,188) */}
        <Field
          left={24}
          top={188}
          width={328}
          icon={<UserIcon />}
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={texts.namePlaceholder}
        />
        <Field
          left={24}
          top={254}
          width={328}
          icon={<MailIcon />}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={texts.emailPlaceholder}
        />

        {/* Country (abre bottom-sheet) */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="absolute rounded-[2px] bg-white/30 text-left"
          style={{ left: 24, top: 320, width: 328, height: 46 }}
        >
          <div className="absolute text-white" style={{ left: 14, top: 14 }}>
            <FlagIcon />
          </div>
          <span
            className="absolute text-white"
            style={{ left: 46, top: 14, fontSize: 14, ...OPEN_SANS }}
          >
            {country ? country.name : texts.countryPlaceholder}
          </span>
          <div className="absolute text-white" style={{ right: 14, top: 13 }}>
            <ChevronDownIcon size={18} />
          </div>
        </button>

        <Field
          left={24}
          top={386}
          width={158}
          icon={<MapPinIcon />}
          type="text"
          value={stateField}
          onChange={(e) => setStateField(e.target.value)}
          placeholder={texts.statePlaceholder}
        />
        <Field
          left={194}
          top={386}
          width={158}
          icon={<MapPinIcon />}
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder={texts.zipPlaceholder}
        />
        <Field
          left={24}
          top={452}
          width={328}
          icon={<LockIcon />}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={texts.passwordPlaceholder}
        />
        <Field
          left={24}
          top={518}
          width={328}
          icon={<LockIcon />}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={texts.confirmPasswordPlaceholder}
        />

        {/* Helper text (centrado, 2 líneas) */}
        <div
          className="absolute text-center text-white"
          style={{ left: 32, top: 586, width: 311, fontSize: 14, lineHeight: '19px', ...OPEN_SANS }}
        >
          {texts.helperText}
        </div>

        {/* SIGN UP */}
        <button
          type="button"
          onClick={handleSignUp}
          className="absolute flex items-center justify-center rounded-[2px] bg-[hsl(var(--pwa-primary))] font-bold uppercase text-white"
          style={{ left: 24, top: 650, width: 328, height: 46, fontSize: 14, letterSpacing: 0.5 }}
        >
          {texts.signUpCta}
        </button>
      </div>

      {/* Bottom-sheet de país */}
      {sheetOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={texts.countrySheetTitle}
          className="absolute inset-0 z-20 flex items-end justify-center"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50 focus:outline-none"
            tabIndex={-1}
          />
          <div className="relative max-h-[70%] w-full overflow-y-auto rounded-t-3xl bg-background p-6 pb-8">
            <h2 className="mb-3 font-bold text-foreground" style={{ fontSize: 18, ...OPEN_SANS }}>
              {texts.countrySheetTitle}
            </h2>
            <ul>
              {countries.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => {
                      setCountry(c);
                      setSheetOpen(false);
                    }}
                    className="flex w-full items-center justify-between py-3 text-left text-foreground"
                    style={{ fontSize: 15, ...OPEN_SANS }}
                  >
                    <span>{c.name}</span>
                    {country?.code === c.code ? (
                      <span className="text-[hsl(var(--pwa-primary))]">✓</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* Modal de validación */}
      <PwaAlertModal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        title={texts.error.title}
        body={texts.error.body}
        primaryCta={texts.error.okCta}
      />
    </div>
  );
}
