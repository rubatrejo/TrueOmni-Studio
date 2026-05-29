'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaRestaurantCategory } from '@/lib/config';

import { PwaBottomNav } from './bottom-nav';
import { ProfileIcon, SearchIcon } from './dashboard-icons';
import { S } from './mobile-layer';

const BRAND = 'hsl(var(--brand-primary))';
const MONTSERRAT = { fontFamily: 'var(--font-montserrat)' } as const;
const OPEN_SANS = 'var(--font-open-sans)';
const HEADER_H = 92;

/**
 * Restaurants #1 — Grid de subcategorías. Header brand fijo (circle-user + search
 * estilo More + bookmark) sobre un grid 2×N scrolleable de tiles temáticas. Tap en
 * una tile → lista filtrada.
 */
export function RestaurantsGridScreen({
  searchPlaceholder,
  categories,
}: {
  searchPlaceholder: string;
  categories: PwaRestaurantCategory[];
}) {
  const router = useRouter();

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header brand fijo */}
      <div
        className="relative z-10 shrink-0"
        style={{ height: HEADER_H * S, backgroundColor: BRAND }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: 375,
            height: HEADER_H,
            transform: `scale(${S})`,
            transformOrigin: 'top left',
          }}
        >
          <button
            type="button"
            aria-label="Account"
            className="absolute text-white"
            style={{ left: 20, top: 52, width: 28, height: 28 }}
          >
            <ProfileIcon size={26} />
          </button>
          <button
            type="button"
            onClick={() => router.push('/pwa/restaurants/list')}
            aria-label={searchPlaceholder}
            className="absolute flex items-center gap-[9px] rounded-[2px] px-[12px]"
            style={{
              left: 56,
              top: 55,
              width: 272,
              height: 32,
              backgroundColor: 'hsl(0 0% 100% / 0.25)',
            }}
          >
            <SearchIcon size={14} className="shrink-0 text-white" />
            <span className="truncate text-white" style={{ fontSize: 16, fontFamily: OPEN_SANS }}>
              {searchPlaceholder}
            </span>
          </button>
          <button
            type="button"
            aria-label="Saved"
            className="absolute text-white"
            style={{ left: 342, top: 56, width: 18, height: 28 }}
          >
            <svg width={16} height={20} viewBox="0 0 384 512" fill="currentColor" aria-hidden>
              <path d="M0 48C0 21.5 21.5 0 48 0H336c26.5 0 48 21.5 48 48V487.7c0 13.4-10.9 24.3-24.3 24.3c-5 0-9.9-1.5-14-4.4L192 408 38.3 507.6c-4.1 2.9-9 4.4-14 4.4C10.9 512 0 501.1 0 487.7V48z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid scrolleable 2 columnas */}
      <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
        <div className="grid grid-cols-2 gap-3 px-[14px] pb-5 pt-4">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => router.push(`/pwa/restaurants/list?cat=${c.key}`)}
              className="relative h-[92px] overflow-hidden rounded-[6px] bg-cover bg-center"
              style={{ backgroundImage: `url("${resolveAssetUrl(c.image)}")` }}
            >
              <span
                className="absolute inset-0"
                style={{ backgroundColor: 'hsl(0 0% 0% / 0.4)' }}
              />
              <span
                className="absolute inset-0 flex items-center justify-center px-3 text-center font-bold leading-[1.15] text-white"
                style={{ fontSize: 17, letterSpacing: 0.3, ...MONTSERRAT }}
              >
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <PwaBottomNav active="dining" />
    </div>
  );
}
