'use client';

import { useRouter } from 'next/navigation';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { useNotifications } from '@/hooks/use-notifications';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaNotification, PwaQuickAccess, PwaTile } from '@/lib/config';
import { resolvePwaTileRoute } from '@/lib/pwa-routes';

import { PwaBottomNavTablet } from './bottom-nav';
import { NotificationIcon, ProfileIcon, SearchIcon } from './dashboard-icons';
import { usePwaModuleVisibility } from './pwa-bridge-context';

/**
 * Dashboard del producto **Tablet** — MISMOS datos que el `DashboardScreen`
 * mobile (`features.pwa.dashboard` + herencia del Kiosk vía bridge) con el
 * MISMO lenguaje visual del PWA (header de marca, hero con título + banda y
 * accesos rápidos con halo, tiles con overlay), pero **a todo el ancho de la
 * tablet** y con tamaños cómodos (no el phone escalado). El phone (pixel-perfect)
 * NO se toca — se elige por `useDevice()` en `DashboardLive`.
 */

const BRAND = 'hsl(var(--brand-primary))';
const DISPLAY = { fontFamily: 'var(--font-display)' } as const;
const MONTSERRAT = { fontFamily: 'var(--font-montserrat)' } as const;
const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

const TILE_TITLE_SIZE_PX: Record<'S' | 'M' | 'L' | 'XL', number> = {
  S: 18,
  M: 21,
  L: 25,
  XL: 30,
};

interface DashboardScreenTabletProps {
  logoAlt: string;
  heroTitle: string;
  heroImage: string;
  quickAccess: PwaQuickAccess[];
  tiles: PwaTile[];
  notifications: PwaNotification[];
  tileOverlayOpacity?: number;
  tileTitleSize?: 'S' | 'M' | 'L' | 'XL';
}

export function DashboardScreenTablet({
  logoAlt,
  heroTitle,
  heroImage,
  quickAccess,
  tiles,
  notifications,
  tileOverlayOpacity,
  tileTitleSize,
}: DashboardScreenTabletProps) {
  const router = useRouter();
  const { unreadCount } = useNotifications(notifications);
  const isModuleVisible = usePwaModuleVisibility();

  const tileOverlayAlpha = tileOverlayOpacity == null ? 0.4 : tileOverlayOpacity / 100;
  const tileTitlePx = TILE_TITLE_SIZE_PX[tileTitleSize ?? 'S'];

  const visibleQuickAccess = quickAccess.filter((q) => isModuleVisible(q.key)).slice(0, 4);
  const quickAccessKeys = new Set(visibleQuickAccess.map((q) => q.key));
  const visibleTiles = tiles.filter(
    (t) => t.enabled !== false && !quickAccessKeys.has(t.key) && isModuleVisible(t.key),
  );
  // Los accesos rápidos van PRIMERO en el grid, con el mismo UI de tile que el
  // resto (rectángulo con overlay + título). Comparten la forma {key,label,
  // image,route}; los tiles además pueden ser `wide`. Los labels de quick access
  // vienen en MAYÚSCULAS del config (XD del phone); en el grid del tablet se pasan
  // a sentence case (solo la primera letra) para igualar a los tiles normales.
  const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const gridItems: (PwaQuickAccess | PwaTile)[] = [
    ...visibleQuickAccess.map((q) => ({ ...q, label: sentenceCase(q.label) })),
    ...visibleTiles,
  ];

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header full-width de marca. */}
      <header
        className="relative z-10 flex shrink-0 items-center justify-between px-8"
        style={{ height: 64, backgroundColor: BRAND }}
      >
        <div className="flex items-center" style={{ width: 160 }}>
          <TrueOmniLogo
            className="h-auto w-full text-white"
            title={logoAlt}
            slot="default"
            minWidthPx={0}
          />
        </div>
        <div className="flex items-center gap-6 text-white">
          <button type="button" aria-label="Search" onClick={() => router.push('/pwa/search')}>
            <SearchIcon size={22} />
          </button>
          <button type="button" aria-label="Profile" onClick={() => router.push('/pwa/profile')}>
            <ProfileIcon size={24} />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => router.push('/pwa/notifications')}
            className="relative"
          >
            <NotificationIcon size={26} />
            {unreadCount > 0 ? (
              <span
                className="absolute -right-1.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ backgroundColor: 'hsl(var(--pwa-favorite))', ...OPEN_SANS }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      {/* Hero full-width: SOLO foto + título. Los accesos rápidos se movieron al
          grid de tiles (mismo UI), así que el hero cubre todo ese espacio. */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: 286 }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${resolveAssetUrl(heroImage)}")` }}
        />
        {/* Scrim negro arriba para legibilidad del título */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: 190,
            backgroundImage:
              'linear-gradient(to bottom, hsl(0 0% 0% / 0.85) 0%, hsl(0 0% 0% / 0) 100%)',
          }}
        />
        <h1
          className="absolute left-1/2 top-[64px] w-[680px] -translate-x-1/2 whitespace-pre-line text-center font-bold leading-[1.18] text-white"
          style={{ fontSize: 36, ...MONTSERRAT }}
        >
          {heroTitle}
        </h1>
      </div>

      {/* Grid de tiles a todo el ancho (3 columnas). */}
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto bg-background">
        <div className="grid grid-cols-3 gap-5 px-8 pb-8 pt-6">
          {gridItems.map((t, i) => (
            <button
              key={`${t.key}-${i}`}
              type="button"
              onClick={() => {
                const dest = resolvePwaTileRoute(t);
                if (dest) router.push(dest);
              }}
              // En tablet todos los tiles van a tamaño normal (1 columna); se
              // ignora el flag `wide` del PWA para que el grid 3-col quede parejo.
              className="relative h-[150px] overflow-hidden rounded-[12px] bg-cover bg-center"
              style={{ backgroundImage: `url("${resolveAssetUrl(t.image)}")` }}
            >
              <span
                className="absolute inset-0"
                style={{ backgroundColor: `rgba(0,0,0,${tileOverlayAlpha})` }}
              />
              <span
                className="absolute inset-0 flex items-center justify-center whitespace-pre-line px-3 text-center font-bold leading-tight text-white"
                style={{ ...DISPLAY, fontSize: tileTitlePx }}
              >
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom nav full-width compacto. */}
      <PwaBottomNavTablet active="home" />
    </div>
  );
}
