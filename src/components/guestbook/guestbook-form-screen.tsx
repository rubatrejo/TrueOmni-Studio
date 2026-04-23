'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { OnScreenKeyboard, type KeyboardKey } from '@/components/home/on-screen-keyboard';
import { NumericKeypad, type NumericKey } from '@/components/listings/numeric-keypad';
import type { GuestbookCountry } from '@/lib/config';

import { GuestbookCountryDropdown } from './guestbook-country-dropdown';
import { GuestbookFormFields, type GuestbookField } from './guestbook-form-fields';

/**
 * Pantalla 1-2 del Guestbook: form + checkboxes + NEXT + teclado.
 *
 * El teclado cambia según el campo enfocado:
 *   - name, email, phone → QWERTY (OnScreenKeyboard).
 *   - zip → NumericKeypad.
 *   - country → overlay dropdown.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ZIP_RE = /^[0-9A-Za-z -]{3,10}$/;

export interface GuestbookFormData {
  name: string;
  email: string;
  phone: string;
  countryCode: string | null;
  zip: string;
  acceptPrivacy: boolean;
  wantUpdates: boolean;
}

export function GuestbookFormScreen({
  header,
  title,
  labels,
  countries,
  countrySelectTitle,
  ctaLabel,
  onSubmit,
  onBack,
}: {
  header: ReactNode;
  title: string;
  labels: {
    name: string;
    email: string;
    phone: string;
    country: string;
    zip: string;
    termsPrivacy: string;
    termsUpdates: string;
  };
  countries: readonly GuestbookCountry[];
  countrySelectTitle: string;
  ctaLabel: string;
  onSubmit: (data: GuestbookFormData) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState<GuestbookCountry | null>(null);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [wantUpdates, setWantUpdates] = useState(false);

  const [focused, setFocused] = useState<GuestbookField | 'country' | null>('name');
  const [shift, setShift] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  void onBack;

  // TODO Fase 3.14 QA: validación completa (Name+Email+Zip+Privacy).
  // Temporal durante pruebas: solo Zip Code requerido.
  const valid = useMemo(() => ZIP_RE.test(zip), [zip]);
  void name;
  void email;
  void acceptPrivacy;

  // Auto-cerrar el shift tras un keypress en caps-once mode sería más UX-rich
  // pero para v1 dejamos el toggle manual.
  void setShift;

  const handleQwerty = (k: KeyboardKey) => {
    if (focused === 'name' || focused === 'email' || focused === 'phone') {
      const setter = focused === 'name' ? setName : focused === 'email' ? setEmail : setPhone;
      if (k === 'BACKSPACE') {
        setter((v) => v.slice(0, -1));
        return;
      }
      if (k === 'SHIFT') {
        setShift((s) => !s);
        return;
      }
      if (k === 'SPACE') {
        setter((v) => v + ' ');
        return;
      }
      if (k === 'ENTER') {
        // mover foco al siguiente campo
        const order: GuestbookField[] = ['name', 'email', 'phone', 'zip'];
        const idx = order.indexOf(focused as GuestbookField);
        const next = order[idx + 1];
        if (next) setFocused(next);
        return;
      }
      if (k === 'AT') {
        setter((v) => v + '@');
        return;
      }
      if (k === 'DOT_COM') {
        setter((v) => v + '.com');
        return;
      }
      if (k === 'CLOSE' || k === 'SYMBOLS') return;
      if (typeof k === 'string' && k.length === 1) {
        setter((v) => v + k);
        if (shift) setShift(false);
      }
    }
  };

  const handleNumeric = (k: NumericKey) => {
    if (focused !== 'zip') return;
    if (k === 'SEND') {
      // Finalizar en keypad = mover a submit si válido
      if (valid) doSubmit();
      return;
    }
    if (k === 'KEYBOARD') {
      setFocused('name');
      return;
    }
    setZip((v) => (v + k).slice(0, 10));
  };

  // Backspace en numeric: tap-to-delete en el input (NumericKeypad no emite BACKSPACE).
  const onZipDelete = () => setZip((v) => v.slice(0, -1));

  const doSubmit = () => {
    if (!valid) return;
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      countryCode: country?.code ?? null,
      zip: zip.trim(),
      acceptPrivacy,
      wantUpdates,
    });
  };

  useEffect(() => {
    // Reset shift al cambiar de campo
    setShift(false);
  }, [focused]);

  return (
    <div className="relative flex h-full w-full flex-col">
      {header}

      <div
        className="flex flex-col"
        style={{
          paddingTop: '32px',
          paddingLeft: '60px',
          paddingRight: '60px',
          paddingBottom: '40px',
          rowGap: '22px',
          backgroundColor: '#f8f8f8',
        }}
      >
        <h1
          className="text-center font-sans"
          style={{
            fontSize: '40px',
            lineHeight: '42px',
            fontWeight: 700,
            color: '#004f8b',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h1>

        <div onClick={(e) => e.stopPropagation()}>
          <GuestbookFormFields
            values={{
              name,
              email,
              phone: phone,
              zip: focused === 'zip' && zip.length === 0 ? '' : zip,
            }}
            focused={focused}
            labels={labels}
            selectedCountry={country}
            onFocus={(f) => setFocused(f)}
            onOpenCountry={() => {
              setFocused('country');
              setCountryOpen(true);
            }}
          />
        </div>

        <div
          className="flex flex-col"
          style={{ rowGap: '12px', paddingLeft: '32px', paddingTop: '6px' }}
        >
          <Checkbox
            checked={acceptPrivacy}
            label={labels.termsPrivacy}
            onChange={setAcceptPrivacy}
          />
          <Checkbox checked={wantUpdates} label={labels.termsUpdates} onChange={setWantUpdates} />
        </div>

        <div className="flex items-center justify-center" style={{ marginTop: '8px' }}>
          <button
            type="button"
            onClick={doSubmit}
            disabled={!valid}
            className="font-sans text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            style={{
              width: '260px',
              height: '68px',
              borderRadius: '8px',
              backgroundColor: valid ? '#1796d6' : '#b9c4cd',
              fontSize: '22px',
              lineHeight: '22px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: valid ? 'pointer' : 'not-allowed',
            }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>

      {/* Teclado pegado al bottom, condicional por campo */}
      <div
        className="absolute inset-x-0"
        style={{
          bottom: 0,
          backgroundColor: '#ffffff',
          boxShadow: '0 -8px 20px rgba(0,0,0,0.12)',
        }}
      >
        {focused === 'zip' ? (
          <div className="flex w-full justify-center" style={{ padding: '22px 0 28px 0' }}>
            <div className="flex flex-col items-center" style={{ rowGap: '14px' }}>
              <button
                type="button"
                onClick={onZipDelete}
                disabled={zip.length === 0}
                className="font-sans focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                style={{
                  fontSize: '14px',
                  color: zip.length > 0 ? '#1796d6' : '#b9c4cd',
                  padding: '4px 12px',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                }}
              >
                ⌫ DELETE LAST DIGIT
              </button>
              <NumericKeypad onKey={handleNumeric} />
            </div>
          </div>
        ) : focused === 'name' || focused === 'email' || focused === 'phone' ? (
          <OnScreenKeyboard shift={shift} onKey={handleQwerty} />
        ) : null}
      </div>

      <GuestbookCountryDropdown
        open={countryOpen}
        countries={countries}
        selected={country}
        title={countrySelectTitle}
        onSelect={(c) => {
          setCountry(c);
          setCountryOpen(false);
          setFocused('zip');
        }}
        onCancel={() => {
          setCountryOpen(false);
          setFocused('name');
        }}
      />
    </div>
  );
}

function Checkbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center font-sans focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
      style={{ columnGap: '12px', textAlign: 'left' }}
    >
      <span
        aria-hidden
        className="inline-flex items-center justify-center"
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          border: '1.5px solid #6e6e6e',
          backgroundColor: checked ? '#1796d6' : '#ffffff',
          flexShrink: 0,
        }}
      >
        {checked ? (
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              d="M5 12l5 5 9-11"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span
        style={{
          fontSize: '16px',
          lineHeight: '18px',
          fontWeight: 600,
          color: '#3a3a3a',
        }}
      >
        {label}
      </span>
    </button>
  );
}
