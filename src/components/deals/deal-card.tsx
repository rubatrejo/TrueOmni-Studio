'use client';

import { useState } from 'react';

import type { Deal } from '@/lib/config';
import { formatDealExpiry } from '@/lib/deals';

/**
 * Card de un deal en el listing (grid 3-col). Tap dispara el CustomEvent
 * `kiosk:deal-redeem-open` con el slug del deal — escuchado por `DealRedeemHost`.
 *
 * Layout (verbatim SVG Deals.svg):
 *   - Cover 4:3 arriba.
 *   - Text panel con title azul oscuro, shortDescription gris, expiry olive bold,
 *     originalPrice tachado si existe.
 */
export function DealCard({ deal, expiresPrefix }: { deal: Deal; expiresPrefix: string }) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent('kiosk:deal-redeem-open', { detail: { dealSlug: deal.slug } }),
        )
      }
      aria-label={`${deal.title} — tap to redeem`}
      className="group relative flex flex-col overflow-hidden text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
      style={{
        width: '306px',
        height: '316px',
        backgroundColor: '#ffffff',
        border: '1px solid #e3e3e3',
        borderRadius: '4px',
      }}
    >
      <DealCover src={deal.cover} alt={deal.title} />
      <div
        className="flex flex-1 flex-col"
        style={{ padding: '12px 14px 14px 14px', rowGap: '6px' }}
      >
        <span
          className="font-sans"
          style={{
            fontSize: '17px',
            lineHeight: '22px',
            fontWeight: 700,
            color: '#1a1a1a',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {deal.title}
        </span>
        <span
          className="font-sans"
          style={{
            fontSize: '11px',
            lineHeight: '15px',
            color: '#6e6e6e',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {deal.shortDescription}
        </span>
        <div className="mt-auto flex items-end justify-between" style={{ columnGap: '8px' }}>
          <span
            className="font-sans"
            style={{
              fontSize: '11px',
              lineHeight: '13px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: '#7a8236',
            }}
          >
            {expiresPrefix} {formatDealExpiry(deal.expiresAt)}
          </span>
          {deal.originalPrice ? (
            <span
              className="font-sans"
              style={{
                fontSize: '12px',
                lineHeight: '13px',
                fontWeight: 600,
                color: '#a0a0a0',
                textDecoration: 'line-through',
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

function DealCover({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        aria-hidden
        style={{
          width: '100%',
          aspectRatio: '306 / 192',
          flexShrink: 0,
          background: 'linear-gradient(135deg, #004f8b 0%, #1796d6 100%)',
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{
        width: '100%',
        aspectRatio: '306 / 192',
        flexShrink: 0,
        objectFit: 'cover',
      }}
    />
  );
}
