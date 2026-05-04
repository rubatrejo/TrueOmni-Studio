'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

import { useTextosMap } from '@/components/i18n-provider';
import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import type { Deal } from '@/lib/config';
import { formatDealExpiry } from '@/lib/deals';

/**
 * Modal "redeem" verbatim SVG `Deals–Details_Send.svg`. Se renderiza sobre
 * el listing atenuado con backdrop dark. Layout:
 *   - Hero image con title overlay + expiry.
 *   - Headline (H1) + subtitle.
 *   - Descripción larga con promoCode en bold.
 *   - QR grande centrado (260×260).
 *   - 2 botones side-by-side: SEND TO PHONE + SEND TO EMAIL.
 *   - CANCEL link.
 *
 * No tiene telemetría propia (v1). El disparo de phone/email delega al host.
 */
export function DealRedeemModal({
  open,
  deal,
  qrLogo,
  onCancel,
  onSendPhone,
  onSendEmail,
}: {
  open: boolean;
  deal: Deal | null;
  qrLogo?: string;
  onCancel: () => void;
  onSendPhone: () => void;
  onSendEmail: () => void;
}) {
  const textos = useTextosMap();
  useEscapeToClose(open, onCancel);
  if (!open || !deal) return null;

  const expiresPrefix = textos.deals_expires_prefix ?? 'EXPIRES';
  const promoCodeLabel = textos.deals_promo_code_label ?? 'USE CODE';
  const sendPhoneLabel = textos.deals_send_phone ?? 'SEND TO MY PHONE';
  const sendEmailLabel = textos.deals_send_email ?? 'SEND TO MY EMAIL';
  const cancelLabel = textos.deals_cancel ?? 'CANCEL';
  const resolvedQrLogo = resolveAssetPath(qrLogo);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deal-redeem-title"
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 50, backgroundColor: 'rgba(0,0,0,0.78)' }}
    >
      {/* Backdrop click cierra */}
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={onCancel}
        className="absolute inset-0 cursor-default focus:outline-none"
        tabIndex={-1}
      />

      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: '720px',
          maxHeight: '1500px',
          borderRadius: '16px',
          backgroundColor: '#ffffff',
          boxShadow: '0 40px 80px rgba(0,0,0,0.45)',
          zIndex: 1,
        }}
      >
        <HeroWithOverlay
          src={deal.cover}
          title={deal.title}
          expiresLabel={`${expiresPrefix} ${formatDealExpiry(deal.expiresAt)}`}
        />

        <div
          className="flex flex-col items-center"
          style={{ padding: '32px 56px 40px 56px', rowGap: '18px' }}
        >
          <h1
            id="deal-redeem-title"
            className="text-center font-sans"
            style={{
              fontSize: '28px',
              lineHeight: '34px',
              fontWeight: 700,
              color: '#1a1a1a',
              letterSpacing: '-0.01em',
            }}
          >
            {deal.headline}
          </h1>
          <p
            className="text-center font-sans"
            style={{ fontSize: '16px', lineHeight: '16px', fontWeight: 600, color: '#6e6e6e' }}
          >
            {deal.subtitle}
          </p>
          <p
            className="text-center font-sans"
            style={{ fontSize: '14px', lineHeight: '22px', color: '#3a3a3a', maxWidth: '560px' }}
          >
            {deal.longDescription}
          </p>

          {deal.promoCode ? (
            <div
              className="flex items-center font-sans"
              style={{
                padding: '10px 24px',
                borderRadius: '999px',
                backgroundColor: '#f3f7fb',
                columnGap: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.1em',
                  color: '#6e6e6e',
                  fontWeight: 700,
                }}
              >
                {promoCodeLabel}
              </span>
              <span
                style={{
                  fontSize: '18px',
                  letterSpacing: '0.04em',
                  color: 'hsl(var(--brand-primary))',
                  fontWeight: 700,
                }}
              >
                {deal.promoCode}
              </span>
            </div>
          ) : null}

          <div
            className="flex items-center justify-center"
            style={{ padding: '14px', backgroundColor: '#ffffff' }}
          >
            <QRCodeSVG
              value={deal.qrUrl}
              size={240}
              level="H"
              bgColor="#ffffff"
              fgColor="#0a1e3a"
              imageSettings={
                resolvedQrLogo
                  ? {
                      src: resolvedQrLogo,
                      width: 44,
                      height: 44,
                      excavate: true,
                    }
                  : undefined
              }
            />
          </div>

          <div
            className="flex w-full items-center justify-center"
            style={{ columnGap: '14px', marginTop: '4px' }}
          >
            <SendButton label={sendPhoneLabel} onClick={onSendPhone} />
            <SendButton label={sendEmailLabel} onClick={onSendEmail} />
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          aria-label={cancelLabel}
          className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{
            top: '16px',
            right: '16px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '1.5px solid #ffffff',
            backgroundColor: 'rgba(0,0,0,0.35)',
            color: '#ffffff',
            zIndex: 2,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M6 6l12 12M18 6l-12 12"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Normaliza el path del qrLogo para que sea absoluto desde el root.
 * El asset handler del kiosk sirve `/assets/*` desde `clients/{slug}/assets/*`.
 * Si el config declara `"assets/logo.svg"` (sin leading slash) lo convertimos
 * a `/assets/logo.svg` para que QRCodeSVG no lo resuelva como relativo a la
 * ruta actual del módulo.
 */
function resolveAssetPath(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('http') || raw.startsWith('/')) return raw;
  return `/${raw}`;
}

function SendButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-sans text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
      style={{
        flex: 1,
        height: '58px',
        borderRadius: '10px',
        backgroundColor: 'hsl(var(--brand-secondary))',
        fontSize: '15px',
        lineHeight: '15px',
        fontWeight: 700,
        letterSpacing: '0.06em',
      }}
    >
      {label}
    </button>
  );
}

function HeroWithOverlay({
  src,
  title,
  expiresLabel,
}: {
  src: string;
  title: string;
  expiresLabel: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative" style={{ width: '100%', aspectRatio: '720 / 360', flexShrink: 0 }}>
      {failed ? (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, hsl(var(--brand-primary)) 0%, hsl(var(--brand-secondary)) 100%)' }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: 'cover' }}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center text-white"
        style={{ padding: '0 32px 24px 32px', rowGap: '8px' }}
      >
        <span
          className="text-center font-sans"
          style={{
            fontSize: '34px',
            lineHeight: '40px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            textShadow: '0 2px 6px rgba(0,0,0,0.45)',
          }}
        >
          {title}
        </span>
        <span
          className="font-sans"
          style={{
            fontSize: '15px',
            lineHeight: '15px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textShadow: '0 2px 4px rgba(0,0,0,0.45)',
          }}
        >
          {expiresLabel}
        </span>
      </div>
    </div>
  );
}
