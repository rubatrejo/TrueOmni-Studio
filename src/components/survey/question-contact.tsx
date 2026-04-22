'use client';

import { useState } from 'react';

import { OnScreenKeyboard, type KeyboardKey } from '@/components/home/on-screen-keyboard';
import { NumericKeypad, type NumericKey } from '@/components/listings/numeric-keypad';

interface Props {
  email: boolean;
  phone: boolean;
  value: { email?: string; phone?: string };
  onChange: (next: { email?: string; phone?: string }) => void;
  emailLabel: string;
  phoneLabel: string;
  disclaimer: string;
}

type Focus = 'email' | 'phone';

/**
 * Paso extra de contacto. Email (QWERTY) y/o phone (NumericKeypad).
 * Sólo un keyboard visible a la vez — determinado por `focus`. Ambos opcionales.
 */
export function QuestionContact({
  email,
  phone,
  value,
  onChange,
  emailLabel,
  phoneLabel,
  disclaimer,
}: Props) {
  const initialFocus: Focus = email ? 'email' : 'phone';
  const [focus, setFocus] = useState<Focus>(initialFocus);
  const [shift, setShift] = useState(false);

  const currentEmail = value.email ?? '';
  const currentPhone = value.phone ?? '';

  const handleEmailKey = (k: KeyboardKey) => {
    if (k === 'BACKSPACE') {
      onChange({ ...value, email: currentEmail.slice(0, -1) });
      return;
    }
    if (k === 'SHIFT') {
      setShift((s) => !s);
      return;
    }
    if (k === 'SPACE') return; // email no space
    if (k === 'AT') {
      onChange({ ...value, email: currentEmail + '@' });
      return;
    }
    if (k === 'DOT_COM') {
      onChange({ ...value, email: currentEmail + '.com' });
      return;
    }
    if (k === 'ENTER' || k === 'CLOSE' || k === 'SYMBOLS') return;
    if (typeof k === 'string' && k.length === 1) {
      onChange({ ...value, email: currentEmail + k });
      if (shift) setShift(false);
    }
  };

  const handlePhoneKey = (k: NumericKey) => {
    if (k === 'KEYBOARD' || k === 'SEND') return;
    if (typeof k === 'string' && k.length === 1) {
      onChange({ ...value, phone: currentPhone + k });
    }
  };

  return (
    <div className="flex flex-col items-center" style={{ gap: '16px' }}>
      <div className="flex flex-col" style={{ gap: '12px', width: '100%', maxWidth: '720px' }}>
        {email ? (
          <div>
            <label
              className="mb-2 block font-sans font-semibold"
              style={{
                fontSize: '16px',
                color: 'hsl(var(--primary-foreground))',
                opacity: focus === 'email' ? 1 : 0.75,
              }}
            >
              {emailLabel}
            </label>
            <button
              type="button"
              onClick={() => setFocus('email')}
              className="flex w-full items-center rounded-full font-sans transition"
              style={{
                height: '56px',
                paddingLeft: '24px',
                paddingRight: '24px',
                fontSize: '20px',
                backgroundColor: 'hsl(var(--primary-foreground) / 0.1)',
                border: `2px solid ${
                  focus === 'email' ? 'hsl(var(--accent))' : 'hsl(var(--primary-foreground) / 0.3)'
                }`,
                color: 'hsl(var(--primary-foreground))',
                textAlign: 'left',
              }}
            >
              {currentEmail || <span style={{ opacity: 0.5 }}>tap to type…</span>}
            </button>
          </div>
        ) : null}
        {phone ? (
          <div>
            <label
              className="mb-2 block font-sans font-semibold"
              style={{
                fontSize: '16px',
                color: 'hsl(var(--primary-foreground))',
                opacity: focus === 'phone' ? 1 : 0.75,
              }}
            >
              {phoneLabel}
            </label>
            <button
              type="button"
              onClick={() => setFocus('phone')}
              className="flex w-full items-center rounded-full font-sans transition"
              style={{
                height: '56px',
                paddingLeft: '24px',
                paddingRight: '24px',
                fontSize: '20px',
                backgroundColor: 'hsl(var(--primary-foreground) / 0.1)',
                border: `2px solid ${
                  focus === 'phone' ? 'hsl(var(--accent))' : 'hsl(var(--primary-foreground) / 0.3)'
                }`,
                color: 'hsl(var(--primary-foreground))',
                textAlign: 'left',
              }}
            >
              {currentPhone || <span style={{ opacity: 0.5 }}>tap to type…</span>}
            </button>
          </div>
        ) : null}
      </div>
      <p
        className="text-center font-sans"
        style={{
          fontSize: '13px',
          opacity: 0.65,
          color: 'hsl(var(--primary-foreground))',
          maxWidth: '560px',
        }}
      >
        {disclaimer}
      </p>
      {focus === 'email' && email ? (
        <div
          style={{ transform: 'scale(0.78)', transformOrigin: 'top center', marginBottom: '-44px' }}
        >
          <OnScreenKeyboard shift={shift} onKey={handleEmailKey} />
        </div>
      ) : null}
      {focus === 'phone' && phone ? (
        <div
          style={{ transform: 'scale(0.82)', transformOrigin: 'top center', marginBottom: '-30px' }}
        >
          <NumericKeypad onKey={handlePhoneKey} />
        </div>
      ) : null}
    </div>
  );
}
