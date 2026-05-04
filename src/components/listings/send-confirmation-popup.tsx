'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type SendKind = 'email' | 'phone';

/**
 * Popup de confirmación tras envío (email / phone).
 *
 * Diseño: card blanca grande centrada con check animado olive + mensaje
 * grande + submensaje explicativo. Auto-redirect a `/home` tras 5s.
 * Bloquea el resto del UI (cubre canvas 1080×1920 con overlay).
 */
export function SendConfirmationPopup({
  open,
  kind,
  destination,
  onClose,
  title: titleOverride,
  body: bodyOverride,
}: {
  open: boolean;
  kind: SendKind;
  destination: string;
  onClose: () => void;
  /** Override del título — útil para que el popup hable del módulo activo (Photo Booth, etc.). */
  title?: string;
  /** Override del cuerpo — idem. */
  body?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      onClose();
      router.push('/home');
    }, 5000);
    return () => clearTimeout(timer);
  }, [open, onClose, router]);

  if (!open) return null;

  const subject = kind === 'email' ? 'email' : 'phone';
  const defaultTitle = kind === 'email' ? "It's on its way!" : 'Sent to your phone';
  const defaultBody =
    kind === 'email'
      ? 'Check your inbox for your trip details. The link is ready to open on your phone.'
      : 'Check your messages. Your trip details are waiting for you.';
  const title = titleOverride ?? defaultTitle;
  const body = bodyOverride ?? defaultBody;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 60, backgroundColor: 'rgba(0,0,0,0.78)' }}
    >
      <div
        className="relative flex flex-col items-center overflow-hidden bg-white"
        style={{
          width: '780px',
          padding: '88px 80px 76px',
          borderRadius: '24px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.45)',
        }}
      >
        {/* Decorative top band — gradient olive → blue */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0"
          style={{
            height: '8px',
            background: 'linear-gradient(90deg, hsl(var(--brand-tertiary)) 0%, hsl(var(--brand-secondary)) 100%)',
          }}
        />

        {/* Circle with animated check */}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: '168px',
            height: '168px',
            borderRadius: '50%',
            backgroundColor: 'hsl(var(--brand-tertiary) / 0.12)',
            marginBottom: '36px',
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--brand-tertiary))',
              boxShadow: '0 12px 24px hsl(var(--brand-tertiary) / 0.4)',
            }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M5 12l5 5 9-11"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 30,
                  strokeDashoffset: 0,
                  animation: 'kiosk-check 0.5s ease-out',
                }}
              />
            </svg>
          </div>
        </div>

        <h2
          id="confirm-title"
          className="text-center font-sans"
          style={{
            fontSize: '40px',
            lineHeight: '44px',
            fontWeight: 700,
            color: '#0b3a66',
            marginBottom: '20px',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>

        <p
          className="text-center font-sans"
          style={{
            fontSize: '20px',
            lineHeight: '30px',
            color: '#4a4a4a',
            marginBottom: '24px',
            maxWidth: '520px',
          }}
        >
          {body}
        </p>

        <div
          className="flex items-center"
          style={{
            padding: '14px 28px',
            borderRadius: '999px',
            backgroundColor: '#f3f7fb',
            columnGap: '12px',
            marginBottom: '20px',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            {kind === 'email' ? (
              <path
                d="M4 6h16v12H4z M4 6l8 7 8-7"
                fill="none"
                stroke="hsl(var(--brand-secondary))"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M7 2h10v20H7z M12 18h.01"
                fill="none"
                stroke="hsl(var(--brand-secondary))"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            )}
          </svg>
          <span
            className="font-sans"
            style={{ fontSize: '18px', color: 'hsl(var(--brand-secondary))', fontWeight: 600 }}
          >
            {destination}
          </span>
        </div>

        <p
          className="text-center font-sans"
          style={{
            fontSize: '14px',
            lineHeight: '14px',
            color: '#9a9a9a',
            letterSpacing: '0.04em',
          }}
        >
          Returning to Home in a few seconds… {subject}.
        </p>

        {/* Progress bar (5s) */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0"
          style={{ height: '4px', backgroundColor: '#e5eaef' }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: 'hsl(var(--brand-secondary))',
              animation: 'kiosk-countdown 5s linear forwards',
              transformOrigin: 'left center',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes kiosk-check {
          from {
            stroke-dashoffset: 30;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes kiosk-countdown {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  );
}
