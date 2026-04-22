'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

import { NumericKeypad, type NumericKey } from '@/components/listings/numeric-keypad';
import {
  CancelSendButtons,
  SendModalChrome,
  TermsCheckbox,
} from '@/components/listings/send-modal-chrome';
import type { PassItem } from '@/lib/config';
import { isValidPhone } from '@/lib/passes';

interface Props {
  open: boolean;
  pass: PassItem;
  textos: Record<string, string>;
  onCancel: () => void;
  onSent: (phoneDigits: string) => void;
}

export function PassShareModal({ open, pass, textos, onCancel, onSent }: Props) {
  const [phone, setPhone] = useState('');
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    if (open) {
      setPhone('');
      setAccepted(true);
    }
  }, [open]);

  const valid = isValidPhone(phone) && accepted;

  const handleKey = (k: NumericKey) => {
    if (k === 'KEYBOARD' || k === 'SEND') return;
    if (typeof k === 'string' && k.length === 1 && /[0-9]/.test(k)) {
      setPhone((p) => (p.length >= 12 ? p : p + k));
    }
  };

  const handleBackspace = () => setPhone((p) => p.slice(0, -1));
  const handleSend = () => {
    if (!valid) return;
    onSent(phone);
  };

  const displayPhone = phone || textos.passes_share_phone_placeholder || '';
  const phoneIsPlaceholder = !phone;

  return (
    <SendModalChrome
      open={open}
      onCancel={onCancel}
      title={pass.title.toUpperCase()}
      footer={<NumericKeypad onKey={handleKey} />}
    >
      <div className="flex flex-col items-center" style={{ gap: '12px', marginBottom: '20px' }}>
        <p
          className="text-center font-sans font-bold text-black"
          style={{ fontSize: '16px', letterSpacing: '0.02em' }}
        >
          {textos.passes_share_instruction ?? 'SCAN THIS QR CODE TO HAVE YOUR PASS'}
        </p>
        <div
          className="flex items-center justify-center"
          style={{ padding: '10px', backgroundColor: '#fff' }}
        >
          <QRCodeSVG
            value={pass.bandwangoUrl}
            size={200}
            level="H"
            bgColor="#ffffff"
            fgColor="#0a1e3a"
            imageSettings={{
              src: '/assets/logo.svg',
              width: 36,
              height: 36,
              excavate: true,
            }}
          />
        </div>
      </div>

      <p
        className="text-center font-sans font-bold text-black"
        style={{ fontSize: '15px', marginBottom: '10px' }}
      >
        {textos.passes_share_phone_label ?? 'Enter your phone number'}
      </p>

      <div className="flex items-stretch" style={{ gap: '8px', marginBottom: '14px' }}>
        <div
          className="flex items-center justify-center font-sans text-black"
          style={{
            width: '110px',
            height: '48px',
            border: '1px solid #d0d0d0',
            borderRadius: '6px',
            fontSize: '16px',
          }}
        >
          {textos.passes_share_country ?? 'USA (+1)'}
        </div>
        <button
          type="button"
          onClick={handleBackspace}
          className="flex flex-1 items-center font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          style={{
            height: '48px',
            border: '1px solid #d0d0d0',
            borderRadius: '6px',
            paddingLeft: '14px',
            paddingRight: '14px',
            fontSize: '16px',
            backgroundColor: '#fff',
            textAlign: 'left',
            color: phoneIsPlaceholder ? '#9a9a9a' : '#000',
          }}
          aria-label="Phone input. Tap to delete last digit."
        >
          {displayPhone}
        </button>
      </div>

      <TermsCheckbox
        checked={accepted}
        onChange={setAccepted}
        label={textos.passes_share_terms ?? 'I accept details'}
      />
      <CancelSendButtons onCancel={onCancel} onSend={handleSend} disabled={!valid} />
    </SendModalChrome>
  );
}
