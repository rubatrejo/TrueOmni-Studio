'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

import { DraggableKeyboard } from '@/components/keyboard/draggable-keyboard';
import { NumericKeypad, type NumericKey } from '@/components/listings/numeric-keypad';
import { TermsCheckbox } from '@/components/listings/send-modal-chrome';
import { useEscapeToClose } from '@/components/listings/use-escape-to-close';

/** Valida: mínimo 10 dígitos numéricos. */
function isValidPhone(digits: string): boolean {
  return digits.replace(/\D/g, '').length >= 10;
}

interface Props {
  open: boolean;
  /** Título superior del modal (ej. "MUSEUM PASS" o "SPRING HALF MARATHON"). */
  title: string;
  /** URL que se codifica en el QR y se envía por SMS. */
  purchaseUrl: string;
  /** Precio opcional visible encima del QR (solo Tickets; Passes no usa). */
  priceDisplay?: string;
  /** Label custom del botón submit. Si no se pasa, usa `textos.qr_send`. */
  submitLabel?: string;
  /** Si true, el submit es full-width (modo compra). Default false (pill 320px). */
  submitFullWidth?: boolean;
  textos: Record<string, string>;
  /** Logo centrado en el QR. Si se omite, el QR no lleva imagen. */
  qrLogo?: string;
  onCancel: () => void;
  onSent: (phoneDigits: string) => void;
}

/**
 * Modal genérico de compra/share vía QR + SMS.
 *
 * Compartido entre Passes (Fase 3.10) y Tickets (Fase 3.11). Chrome propio
 * con header azul `hsl(var(--brand-primary))`, X circular blanca top-right, body blanco con
 * QR + phone input + SEND. NumericKeypad footer envuelto en wrapper blanco.
 *
 * Card 800×auto — alineado al SVG Passes-Share.png.
 */
export function QrPurchaseModal({
  open,
  title,
  purchaseUrl,
  priceDisplay,
  submitLabel,
  submitFullWidth = false,
  textos,
  qrLogo,
  onCancel,
  onSent,
}: Props) {
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
      aria-label={title}
      className="absolute inset-0"
      style={{ zIndex: 40 }}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCancel}
        className="absolute inset-0 cursor-default focus:outline-none"
        style={{ backgroundColor: 'rgba(30,30,30,0.85)' }}
        tabIndex={-1}
      />

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
        <div
          className="relative flex items-center justify-center"
          style={{ height: '92px', backgroundColor: 'hsl(var(--brand-primary))' }}
        >
          <h2
            className="font-sans font-bold uppercase text-white"
            style={{ fontSize: '30px', letterSpacing: '0.04em' }}
          >
            {title}
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
            {textos.qr_instruction ?? 'SCAN QR OR GET IT BY SMS'}
          </p>

          {priceDisplay ? (
            <p
              className="text-center font-display font-bold"
              style={{
                fontSize: '34px',
                color: 'hsl(var(--brand-primary))',
                marginBottom: '16px',
                letterSpacing: '0.02em',
              }}
            >
              {priceDisplay}
            </p>
          ) : null}

          <div
            className="flex items-center justify-center bg-white"
            style={{ marginBottom: '24px' }}
          >
            <QRCodeSVG
              value={purchaseUrl}
              size={260}
              level="H"
              bgColor="#ffffff"
              fgColor="#0a1e3a"
              imageSettings={
                qrLogo ? { src: qrLogo, width: 48, height: 48, excavate: true } : undefined
              }
            />
          </div>

          <p
            className="text-center font-sans font-bold text-black"
            style={{ fontSize: '18px', marginBottom: '14px' }}
          >
            {textos.qr_phone_label ?? 'Enter your phone number'}
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
              {textos.qr_country ?? 'USA (+1)'}
            </div>
            <input
              type="tel"
              value={phone}
              readOnly
              placeholder={textos.qr_phone_placeholder ?? '000-555-0115'}
              aria-label={textos.qr_phone_aria ?? 'Phone number. Tap to edit via keypad.'}
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
              label={textos.qr_terms ?? 'I accept details'}
            />
          </div>

          <div className={submitFullWidth ? 'flex' : 'flex justify-center'}>
            <button
              type="button"
              onClick={handleSend}
              disabled={!valid}
              className="font-sans font-bold uppercase text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
              style={{
                width: submitFullWidth ? '100%' : '320px',
                height: submitFullWidth ? '82px' : '68px',
                borderRadius: '10px',
                backgroundColor: valid ? 'hsl(var(--brand-secondary))' : 'rgba(23,150,214,0.5)',
                fontSize: submitFullWidth ? '26px' : '22px',
                letterSpacing: '0.08em',
                cursor: valid ? 'pointer' : 'not-allowed',
                boxShadow:
                  submitFullWidth && valid ? '0 10px 22px -6px rgba(23,150,214,0.55)' : undefined,
              }}
            >
              {submitLabel ?? textos.qr_send ?? 'SEND'}
            </button>
          </div>
        </div>
      </div>

      <DraggableKeyboard
        width={389}
        height={403}
        storageKey="kiosk_keyboard_pos:qr-purchase"
      >
        <div
          style={{
            padding: '26px 26px 32px 26px',
            backgroundColor: '#ffffff',
            borderRadius: '12px 12px 0 0',
            boxShadow: '0 -8px 20px rgba(0,0,0,0.15)',
          }}
        >
          <NumericKeypad onKey={handleKey} />
        </div>
      </DraggableKeyboard>
    </div>
  );
}
