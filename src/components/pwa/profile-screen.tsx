'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaProfileEvent, PwaProfileFavorite } from '@/lib/config';

import { InLayerNav } from './in-layer-nav';
import { S } from './mobile-layer';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const BRAND = 'hsl(var(--brand-primary))';
const PWA = 'hsl(var(--pwa-primary))';
const OLIVE = 'hsl(var(--brand-tertiary))';

/** Tipografía consistente de las barras de sección (título + VIEW MORE). */
const BAR_FONT = 'Helvetica, Arial, sans-serif';
const BAR_FONT_SIZE = 14;

interface ProfileScreenProps {
  editProfileLink: string;
  user: { name: string; location: string; weather: string; photo: string; heroImage: string };
  favorites: { title: string; viewMore: string; items: PwaProfileFavorite[] };
  upcomingEvents: { title: string; viewMore: string; items: PwaProfileEvent[] };
  editHref: string;
}

const bg = (src: string): React.CSSProperties => ({
  backgroundImage: `url("${resolveAssetUrl(src)}")`,
});

/** Barra de sección (brand para el título + pwa para VIEW MORE, división recta). */
function SectionBar({ top, title, viewMore }: { top: number; title: string; viewMore: string }) {
  return (
    <div className="absolute" style={{ left: 0, top, width: 375, height: 35 }}>
      <div
        className="absolute left-0 top-0 h-[35px] w-[242px]"
        style={{ backgroundColor: BRAND }}
      />
      <div
        className="absolute top-0 h-[35px]"
        style={{ left: 242, width: 133, backgroundColor: PWA }}
      />
      <span
        className="absolute font-bold text-white"
        style={{ left: 14, top: 10, fontSize: BAR_FONT_SIZE, fontFamily: BAR_FONT }}
      >
        {title}
      </span>
      <span
        className="absolute font-bold text-white"
        style={{ left: 272, top: 10, fontSize: BAR_FONT_SIZE, fontFamily: BAR_FONT }}
      >
        {viewMore}
      </span>
    </div>
  );
}

/** Card de favorito (160×90, ratio 16:9). */
const FAV_W = 160;
const FAV_H = 90;
const FAV_PITCH = FAV_W + 10;

function FavCard({ left, item }: { left: number; item: PwaProfileFavorite }) {
  return (
    <div
      className="absolute overflow-hidden rounded-[6px] bg-cover bg-center"
      style={{ left, top: 0, width: FAV_W, height: FAV_H, ...bg(item.image) }}
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
        style={{ left: 10, top: 38, fontSize: 5, letterSpacing: 0.3, ...OPEN_SANS }}
      >
        {item.subcategory}
      </span>
      <span
        className="absolute font-bold text-white"
        style={{ left: 10, top: 45, fontSize: 11, ...OPEN_SANS }}
      >
        {item.title}
      </span>
      <div
        className="absolute"
        style={{
          left: 0,
          top: 62,
          width: FAV_W,
          height: 28,
          backgroundColor: 'hsl(var(--foreground) / 0.8)',
        }}
      >
        <span
          className="absolute text-white"
          style={{ left: 10, top: 5, fontSize: 7.5, fontWeight: 300, ...OPEN_SANS }}
        >
          {item.distance}
        </span>
        <span
          className="absolute font-semibold"
          style={{ left: 10, top: 16, fontSize: 7.5, color: PWA, ...OPEN_SANS }}
        >
          {item.hours}
        </span>
      </div>
    </div>
  );
}

/** Card de evento (170×220). */
function EventCard({ left, item }: { left: number; item: PwaProfileEvent }) {
  return (
    <div
      className="absolute overflow-hidden rounded-[6px] bg-cover bg-center"
      style={{ left, top: 0, width: 170, height: 220, ...bg(item.image) }}
    >
      {/* Badge de fecha (olive) top-left */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ left: 0, top: 10, width: 70, height: 60.59, backgroundColor: OLIVE }}
      >
        <span className="text-white" style={{ fontSize: 10, ...OPEN_SANS }}>
          {item.weekday}
        </span>
        <span className="text-white" style={{ fontSize: 22, lineHeight: 1, ...OPEN_SANS }}>
          {item.day}
        </span>
      </div>
      {/* Banda inferior */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: 150,
          width: 170,
          height: 70,
          backgroundColor: item.accent === 'brand' ? BRAND : PWA,
          opacity: 0.85,
        }}
      />
      <span
        className="absolute font-bold leading-[1.25] text-white"
        style={{ left: 20, top: 160, width: 140, fontSize: 10, ...OPEN_SANS }}
      >
        {item.title}
      </span>
      <span
        className="absolute text-white"
        style={{ left: 20, top: 200, fontSize: 10, ...OPEN_SANS }}
      >
        {item.time}
      </span>
    </div>
  );
}

/**
 * Profile (`/pwa/profile`) — pantalla 1. Hero (foto + avatar + nombre + ubicación/clima),
 * "MY FAVORITES LIST" y "UPCOMING EVENTS" (scroll horizontal) + bottom nav. Layout fijo
 * 375×812 (verbatim del XD) escalado al canvas; las filas de cards scrollean en horizontal.
 */
export function ProfileScreen({
  editProfileLink,
  user,
  favorites,
  upcomingEvents,
  editHref,
}: ProfileScreenProps) {
  const router = useRouter();

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div
        className="absolute left-0 top-0"
        style={{ width: 375, height: 812, transform: `scale(${S})`, transformOrigin: 'top left' }}
      >
        {/* Hero photo + scrim de opacidad + gradiente */}
        <div
          className="absolute bg-cover bg-center"
          style={{ left: 0, top: 87, width: 375, height: 199, ...bg(user.heroImage) }}
        />
        <div
          className="absolute"
          style={{
            left: 0,
            top: 87,
            width: 375,
            height: 199,
            backgroundColor: 'hsl(0 0% 0% / 0.35)',
          }}
        />
        <div
          className="absolute"
          style={{
            left: 0,
            top: 87,
            width: 375,
            height: 199,
            backgroundImage:
              'linear-gradient(to bottom, hsl(0 0% 0% / 0) 0%, hsl(0 0% 0% / 0.6) 100%)',
          }}
        />

        {/* Avatar */}
        <div
          className="absolute overflow-hidden rounded-full bg-cover bg-center"
          style={{ left: 136, top: 97, width: 103, height: 103, ...bg(user.photo) }}
        />

        {/* Nombre + ubicación/clima */}
        <div
          className="absolute text-center text-white"
          style={{ left: 0, top: 203, width: 375, fontSize: 24, lineHeight: 1, ...OPEN_SANS }}
        >
          {user.name}
        </div>
        <div
          className="absolute flex items-center justify-center gap-1 text-white"
          style={{ left: 0, top: 243, width: 375, fontSize: 12, ...OPEN_SANS }}
        >
          <span>{user.location} |</span>
          <svg width={13} height={13} viewBox="0 0 13.066 13.483" fill="#fff" aria-hidden>
            <path
              d="M6.234,13.393,4.878,11.524l-2.2.708a.228.228,0,0,1-.219-.03.25.25,0,0,1-.1-.2V9.7l-2.2-.723a.233.233,0,0,1-.15-.151.248.248,0,0,1,.03-.219L1.4,6.742.042,4.874a.252.252,0,0,1-.03-.219.232.232,0,0,1,.15-.15l2.2-.723V1.476a.249.249,0,0,1,.1-.2.231.231,0,0,1,.219-.031l2.2.708L6.234.09a.258.258,0,0,1,.391,0L7.982,1.958l2.2-.708a.229.229,0,0,1,.218.031.249.249,0,0,1,.1.2V3.782l2.2.723a.232.232,0,0,1,.15.15.249.249,0,0,1-.03.219L11.462,6.742l1.356,1.867a.246.246,0,0,1,.03.219.233.233,0,0,1-.15.151L10.5,9.7v2.3a.25.25,0,0,1-.1.2.226.226,0,0,1-.218.03l-2.2-.708L6.626,13.393a.244.244,0,0,1-.391,0Z"
              transform="translate(0)"
            />
          </svg>
          <span>{user.weather}</span>
        </div>

        {/* Secciones */}
        <SectionBar top={285.5} title={favorites.title} viewMore={favorites.viewMore} />
        <div
          className="scrollbar-hide absolute overflow-x-auto"
          style={{ left: 20, top: 341, width: 355, height: FAV_H }}
        >
          <div
            className="relative"
            style={{ width: favorites.items.length * FAV_PITCH, height: FAV_H }}
          >
            {favorites.items.map((it, i) => (
              <FavCard key={it.title + i} left={i * FAV_PITCH} item={it} />
            ))}
          </div>
        </div>

        <SectionBar top={446} title={upcomingEvents.title} viewMore={upcomingEvents.viewMore} />
        <div
          className="scrollbar-hide absolute overflow-x-auto"
          style={{ left: 20, top: 501, width: 355, height: 220 }}
        >
          <div
            className="relative"
            style={{ width: upcomingEvents.items.length * 190, height: 220 }}
          >
            {upcomingEvents.items.map((it, i) => (
              <EventCard key={it.title + i} left={i * 190} item={it} />
            ))}
          </div>
        </div>

        {/* Header (encima del hero) */}
        <div
          className="absolute left-0 top-0 bg-[hsl(var(--brand-primary))]"
          style={{ width: 375, height: 90 }}
        />
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.push('/pwa/dashboard')}
          className="absolute"
          style={{ left: 12, top: 46, width: 40, height: 40 }}
        >
          <svg
            className="mx-auto"
            width={11.87}
            height={20.36}
            viewBox="0 0 11.87 20.36"
            fill="#fff"
            aria-hidden
          >
            <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => router.push(editHref)}
          className="absolute font-medium text-white"
          style={{ right: 22, top: 54, fontSize: 17, letterSpacing: '-0.024em', ...OPEN_SANS }}
        >
          {editProfileLink}
        </button>

        {/* Bottom nav */}
        <InLayerNav />
      </div>
    </div>
  );
}
