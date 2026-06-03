'use client';

import { useRouter } from 'next/navigation';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { useNotifications } from '@/hooks/use-notifications';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaNotification, PwaQuickAccess, PwaTile } from '@/lib/config';

import { PwaBottomNav } from './bottom-nav';
import { NotificationIcon, ProfileIcon, SearchIcon } from './dashboard-icons';
import { Layer, S } from './mobile-layer';

interface DashboardScreenProps {
  logoAlt: string;
  heroTitle: string;
  heroImage: string;
  quickAccess: PwaQuickAccess[];
  tiles: PwaTile[];
  notifications: PwaNotification[];
}

const BRAND = 'hsl(var(--brand-primary))';
const PWA = 'hsl(var(--pwa-primary))';
const MONTSERRAT = { fontFamily: 'var(--font-montserrat)' } as const;
const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

const bg = (src: string): React.CSSProperties => ({
  backgroundImage: `url("${resolveAssetUrl(src)}")`,
});

/** Posición x (375-space) de cada card y su halo. */
const CARD_X = [32, 115, 198, 278];
const HALO_X = [27, 110, 193, 273];

/**
 * Home/Dashboard de la PWA (`/pwa/dashboard`) — pantalla 03.
 *
 * Header + hero + nav fijos (no scrollean); solo el grid de tiles scrollea.
 * Hero = capa verbatim del XD (375-space, ×1.04): foto + gradiente azul + negro
 * (horizontales, para el título) + banda `--pwa-primary` + 4 cards con halo
 * blanco 78% + labels. Iconos = Font Awesome 6. Status bar del SO no se dibuja.
 */
export function DashboardScreen({
  logoAlt,
  heroTitle,
  heroImage,
  quickAccess,
  tiles,
  notifications,
}: DashboardScreenProps) {
  const router = useRouter();
  const { unreadCount } = useNotifications(notifications);
  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header fijo — tamaños/posiciones verbatim del XD (110 alto; logo 154×29 a
          (20,62); iconos search/profile/inbox a (266/298.5/334, ~68)). El status bar
          (9:41) lo dibuja el SO → su zona superior queda como safe-area azul.
          z-10 para tapar el solape de la foto del hero. */}
      <Layer h={90} className="relative z-10 shrink-0" style={{ backgroundColor: BRAND }}>
        <div className="absolute" style={{ left: 20, top: 48, width: 154 }}>
          <TrueOmniLogo className="h-auto w-full text-white" title={logoAlt} slot="default" />
        </div>
        <button
          type="button"
          aria-label="Search"
          onClick={() => router.push('/pwa/search')}
          className="absolute text-white"
          style={{ left: 266, top: 55 }}
        >
          <SearchIcon size={19} />
        </button>
        <button
          type="button"
          aria-label="Profile"
          onClick={() => router.push('/pwa/profile')}
          className="absolute text-white"
          style={{ left: 298, top: 54 }}
        >
          <ProfileIcon size={21} />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => router.push('/pwa/notifications')}
          className="absolute text-white"
          style={{ left: 334, top: 53 }}
        >
          <NotificationIcon size={24} />
          {unreadCount > 0 && (
            <span
              className="absolute flex items-center justify-center rounded-full font-bold text-white"
              style={{
                top: -5,
                right: -6,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                fontSize: 10,
                lineHeight: 1,
                backgroundColor: 'hsl(var(--pwa-favorite))',
                fontFamily: 'var(--font-open-sans)',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </Layer>

      {/* Hero fijo (tamaño original del XD). Solapa 14px bajo el header (z menor)
          para que el contenido caiga en las coords exactas del XD (foto y96, título y128). */}
      <Layer h={276} className="shrink-0" style={{ backgroundColor: BRAND, marginTop: -14 * S }}>
        {/* Foto (llena el hero; anclada arriba para que no rebase por la parte superior) */}
        <div
          className="absolute bg-cover bg-top"
          style={{ left: 0, top: 0, width: 375, height: 245, ...bg(heroImage) }}
        />
        {/* Scrim negro vertical full-width (negro arriba → transparente). Verbatim
            del XD: el muestreo da (0,0,0) en la parte alta a todo el ancho. */}
        <div
          className="absolute"
          style={{
            left: 0,
            top: 0,
            width: 375,
            height: 150,
            backgroundImage:
              'linear-gradient(to bottom, hsl(0 0% 0% / 0.92) 0%, hsl(0 0% 0% / 0) 100%)',
          }}
        />
        {/* Título centrado al medio del hero, forzado a 2 renglones */}
        <h1
          className="absolute text-center font-bold leading-[1.18] text-white"
          style={{ left: 45, top: 48, width: 285, fontSize: 23, ...MONTSERRAT }}
        >
          {heroTitle}
        </h1>
        {/* Banda azul brillante (fondo de los cards/labels) */}
        <div
          className="absolute"
          style={{ left: 0, top: 193, width: 375, height: 83, backgroundColor: PWA }}
        />
        {/* 4 accesos rápidos: halo blanco 78% + card 66×74 + label */}
        {quickAccess.slice(0, 4).map((q, i) => {
          const cx = CARD_X[i] + 33; // centro de la card
          return (
            <div key={q.key}>
              {/* halo */}
              <div
                className="absolute"
                style={{
                  left: HALO_X[i],
                  top: 156,
                  width: 76,
                  height: 85,
                  borderRadius: 18,
                  backgroundColor: 'hsl(0 0% 100% / 0.78)',
                }}
              />
              {/* card */}
              <button
                type="button"
                onClick={() => {
                  if (q.key === 'places-to-stay') router.push('/pwa/stay');
                  else if (q.key === 'events') router.push('/pwa/events');
                  else if (q.key === 'trip-planner') router.push('/pwa/trip-planner');
                }}
                className="absolute bg-cover bg-center"
                style={{
                  left: CARD_X[i],
                  top: 161,
                  width: 66,
                  height: 74,
                  borderRadius: 15,
                  ...bg(q.image),
                }}
                aria-label={q.label}
              />
              {/* label (1pt más grande, centrado bajo la card) */}
              <span
                className="absolute text-center font-bold uppercase leading-[1.1] text-white"
                style={{ left: cx - 29, top: 245, width: 58, fontSize: 9, ...OPEN_SANS }}
              >
                {q.label}
              </span>
            </div>
          );
        })}
      </Layer>

      {/* Grid de tiles (único que scrollea) */}
      <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
        <div className="grid grid-cols-2 gap-4 px-5 pb-5 pt-5">
          {tiles.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                if (t.key === 'restaurants') router.push('/pwa/restaurants');
                else if (t.key === 'things-to-do') router.push('/pwa/things-to-do');
                else if (t.key === 'passes') router.push('/pwa/passes');
                else if (t.key === 'map') router.push('/pwa/map');
                else if (t.key === 'digital-brochure') router.push('/pwa/digital-brochure');
                else if (t.key === 'social-wall') router.push('/pwa/social-wall');
                else if (t.key === 'trails') router.push('/pwa/trails');
                else if (t.key === 'deals') router.push('/pwa/deals');
                else if (t.key === 'tickets') router.push('/pwa/tickets');
                else if (t.key === 'wayfinding') router.push('/pwa/wayfinding');
                else if (t.key === 'scavenger-hunt') router.push('/pwa/scavenger-hunt');
              }}
              className={`relative h-[125px] overflow-hidden rounded-[6px] bg-cover bg-center ${
                t.wide ? 'col-span-2' : ''
              }`}
              style={bg(t.image)}
            >
              <span className="absolute inset-0 bg-black/40" />
              <span className="absolute inset-0 flex items-center justify-center px-3 text-center text-[15px] font-bold uppercase leading-tight text-white">
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom nav fijo (componente compartido) */}
      <PwaBottomNav active="home" />
    </div>
  );
}
