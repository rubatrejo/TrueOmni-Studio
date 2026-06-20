'use client';

import { useRouter } from 'next/navigation';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { useNotifications } from '@/hooks/use-notifications';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaNotification, PwaQuickAccess, PwaTile } from '@/lib/config';
import { resolvePwaTileRoute } from '@/lib/pwa-routes';

import { PwaBottomNav } from './bottom-nav';
import { NotificationIcon, ProfileIcon, SearchIcon } from './dashboard-icons';
import { Layer, S } from './mobile-layer';
import { usePwaModuleVisibility } from './pwa-bridge-context';

interface DashboardScreenProps {
  logoAlt: string;
  heroTitle: string;
  heroImage: string;
  quickAccess: PwaQuickAccess[];
  tiles: PwaTile[];
  notifications: PwaNotification[];
  /** Tamaño del logo del header (default 'M' = 154px de ancho). */
  logoSize?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  /** Offset del logo en px, sumado a la posición base (left:20, top:48). */
  logoOffset?: { x: number; y: number };
  /** Opacidad (0–100 %) de la capa oscura sobre la foto de cada tile. Si
   *  `undefined`, default 40 % (negro) — el look verbatim del XD. */
  tileOverlayOpacity?: number;
}

/** Ancho del logo del header por tamaño (px). 'M' = 154 (verbatim del XD).
 *  'XS' añadido para logos que necesitan ser aún más pequeños; 'XL' se mantiene
 *  por back-compat aunque el editor ya no lo ofrezca. */
const LOGO_SIZE_PX: Record<'XS' | 'S' | 'M' | 'L' | 'XL', number> = {
  XS: 45,
  S: 124,
  M: 154,
  L: 190,
  XL: 230,
};

const BRAND = 'hsl(var(--brand-primary))';
const PWA = 'hsl(var(--pwa-primary))';
const MONTSERRAT = { fontFamily: 'var(--font-montserrat)' } as const;
const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
/** Fuente Display del cliente (titulares/categorías). Cae a Montserrat. */
const DISPLAY = { fontFamily: 'var(--font-display)' } as const;

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
  logoSize,
  logoOffset,
  tileOverlayOpacity,
}: DashboardScreenProps) {
  // Default 40 % (negro) = look verbatim del XD; con valor → value/100.
  const tileOverlayAlpha = tileOverlayOpacity == null ? 0.4 : tileOverlayOpacity / 100;
  const router = useRouter();
  const { unreadCount } = useNotifications(notifications);
  const logoW = LOGO_SIZE_PX[logoSize ?? 'M'];
  const logoX = 20 + (logoOffset?.x ?? 0);
  const logoY = 48 + (logoOffset?.y ?? 0);
  // Visibilidad efectiva de módulos (override PWA → herencia del Kiosk). Un
  // módulo desactivado desaparece del hero (quick-access) y del grid de tiles.
  const isModuleVisible = usePwaModuleVisibility();
  // Quick Access y los tiles del grid son mutuamente excluyentes: un módulo que
  // ya aparece como acceso rápido del hero no se repite en el grid de abajo.
  // Filtramos los desactivados y re-indexamos (el hero tiene 4 slots fijos).
  const visibleQuickAccess = quickAccess.filter((q) => isModuleVisible(q.key)).slice(0, 4);
  const quickAccessKeys = new Set(visibleQuickAccess.map((q) => q.key));
  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header fijo — tamaños/posiciones verbatim del XD (110 alto; logo 154×29 a
          (20,62); iconos search/profile/inbox a (266/298.5/334, ~68)). El status bar
          (9:41) lo dibuja el SO → su zona superior queda como safe-area azul.
          z-10 para tapar el solape de la foto del hero. */}
      <Layer h={90} className="relative z-10 shrink-0" style={{ backgroundColor: BRAND }}>
        <div className="absolute" style={{ left: logoX, top: logoY, width: logoW }}>
          {/* minWidthPx={0}: el ancho lo dicta `logoW` (logoSize). Sin esto, el
              floor de 120px del override pisaría XS/S y el logo se vería enorme. */}
          <TrueOmniLogo
            className="h-auto w-full text-white"
            title={logoAlt}
            slot="default"
            minWidthPx={0}
          />
        </div>
        {/* before:-inset expande el área de tap a ≥40px sin mover el glifo (E3). */}
        <button
          type="button"
          aria-label="Search"
          onClick={() => router.push('/pwa/search')}
          className="absolute text-white before:absolute before:-inset-[11px] before:content-['']"
          style={{ left: 266, top: 55 }}
        >
          <SearchIcon size={19} />
        </button>
        <button
          type="button"
          aria-label="Profile"
          onClick={() => router.push('/pwa/profile')}
          className="absolute text-white before:absolute before:-inset-[10px] before:content-['']"
          style={{ left: 298, top: 54 }}
        >
          <ProfileIcon size={21} />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => router.push('/pwa/notifications')}
          className="absolute text-white before:absolute before:-inset-2 before:content-['']"
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
        {visibleQuickAccess.map((q, i) => {
          const cx = CARD_X[i] + 33; // centro de la card
          return (
            // key con índice: dos accesos rápidos pueden apuntar al mismo módulo.
            <div key={`${q.key}-${i}`}>
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
                  const dest = resolvePwaTileRoute(q);
                  if (dest) router.push(dest);
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
                style={{ left: cx - 29, top: 245, width: 58, fontSize: 10, ...OPEN_SANS }}
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
          {tiles
            .filter(
              (t) => t.enabled !== false && !quickAccessKeys.has(t.key) && isModuleVisible(t.key),
            )
            .map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  const dest = resolvePwaTileRoute(t);
                  if (dest) router.push(dest);
                }}
                className={`relative h-[125px] overflow-hidden rounded-[6px] bg-cover bg-center ${
                  t.wide ? 'col-span-2' : ''
                }`}
                style={bg(t.image)}
              >
                <span
                  className="absolute inset-0"
                  style={{ backgroundColor: `rgba(0,0,0,${tileOverlayAlpha})` }}
                />
                <span
                  className="absolute inset-0 flex items-center justify-center whitespace-pre-line px-3 text-center text-[15px] font-bold leading-tight text-white"
                  style={DISPLAY}
                >
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
