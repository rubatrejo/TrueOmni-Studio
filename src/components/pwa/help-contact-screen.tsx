'use client';

import { useState } from 'react';

import { PwaBottomNav } from './bottom-nav';
import { S } from './mobile-layer';
import { PwaSubHeader } from './pwa-sub-header';

const PWA = 'hsl(var(--pwa-primary))';
const OPEN_SANS = 'var(--font-open-sans)';

/**
 * Contacto de Help (`/pwa/help/contact`). Formulario mock (From + mensaje + SEND)
 * que al enviar muestra un estado de éxito inline, más una opción de llamar (`tel:`).
 * Sin backend. Textos desde `config.features.pwa.help.contact`; teléfono de
 * `connectWithUs.phone`.
 */
export function HelpContactScreen({
  title,
  fromLabel,
  fromDefault,
  messagePlaceholder,
  send,
  callCta,
  successTitle,
  successBody,
  phone,
}: {
  title: string;
  fromLabel: string;
  fromDefault: string;
  messagePlaceholder: string;
  send: string;
  callCta: string;
  successTitle: string;
  successBody: string;
  phone?: string;
}) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header brand (escalado) */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={title} backHref="/pwa/help" />
        </div>
      </div>

      {/* Cuerpo */}
      {sent ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              backgroundColor: 'hsl(var(--pwa-primary) / 0.12)',
              color: PWA,
            }}
          >
            <svg
              width={34}
              height={34}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2
            className="mb-2 font-bold text-foreground"
            style={{ fontSize: 19, fontFamily: OPEN_SANS }}
          >
            {successTitle}
          </h2>
          <p
            className="text-foreground/60"
            style={{ fontSize: 14.5, lineHeight: 1.5, fontFamily: OPEN_SANS }}
          >
            {successBody}
          </p>
        </div>
      ) : (
        <div className="scrollbar-hide flex flex-1 flex-col overflow-y-auto">
          {/* From */}
          <div
            className="flex items-center gap-2 border-b px-5"
            style={{ height: 56, borderColor: 'hsl(var(--foreground) / 0.1)' }}
          >
            <span className="text-foreground/45" style={{ fontSize: 14, fontFamily: OPEN_SANS }}>
              {fromLabel}:
            </span>
            <span
              className="font-semibold text-foreground"
              style={{ fontSize: 16, fontFamily: OPEN_SANS }}
            >
              {fromDefault}
            </span>
          </div>

          {/* Mensaje */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={messagePlaceholder}
            rows={6}
            className="w-full resize-none bg-transparent px-5 py-4 text-foreground placeholder:text-foreground/40 focus:outline-none"
            style={{ fontSize: 15, lineHeight: 1.5, fontFamily: OPEN_SANS }}
          />

          <div className="px-5 pb-6 pt-4">
            <button
              type="button"
              onClick={() => setSent(true)}
              disabled={message.trim().length === 0}
              className="w-full rounded-full font-bold text-white disabled:opacity-40"
              style={{
                height: 50,
                backgroundColor: PWA,
                fontSize: 15,
                letterSpacing: '0.04em',
                fontFamily: OPEN_SANS,
              }}
            >
              {send}
            </button>

            {phone ? (
              <a
                href={`tel:${phone}`}
                className="mt-4 block text-center font-bold"
                style={{ fontSize: 14, color: PWA, fontFamily: OPEN_SANS }}
              >
                {callCta}
              </a>
            ) : null}
          </div>
        </div>
      )}

      <PwaBottomNav active="more" />
    </div>
  );
}
