'use client';

import { useEffect, useState } from 'react';

import { NumericKeypad, type NumericKey } from './numeric-keypad';
import { CancelSendButtons, SendModalChrome, TermsCheckbox } from './send-modal-chrome';

/** Mínimo 10 dígitos para considerarlo válido (NANP-ish). */
function isValidPhone(digits: string) {
  return digits.replace(/\D/g, '').length >= 10;
}

export function SendToPhoneModal({
  open,
  listingTitle,
  onCancel,
  onSent,
  onSwitchToKeyboard,
}: {
  open: boolean;
  listingTitle: string;
  onCancel: () => void;
  onSent: (phone: string) => void;
  /** Si se pulsa keyboard-toggle del numpad, el componente padre puede abrir el email modal. */
  onSwitchToKeyboard?: () => void;
}) {
  const [value, setValue] = useState('');
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    if (open) {
      setValue('');
      setAccepted(true);
    }
  }, [open]);

  const valid = isValidPhone(value) && accepted;

  const handleKey = (k: NumericKey) => {
    if (k === 'SEND') {
      if (valid) handleSend();
      return;
    }
    if (k === 'KEYBOARD') {
      onSwitchToKeyboard?.();
      return;
    }
    // 0-9, '.', '-', '$' — solo concat
    setValue((v) => v + k);
  };

  const handleSend = () => {
    if (!valid) return;
    void listingTitle;
    onSent(value);
  };

  return (
    <SendModalChrome
      open={open}
      onCancel={onCancel}
      title="Send to phone"
      footer={
        <div className="flex w-full justify-center">
          <div
            style={{
              display: 'inline-flex',
              padding: '26px 26px 32px 26px',
              backgroundColor: '#ffffff',
              borderRadius: '12px 12px 0 0',
              boxShadow: '0 -8px 20px rgba(0,0,0,0.15)',
            }}
          >
            <NumericKeypad onKey={handleKey} />
          </div>
        </div>
      }
    >
      <div
        className="font-sans text-black"
        style={{ fontSize: '16px', lineHeight: '16px', fontWeight: 700, marginBottom: '12px' }}
      >
        Enter your phone number
      </div>
      <div className="flex" style={{ columnGap: '12px', marginBottom: '20px' }}>
        {/* Country code (readonly en v1) */}
        <div
          className="flex items-center justify-between font-sans"
          aria-label="Código de país"
          style={{
            width: '170px',
            height: '56px',
            border: '1px solid #bfbfbf',
            borderRadius: '6px',
            padding: '0 16px',
            fontSize: '20px',
            color: '#333',
          }}
        >
          <span>USA (+1)</span>
          <span
            aria-hidden
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              fontSize: '10px',
              lineHeight: '1',
              color: '#9a9a9a',
            }}
          >
            <span>▲</span>
            <span>▼</span>
          </span>
        </div>
        <input
          type="tel"
          value={value}
          readOnly
          placeholder="000-555-0115"
          aria-label="Número de teléfono"
          className="flex-1 font-sans"
          style={{
            height: '56px',
            border: '1px solid #bfbfbf',
            borderRadius: '6px',
            padding: '0 16px',
            fontSize: '20px',
            color: '#333',
          }}
        />
      </div>
      <TermsCheckbox checked={accepted} onChange={setAccepted} label="I accept Privacy Policy" />
      <CancelSendButtons onCancel={onCancel} onSend={handleSend} disabled={!valid} />
    </SendModalChrome>
  );
}
