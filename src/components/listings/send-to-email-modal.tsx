'use client';

import { useEffect, useState } from 'react';

import { OnScreenKeyboard, type KeyboardKey } from '@/components/home/on-screen-keyboard';

import { CancelSendButtons, SendModalChrome, TermsCheckbox } from './send-modal-chrome';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function SendToEmailModal({
  open,
  listingTitle,
  onCancel,
  onSent,
}: {
  open: boolean;
  listingTitle: string;
  onCancel: () => void;
  onSent: (email: string) => void;
}) {
  const [value, setValue] = useState('');
  const [shift, setShift] = useState(false);
  const [accepted, setAccepted] = useState(true);

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setValue('');
      setShift(false);
      setAccepted(true);
    }
  }, [open]);

  const valid = EMAIL_RE.test(value) && accepted;

  const handleKey = (k: KeyboardKey) => {
    if (k === 'BACKSPACE') {
      setValue((v) => v.slice(0, -1));
    } else if (k === 'SHIFT') {
      setShift((s) => !s);
    } else if (k === 'SPACE') {
      setValue((v) => v + ' ');
    } else if (k === 'ENTER') {
      if (valid) handleSend();
    } else if (k === 'AT') {
      setValue((v) => v + '@');
    } else if (k === 'DOT_COM') {
      setValue((v) => v + '.com');
    } else if (k === 'SYMBOLS' || k === 'CLOSE') {
      // No-op en v1 — se abren submenus de símbolos o cierra teclado.
      // v1: CLOSE cancela el modal.
      if (k === 'CLOSE') onCancel();
    } else if (typeof k === 'string' && k.length === 1) {
      setValue((v) => v + k);
      if (shift) setShift(false);
    }
  };

  const handleSend = () => {
    if (!valid) return;
    // v1: solo confirmación. Backend real en fase posterior — context `listingTitle`, `value`.
    void listingTitle;
    onSent(value);
  };

  return (
    <SendModalChrome
      open={open}
      onCancel={onCancel}
      title="Send to e-mail"
      footer={<OnScreenKeyboard shift={shift} onKey={handleKey} />}
    >
      <div
        className="font-sans text-black"
        style={{ fontSize: '16px', lineHeight: '16px', fontWeight: 700, marginBottom: '12px' }}
      >
        Enter your e-mail address
      </div>
      <input
        type="email"
        value={value}
        readOnly
        placeholder="example@mail.com"
        aria-label="Dirección de correo"
        className="block w-full font-sans"
        style={{
          height: '56px',
          border: '1px solid #bfbfbf',
          borderRadius: '6px',
          padding: '0 16px',
          fontSize: '20px',
          color: '#333',
          marginBottom: '20px',
        }}
      />
      <TermsCheckbox
        checked={accepted}
        onChange={setAccepted}
        label="I accept Terms & Conditions"
      />
      <CancelSendButtons onCancel={onCancel} onSend={handleSend} disabled={!valid} />
    </SendModalChrome>
  );
}
