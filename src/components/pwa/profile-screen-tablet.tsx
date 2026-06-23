'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaProfileEvent, PwaProfileFavorite } from '@/lib/config';

import { PwaBottomNavTablet } from './bottom-nav';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const BRAND = 'hsl(var(--brand-primary))';
const PWA = 'hsl(var(--pwa-primary))';
const OLIVE = 'hsl(var(--brand-tertiary))';

const BAR_FONT = 'Helvetica, Arial, sans-serif';

interface ProfileScreenTabletProps {
  editProfileLink: string;
  user: { name: string; location: string; weather: string; photo: string; heroImage: string };
  favorites: { title: string; viewMore: string; items: PwaProfileFavorite[] };
  upcomingEvents: { title: string; viewMore: string; items: PwaProfileEvent[] };
  editHref: string;
}

const bg = (src: string): React.CSSProperties => ({
  backgroundImage: `url("${resolveAssetUrl(src)}")`,
});

/** Barra de sección full-width (título brand a la izquierda + VIEW MORE pwa a la derecha). */
function SectionBar({ title, viewMore }: { title: string; viewMore: string }) {
  return (
    <div className="flex h-[44px] w-full items-stretch">
      <div className="flex flex-1 items-center px-8" style={{ backgroundColor: BRAND }}>
        <span className="font-bold text-white" style={{ fontSize: 18, fontFamily: BAR_FONT }}>
          {title}
        </span>
      </div>
      <div
        className="flex items-center justify-end px-8"
        style={{ width: 220, backgroundColor: PWA }}
      >
        <span className="font-bold text-white" style={{ fontSize: 18, fontFamily: BAR_FONT }}>
          {viewMore}
        </span>
      </div>
    </div>
  );
}

/** Card de favorito tablet (240×135, ratio 16:9). */
const FAV_W = 240;
const FAV_H = 135;

function FavCard({ item }: { item: PwaProfileFavorite }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[10px] bg-cover bg-center"
      style={{ width: FAV_W, height: FAV_H, ...bg(item.image) }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, hsl(0 0% 0% / 0) 35%, hsl(0 0% 0% / 0.6) 100%)',
        }}
      />
      <span
        className="absolute text-white/90"
        style={{ left: 14, top: 70, fontSize: 12, letterSpacing: 0.3, ...OPEN_SANS }}
      >
        {item.subcategory}
      </span>
      <span
        className="absolute font-bold text-white"
        style={{ left: 14, top: 84, fontSize: 15, ...OPEN_SANS }}
      >
        {item.title}
      </span>
      <div
        className="absolute inset-x-0"
        style={{ bottom: 0, height: 40, backgroundColor: 'hsl(var(--foreground) / 0.8)' }}
      >
        <span
          className="absolute text-white"
          style={{ left: 14, top: 7, fontSize: 12, fontWeight: 300, ...OPEN_SANS }}
        >
          {item.distance}
        </span>
        <span
          className="absolute font-semibold"
          style={{ left: 14, top: 22, fontSize: 12, color: PWA, ...OPEN_SANS }}
        >
          {item.hours}
        </span>
      </div>
    </div>
  );
}

/** Card de evento tablet (230×300). */
const EVT_W = 230;
const EVT_H = 300;

function EventCard({ item }: { item: PwaProfileEvent }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[10px] bg-cover bg-center"
      style={{ width: EVT_W, height: EVT_H, ...bg(item.image) }}
    >
      {/* Badge de fecha (olive) top-left */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ left: 0, top: 14, width: 92, height: 80, backgroundColor: OLIVE }}
      >
        <span className="text-white" style={{ fontSize: 13, ...OPEN_SANS }}>
          {item.weekday}
        </span>
        <span className="text-white" style={{ fontSize: 30, lineHeight: 1, ...OPEN_SANS }}>
          {item.day}
        </span>
      </div>
      {/* Banda inferior */}
      <div
        className="absolute inset-x-0"
        style={{
          bottom: 0,
          height: 96,
          backgroundColor: item.accent === 'brand' ? BRAND : PWA,
          opacity: 0.85,
        }}
      />
      <span
        className="absolute font-bold leading-[1.25] text-white"
        style={{ left: 26, bottom: 40, width: 185, fontSize: 14, ...OPEN_SANS }}
      >
        {item.title}
      </span>
      <span
        className="absolute text-white"
        style={{ left: 26, bottom: 16, fontSize: 13, ...OPEN_SANS }}
      >
        {item.time}
      </span>
    </div>
  );
}

/**
 * Profile del producto **Tablet** — MISMOS datos que el `ProfileScreen` mobile
 * (`features.pwa.profile` + bridge) con el MISMO lenguaje visual (hero con foto +
 * avatar + nombre/ubicación, barras de sección brand/pwa, filas de cards en scroll
 * horizontal) pero a todo el ancho de la tablet y con tamaños cómodos. El phone
 * (pixel-perfect) NO se toca — se elige por `useDevice()` en `ProfileScreenLive`.
 */
export function ProfileScreenTablet({
  editProfileLink,
  user,
  favorites,
  upcomingEvents,
  editHref,
}: ProfileScreenTabletProps) {
  const router = useRouter();

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header full-width: back + Edit Profile */}
      <header
        className="relative z-10 flex shrink-0 items-center justify-between px-8"
        style={{ height: 64, backgroundColor: BRAND }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.push('/pwa/dashboard')}
          className="text-white"
        >
          <svg width={14} height={24} viewBox="0 0 11.87 20.36" fill="#fff" aria-hidden>
            <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => router.push(editHref)}
          className="font-medium text-white"
          style={{ fontSize: 18, letterSpacing: '-0.024em', ...OPEN_SANS }}
        >
          {editProfileLink}
        </button>
      </header>

      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto bg-background">
        {/* Hero full-width: foto + scrim + avatar + nombre + ubicación/clima */}
        <div className="relative w-full overflow-hidden" style={{ height: 340 }}>
          <div className="absolute inset-0 bg-cover bg-center" style={bg(user.heroImage)} />
          <div className="absolute inset-0" style={{ backgroundColor: 'hsl(0 0% 0% / 0.35)' }} />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to bottom, hsl(0 0% 0% / 0) 0%, hsl(0 0% 0% / 0.6) 100%)',
            }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 overflow-hidden rounded-full bg-cover bg-center"
            style={{ top: 40, width: 150, height: 150, ...bg(user.photo) }}
          />
          <div
            className="absolute inset-x-0 text-center text-white"
            style={{ top: 206, fontSize: 32, lineHeight: 1, ...OPEN_SANS }}
          >
            {user.name}
          </div>
          <div
            className="absolute inset-x-0 flex items-center justify-center gap-1.5 text-white"
            style={{ top: 256, fontSize: 16, ...OPEN_SANS }}
          >
            <span>{user.location} |</span>
            <svg width={16} height={16} viewBox="0 0 13.066 13.483" fill="#fff" aria-hidden>
              <path d="M6.234,13.393,4.878,11.524l-2.2.708a.228.228,0,0,1-.219-.03.25.25,0,0,1-.1-.2V9.7l-2.2-.723a.233.233,0,0,1-.15-.151.248.248,0,0,1,.03-.219L1.4,6.742.042,4.874a.252.252,0,0,1-.03-.219.232.232,0,0,1,.15-.15l2.2-.723V1.476a.249.249,0,0,1,.1-.2.231.231,0,0,1,.219-.031l2.2.708L6.234.09a.258.258,0,0,1,.391,0L7.982,1.958l2.2-.708a.229.229,0,0,1,.218.031.249.249,0,0,1,.1.2V3.782l2.2.723a.232.232,0,0,1,.15.15.249.249,0,0,1-.03.219L11.462,6.742l1.356,1.867a.246.246,0,0,1,.03.219.233.233,0,0,1-.15.151L10.5,9.7v2.3a.25.25,0,0,1-.1.2.226.226,0,0,1-.218.03l-2.2-.708L6.626,13.393a.244.244,0,0,1-.391,0Z" />
            </svg>
            <span>{user.weather}</span>
          </div>
        </div>

        {/* MY FAVORITES LIST */}
        <SectionBar title={favorites.title} viewMore={favorites.viewMore} />
        <div className="scrollbar-hide overflow-x-auto px-8 py-5">
          <div className="flex gap-4">
            {favorites.items.map((it, i) => (
              <FavCard key={it.title + i} item={it} />
            ))}
          </div>
        </div>

        {/* UPCOMING EVENTS */}
        <SectionBar title={upcomingEvents.title} viewMore={upcomingEvents.viewMore} />
        <div className="scrollbar-hide overflow-x-auto px-8 py-5">
          <div className="flex gap-4">
            {upcomingEvents.items.map((it, i) => (
              <EventCard key={it.title + i} item={it} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav full-width (Profile no tiene celda → sin active) */}
      <PwaBottomNavTablet />
    </div>
  );
}
