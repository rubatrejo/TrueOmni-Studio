'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaListingCategory } from '@/lib/config';

import { PwaBottomNav, type PwaNavKey } from './bottom-nav';
import { ProfileIcon, SearchIcon } from './dashboard-icons';
import { useDevice } from './device-context';
import { S } from './mobile-layer';
import { SavedTripButton } from './saved-trip-button';

const BRAND = 'hsl(var(--brand-primary))';
const MONTSERRAT = { fontFamily: 'var(--font-montserrat)' } as const;
const OPEN_SANS = 'var(--font-open-sans)';
const HEADER_H = 90;

/**
 * Módulo de listings #1 — Grid de categorías. Header brand fijo (circle-user +
 * search estilo More + bookmark) sobre un grid 2×N scrolleable de tiles
 * temáticas. Tap en una tile → lista con ese título. Reutilizado por Restaurants,
 * Places to Stay y futuros módulos vía `basePath` (`/pwa/restaurants`, `/pwa/stay`…).
 */
export function ListingsGridScreen({
  searchPlaceholder,
  categories,
  basePath,
  navActive,
}: {
  searchPlaceholder: string;
  categories: PwaListingCategory[];
  /** Ruta base del módulo, ej. "/pwa/restaurants" o "/pwa/stay". */
  basePath: string;
  /** Celda del bottom nav a resaltar (opcional). */
  navActive?: PwaNavKey;
}) {
  const router = useRouter();
  const { isTablet } = useDevice();

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header brand fijo. En tablet va full-width a tamaño dashboard (iconos a
          los bordes con gap); en phone, 375-space escalado (pixel-perfect XD). */}
      {isTablet ? (
        <header
          className="relative z-10 flex shrink-0 items-center gap-4 px-8"
          style={{ height: 64, backgroundColor: BRAND }}
        >
          <button type="button" aria-label="Account" className="shrink-0 text-white">
            <ProfileIcon size={26} />
          </button>
          <button
            type="button"
            onClick={() => router.push(`${basePath}/list`)}
            aria-label={searchPlaceholder}
            className="flex h-10 flex-1 items-center gap-2 rounded-full px-[14px]"
            style={{ backgroundColor: 'hsl(0 0% 100% / 0.25)' }}
          >
            <SearchIcon size={16} className="shrink-0 text-white" />
            <span className="truncate text-white" style={{ fontSize: 15, fontFamily: OPEN_SANS }}>
              {searchPlaceholder}
            </span>
          </button>
          <SavedTripButton size={24} className="shrink-0" />
        </header>
      ) : (
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
              className="absolute flex items-center justify-center text-white"
              style={{ left: 20, top: 52, width: 28, height: 28 }}
            >
              <ProfileIcon size={26} />
            </button>
            <button
              type="button"
              onClick={() => router.push(`${basePath}/list`)}
              aria-label={searchPlaceholder}
              className="absolute flex items-center gap-2 rounded-full px-[14px]"
              style={{
                left: 56,
                top: 46,
                width: 272,
                height: 40,
                backgroundColor: 'hsl(0 0% 100% / 0.25)',
              }}
            >
              <SearchIcon size={15} className="shrink-0 text-white" />
              <span className="truncate text-white" style={{ fontSize: 15, fontFamily: OPEN_SANS }}>
                {searchPlaceholder}
              </span>
            </button>
            <SavedTripButton size={22} className="absolute" style={{ left: 342, top: 52 }} />
          </div>
        </div>
      )}

      {/* Grid scrolleable. Phone = 2-col compacto (XD). Tablet = 2-col con cards
          más grandes (gap-5, px-8, h-200, rounded-12). */}
      <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
        {isTablet ? (
          <div className="grid grid-cols-2 gap-5 px-8 pb-8 pt-6">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => router.push(`${basePath}/list?cat=${c.key}`)}
                className="relative h-[200px] overflow-hidden rounded-[12px] bg-cover bg-center"
                style={{ backgroundImage: `url("${resolveAssetUrl(c.image)}")` }}
              >
                <span
                  className="absolute inset-0"
                  style={{ backgroundColor: 'hsl(0 0% 0% / 0.4)' }}
                />
                <span
                  className="absolute inset-0 flex items-center justify-center px-3 text-center font-bold leading-[1.15] text-white"
                  style={{ fontSize: 24, letterSpacing: 0.3, ...MONTSERRAT }}
                >
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-[14px] pb-5 pt-4">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => router.push(`${basePath}/list?cat=${c.key}`)}
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
        )}
      </div>

      <PwaBottomNav active={navActive} />
    </div>
  );
}
