'use client';

import { useState } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { Deal } from '@/lib/config';
import { formatDealExpiry } from '@/lib/deals';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const FG = 'hsl(var(--foreground))';
const MUTED = 'hsl(var(--foreground) / 0.6)';
const EXPIRY = 'hsl(var(--pwa-deals-expiry))';
const STRIKE = 'hsl(var(--foreground) / 0.4)';

/**
 * Card de un cupón en el grid (2 columnas) de la PWA. Réplica mobile de
 * `deals/deal-card.tsx` del kiosk, tokenizada: cover 4:3 + panel de texto con
 * título, descripción corta (2 líneas) y footer expiry (olive) + precio tachado.
 * Tap → `onOpen(deal)` (abre el sheet de canje). White-label: cero hex en JSX.
 */
export function DealCardPwa({
  deal,
  expiresPrefix,
  onOpen,
}: {
  deal: Deal;
  expiresPrefix: string;
  onOpen: (deal: Deal) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(deal)}
      aria-label={`${deal.title} — tap to redeem`}
      className="relative flex flex-col overflow-hidden rounded-[8px] text-left"
      style={{
        backgroundColor: 'hsl(var(--pwa-sheet-bg))',
        border: '1px solid hsl(var(--foreground) / 0.1)',
        boxShadow: '0 6px 16px -10px hsl(0 0% 0% / 0.4)',
      }}
    >
      <DealCover src={deal.cover} alt={deal.title} />
      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2" style={{ rowGap: 4 }}>
        <span
          className="font-bold"
          style={{
            fontSize: 13,
            lineHeight: '17px',
            color: FG,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            ...OPEN_SANS,
          }}
        >
          {deal.title}
        </span>
        <span
          style={{
            fontSize: 10.5,
            lineHeight: '14px',
            color: MUTED,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            ...OPEN_SANS,
          }}
        >
          {deal.shortDescription}
        </span>
        <div
          className="mt-auto flex items-end justify-between"
          style={{ columnGap: 6, paddingTop: 4 }}
        >
          <span
            className="font-bold uppercase"
            style={{
              fontSize: 9.5,
              lineHeight: '12px',
              letterSpacing: '0.04em',
              color: EXPIRY,
              ...OPEN_SANS,
            }}
          >
            {expiresPrefix} {formatDealExpiry(deal.expiresAt)}
          </span>
          {deal.originalPrice ? (
            <span
              className="font-semibold"
              style={{
                fontSize: 11,
                lineHeight: '12px',
                color: STRIKE,
                textDecoration: 'line-through',
                ...OPEN_SANS,
              }}
            >
              {deal.originalPrice}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

/** Cover 4:3 con fallback a gradient de marca si la imagen falla. */
function DealCover({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        aria-hidden
        style={{
          width: '100%',
          aspectRatio: '4 / 3',
          flexShrink: 0,
          background:
            'linear-gradient(135deg, hsl(var(--brand-primary)) 0%, hsl(var(--brand-secondary)) 100%)',
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolveAssetUrl(src)}
      alt={alt}
      onError={() => setFailed(true)}
      style={{ width: '100%', aspectRatio: '4 / 3', flexShrink: 0, objectFit: 'cover' }}
    />
  );
}
