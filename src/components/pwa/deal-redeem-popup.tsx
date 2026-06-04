'use client';

import { useState } from 'react';

import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { Deal, PwaDealsModuleConfig } from '@/lib/config';
import { formatDealExpiry } from '@/lib/deals';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const FG = 'hsl(var(--foreground))';
const MUTED = 'hsl(var(--foreground) / 0.6)';
const PWA = 'hsl(var(--pwa-primary))';

/** Abre un enlace externo en una pestaña nueva, de forma segura. */
function openExternal(url?: string) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}

/** Comparte el deal vía Web Share API; si no está disponible, abre el `qrUrl`. */
function shareDeal(deal: Deal) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    navigator.share({ title: deal.title, text: deal.subtitle, url: deal.qrUrl }).catch(() => {});
  } else {
    openExternal(deal.qrUrl);
  }
}

/**
 * Popup de canje de un cupón (modal centrado sobre el canvas). Réplica mobile del
 * modal redeem del kiosk (`deals/deal-redeem-modal.tsx`) adaptada: sin QR ni Send
 * to Phone/Email — el QR se reemplaza por un botón "View Offer" (abre `qrUrl`) y
 * se añade "Share" nativo. Estructura: hero (cover + título + expiry), headline +
 * subtitle + descripción, pill de código promocional opcional, y los dos CTAs
 * (compactos, consistentes con otros módulos). Cierra con la X, tap en el scrim o
 * Escape. White-label: cero hex de marca en JSX.
 */
export function DealRedeemPopup({
  deal,
  texts,
  onClose,
}: {
  deal: Deal | null;
  texts: PwaDealsModuleConfig;
  onClose: () => void;
}) {
  useEscapeToClose(deal != null, onClose);
  if (!deal) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deal-redeem-title"
      className="absolute inset-0 z-50 flex items-center justify-center"
    >
      {/* Scrim — tap fuera cierra */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="pwa-sheet-backdrop-anim absolute inset-0 cursor-default"
        style={{ backgroundColor: 'rgba(18,18,18,0.55)' }}
      />

      {/* Card centrado */}
      <div
        className="pwa-sheet-up-anim relative flex max-h-[85%] w-[calc(100%-40px)] flex-col overflow-hidden rounded-[20px] shadow-2xl"
        style={{ backgroundColor: 'hsl(var(--pwa-sheet-bg))' }}
      >
        <div className="scrollbar-hide flex-1 overflow-y-auto">
          <Hero
            src={deal.cover}
            title={deal.title}
            expiresLabel={`${texts.expiresPrefix} ${formatDealExpiry(deal.expiresAt)}`}
          />

          <div className="flex flex-col items-center px-5 pb-2 pt-4" style={{ rowGap: 10 }}>
            <h1
              id="deal-redeem-title"
              className="text-center font-bold"
              style={{ fontSize: 18, lineHeight: '23px', color: FG, ...OPEN_SANS }}
            >
              {deal.headline}
            </h1>
            <p
              className="text-center font-semibold"
              style={{ fontSize: 12, lineHeight: '16px', color: MUTED, ...OPEN_SANS }}
            >
              {deal.subtitle}
            </p>
            <p
              className="text-center"
              style={{
                fontSize: 12,
                lineHeight: '18px',
                color: 'hsl(var(--foreground) / 0.8)',
                ...OPEN_SANS,
              }}
            >
              {deal.longDescription}
            </p>

            {deal.promoCode ? (
              <div
                className="flex items-center rounded-full"
                style={{
                  padding: '7px 16px',
                  backgroundColor: 'hsl(var(--pwa-primary) / 0.1)',
                  columnGap: 8,
                }}
              >
                <span
                  className="font-bold uppercase"
                  style={{ fontSize: 11, letterSpacing: '0.1em', color: MUTED, ...OPEN_SANS }}
                >
                  {texts.redeem.useCode}
                </span>
                <span
                  className="font-bold"
                  style={{ fontSize: 14, letterSpacing: '0.04em', color: PWA, ...OPEN_SANS }}
                >
                  {deal.promoCode}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* CTAs compactos (fijos al fondo del card) */}
        <div
          className="flex shrink-0 items-center gap-2.5 px-5 pb-5 pt-3"
          style={{ borderTop: '1px solid hsl(var(--foreground) / 0.08)' }}
        >
          <button
            type="button"
            onClick={() => openExternal(deal.qrUrl)}
            className="flex flex-1 items-center justify-center rounded-full font-bold uppercase text-white"
            style={{
              height: 40,
              backgroundColor: PWA,
              fontSize: 11.5,
              letterSpacing: '0.04em',
              ...OPEN_SANS,
            }}
          >
            {texts.redeem.viewOffer}
          </button>
          <button
            type="button"
            onClick={() => shareDeal(deal)}
            className="flex flex-1 items-center justify-center rounded-full font-bold uppercase"
            style={{
              height: 40,
              border: `1.5px solid ${PWA}`,
              color: PWA,
              fontSize: 11.5,
              letterSpacing: '0.04em',
              ...OPEN_SANS,
            }}
          >
            {texts.redeem.share}
          </button>
        </div>

        {/* Close (sobre el hero) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute flex items-center justify-center rounded-full"
          style={{
            top: 12,
            right: 12,
            width: 30,
            height: 30,
            backgroundColor: 'rgba(0,0,0,0.4)',
            border: '1.5px solid rgba(255,255,255,0.85)',
          }}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Hero del popup: cover + gradient oscuro + título + expiry. */
function Hero({ src, title, expiresLabel }: { src: string; title: string; expiresLabel: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative w-full" style={{ aspectRatio: '16 / 9', flexShrink: 0 }}>
      {failed ? (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--brand-primary)) 0%, hsl(var(--brand-secondary)) 100%)',
          }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveAssetUrl(src)}
          alt={title}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: 'cover' }}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.6) 100%)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-3 text-white"
        style={{ rowGap: 3 }}
      >
        <span
          className="text-center font-bold"
          style={{
            fontSize: 20,
            lineHeight: '24px',
            textShadow: '0 2px 6px rgba(0,0,0,0.45)',
            ...OPEN_SANS,
          }}
        >
          {title}
        </span>
        <span
          className="font-bold uppercase"
          style={{
            fontSize: 10,
            letterSpacing: '0.08em',
            textShadow: '0 2px 4px rgba(0,0,0,0.45)',
            ...OPEN_SANS,
          }}
        >
          {expiresLabel}
        </span>
      </div>
    </div>
  );
}
