'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

import { NumericKeypad, type NumericKey } from '@/components/listings/numeric-keypad';
import { TermsCheckbox } from '@/components/listings/send-modal-chrome';
import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import type { PassItem } from '@/lib/config';
import { isValidPhone } from '@/lib/passes';

interface Props {
  open: boolean;
  pass: PassItem;
  textos: Record<string, string>;
  /** Logo centrado en el QR. Si se omite, el QR no lleva imagen. */
  qrLogo?: string;
  onCancel: () => void;
  onSent: (phoneDigits: string) => void;
}

/**
 * Modal share del pass. Chrome propio (distinto del de Listings) alineado al
 * SVG `Passes-Share.png`: header azul con título + X circular, body blanco
 * con QR + input teléfono + checkbox + SEND centrado. NumericKeypad footer
 * envuelto en wrapper blanco al fondo del canvas.
 *
 * Card 800×auto (≈15% más grande que los modales de Listings 640px).
 */
export function PassShareModal({ open, pass, textos, qrLogo, onCancel, onSent }: Props) {
  const [phone, setPhone] = useState('');
  const [accepted, setAccepted] = useState(true);

  useEscapeToClose(open, onCancel);

  useEffect(() => {
    if (open) {
      setPhone('');
      setAccepted(true);
    }
  }, [open]);

  const valid = isValidPhone(phone) && accepted;

  const handleKey = (k: NumericKey) => {
    if (k === 'SEND') {
      if (valid) onSent(phone);
      return;
    }
    if (k === 'KEYBOARD') return;
    if (typeof k === 'string' && k.length === 1) {
      setPhone((p) => (p.length >= 14 ? p : p + k));
    }
  };

  const handleSend = () => {
    if (!valid) return;
    onSent(phone);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={pass.title}
      className="absolute inset-0"
      style={{ zIndex: 40 }}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCancel}
        className="absolute inset-0 cursor-default focus:outline-none"
        style={{ backgroundColor: 'rgba(30,30,30,0.85)' }}
        tabIndex={-1}
      />

      {/* Card 800×auto centrada horizontal, top 360 para dejar espacio al keypad */}
      <div
        className="absolute overflow-hidden bg-white"
        style={{
          left: '140px',
          top: '360px',
          width: '800px',
          borderRadius: '12px',
          boxShadow: '0 30px 50px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header azul con título + X circular */}
        <div
          className="relative flex items-center justify-center"
          style={{ height: '92px', backgroundColor: '#004f8b' }}
        >
          <h2
            className="font-sans font-bold uppercase text-white"
            style={{ fontSize: '30px', letterSpacing: '0.04em' }}
          >
            {pass.title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="absolute flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            style={{
              right: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '48px',
              height: '48px',
              border: '2.5px solid #fff',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="#fff"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '32px 56px 36px 56px' }}>
          <p
            className="text-center font-sans font-bold text-black"
            style={{
              fontSize: '20px',
              letterSpacing: '0.04em',
              marginBottom: '20px',
              lineHeight: 1.25,
            }}
          >
            {textos.passes_share_instruction ?? 'SCAN THIS QR CODE TO HAVE YOUR PASS'}
          </p>

          <div
            className="flex items-center justify-center bg-white"
            style={{ marginBottom: '24px' }}
          >
            <QRCodeSVG
              value={pass.bandwangoUrl}
              size={260}
              level="H"
              bgColor="#ffffff"
              fgColor="#0a1e3a"
              imageSettings={
                qrLogo
                  ? {
                      src: qrLogo,
                      width: 48,
                      height: 48,
                      excavate: true,
                    }
                  : undefined
              }
            />
          </div>

          <p
            className="text-center font-sans font-bold text-black"
            style={{ fontSize: '18px', marginBottom: '14px' }}
          >
            {textos.passes_share_phone_label ?? 'Enter your phone number'}
          </p>

          <div className="flex items-stretch" style={{ columnGap: '14px', marginBottom: '18px' }}>
            <div
              className="flex items-center justify-center font-sans text-black"
              style={{
                width: '140px',
                height: '56px',
                border: '1px solid #bfbfbf',
                borderRadius: '6px',
                fontSize: '18px',
              }}
            >
              {textos.passes_share_country ?? 'USA (+1)'}
            </div>
            <input
              type="tel"
              value={phone}
              readOnly
              placeholder={textos.passes_share_phone_placeholder ?? '000-555-0115'}
              aria-label={textos.passes_share_phone_aria ?? 'Phone number. Tap to edit via keypad.'}
              className="flex-1 font-sans"
              style={{
                height: '56px',
                border: '1px solid #bfbfbf',
                borderRadius: '6px',
                padding: '0 18px',
                fontSize: '18px',
                color: '#333',
              }}
            />
          </div>

          <div className="flex justify-center" style={{ marginBottom: '22px' }}>
            <TermsCheckbox
              checked={accepted}
              onChange={setAccepted}
              label={textos.passes_share_terms ?? 'I accept details'}
            />
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSend}
              disabled={!valid}
              className="font-sans font-bold uppercase text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
              style={{
                width: '320px',
                height: '68px',
                borderRadius: '8px',
                backgroundColor: valid ? '#1796d6' : 'rgba(23,150,214,0.5)',
                fontSize: '22px',
                letterSpacing: '0.08em',
                cursor: valid ? 'pointer' : 'not-allowed',
              }}
            >
              {textos.passes_share_send ?? 'SEND'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer NumericKeypad con wrapper blanco (patrón SendToPhoneModal) */}
      <div className="absolute inset-x-0" style={{ bottom: 0 }}>
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
      </div>
    </div>
  );
}
