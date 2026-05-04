'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useSubcategoryLabel, useTextos } from '@/components/i18n-provider';
import type { Listing } from '@/lib/config';

/**
 * Card verbatim SVG Food & Drink (Component_469).
 *   - Card 293×268.63 total: imagen 293×164.63 arriba + footer #555555 293×104.
 *   - Heart circle 65px (r=32.5) semi-transparente #fff/0.699 en top-right de la imagen.
 *   - Footer dark:
 *     · "SUBCATEGORY" OpenSans 12px white @ (20, 13) baseline.
 *     · Listing title OpenSans 22px white @ (20, 36) baseline.
 *     · "7.5 km · City, ST" OpenSans-Light 14px white @ (20, 60).
 *     · "Open until 11:00 pm" OpenSans-Semibold 12px olive @ (20, 84).
 */
export function ListingCard({
  listing,
  moduleKey,
  isFavorited = false,
  onToggleFavorite,
  distanceMi,
}: {
  listing: Listing;
  moduleKey: string;
  isFavorited?: boolean;
  onToggleFavorite?: (slug: string) => void;
  distanceMi?: number;
}) {
  const subcategoryLabel = useSubcategoryLabel(listing.subcategory);
  const t = useTextos();
  const openUntilPrefix = t('map_open_until_prefix');
  const city = listing.address.split(',').slice(-2, -1)[0]?.trim() ?? '';
  const stateFromAddr = listing.address.match(/,\s*([A-Z]{2})\s/)?.[1] ?? '';
  const distance = distanceMi != null ? `${distanceMi.toFixed(1)} mi · ` : '';

  const openUntil = listing.hours.split('–')[1]?.trim() ?? listing.hours;

  return (
    <Link
      href={`/home/${moduleKey}/${listing.slug}`}
      className="relative block overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white"
      style={{ width: '293px', height: '268.63px' }}
    >
      {/* Imagen 293×164.63 con fallback azul si falla la carga */}
      <div className="absolute left-0 right-0 top-0 overflow-hidden" style={{ height: '164.63px' }}>
        <ListingImage src={listing.image} title={listing.title} />
        {/* Heart circle @ top-right. Center at (225+32.5, 10+32.5) relative to card. */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite?.(listing.slug);
          }}
          aria-label={isFavorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={isFavorited}
          className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{
            right: '10px',
            top: '10px',
            width: '65px',
            height: '65px',
            borderRadius: '32.5px',
            backgroundColor: 'rgba(255,255,255,0.7)',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill={isFavorited ? '#e02020' : 'none'}
            stroke="#e02020"
            strokeWidth={isFavorited ? 0 : 1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Footer dark #555555 293×104 @ y=164.63 */}
      <div
        className="absolute left-0 right-0 overflow-hidden"
        style={{ top: '164.63px', height: '104px', backgroundColor: '#555555' }}
      >
        <span
          className="absolute font-sans uppercase text-white"
          style={{
            left: '20px',
            right: '20px',
            top: '12px',
            fontSize: '12px',
            lineHeight: '1',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {subcategoryLabel}
        </span>
        <span
          className="absolute font-sans text-white"
          style={{
            left: '20px',
            right: '20px',
            top: '28px',
            fontSize: '22px',
            lineHeight: '1',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {listing.title}
        </span>
        <span
          className="absolute font-sans text-white"
          style={{
            left: '20px',
            right: '20px',
            top: '60px',
            fontSize: '14px',
            lineHeight: '1',
            fontWeight: 300,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {distance}
          {city}
          {stateFromAddr ? `, ${stateFromAddr}` : ''}
        </span>
        <span
          className="absolute font-sans"
          style={{
            left: '20px',
            right: '20px',
            top: '82px',
            fontSize: '12px',
            lineHeight: '1',
            fontWeight: 600,
            color: 'hsl(var(--brand-tertiary))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {openUntilPrefix} {openUntil}
        </span>
      </div>
    </Link>
  );
}

function ListingImage({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        aria-hidden
        className="flex h-full w-full items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--brand-primary)) 0%, hsl(var(--brand-secondary)) 100%)',
          color: '#ffffff',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        {title}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
  );
}
