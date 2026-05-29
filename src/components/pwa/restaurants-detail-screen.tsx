'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { MapboxMap } from '@/components/listings/mapbox-map';
import { useEscapeToClose } from '@/components/listings/use-escape-to-close';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { DayOpen } from '@/lib/config';

import { PwaBottomNav } from './bottom-nav';
import { S } from './mobile-layer';
import { PwaHeart } from './pwa-heart';

const BRAND = 'hsl(var(--brand-primary))';
const PWA = 'hsl(var(--pwa-primary))';
const OLIVE = 'hsl(var(--brand-tertiary))';
const OPEN_SANS = 'var(--font-open-sans)';
const FG = 'hsl(var(--foreground))';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type DayKey = (typeof DAY_KEYS)[number];
type OpenHours = Record<DayKey, DayOpen>;

function fmtHour(h: number): string {
  const hr = ((h % 24) + 24) % 24;
  const am = hr < 12;
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return `${h12}:00 ${am ? 'am' : 'pm'}`;
}
function rangeOf(d: DayOpen | undefined): string {
  if (!d || d.length < 2) return '';
  return `${fmtHour(d[0])} to ${fmtHour(d[1])}`;
}
/** Índice de hoy (0=lun … 6=dom) a partir de getDay() (0=dom). */
function todayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

export interface RestaurantDetail {
  slug: string;
  title: string;
  image: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  coords: { lat: number; lng: number };
  openHours?: OpenHours;
  menuImage?: string;
  diningGuideUrl?: string;
  gallery?: string[];
}

export interface RestaurantDetailTexts {
  headerTitle: string;
  eyebrow: string;
  call: string;
  website: string;
  addFavorite: string;
  removeFavorite: string;
  menu: string;
  seeDirections: string;
  description: string;
  openNowUntil: string;
  moreHours: string;
  openDiningGuide: string;
  businessHours: { title: string; close: string; days: string[] };
  menuClose: string;
}

/* ---- iconos de la barra de acciones (Call/Website blancos; favorito rojo) ---- */
function ActionIcon({ kind, filled }: { kind: 'call' | 'website' | 'fav'; filled?: boolean }) {
  const s = '#fff';
  if (kind === 'fav') {
    return <PwaHeart filled={filled} size={24} />;
  }
  if (kind === 'call') {
    return (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L17 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"
          stroke={s}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // website
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="15" rx="2" stroke={s} strokeWidth="1.8" />
      <path d="M3 8h18" stroke={s} strokeWidth="1.8" />
      <circle cx="5.5" cy="6" r="0.6" fill={s} />
      <circle cx="7.5" cy="6" r="0.6" fill={s} />
    </svg>
  );
}

/**
 * Restaurants #4–#7 / #10 — detalle. Hero + barra de acciones (Call/Website/Favorite),
 * fila opcional de horario (#10), mapa, dirección y descripción. Popups: menú (#9) y
 * Business Hours (#11). Variantes data-driven: MENU si `menuImage`, fila de horario si
 * `openHours`, dining guide si `diningGuideUrl`.
 */
export function RestaurantsDetailScreen({
  detail,
  texts,
  mapboxToken,
}: {
  detail: RestaurantDetail;
  texts: RestaurantDetailTexts;
  mapboxToken?: string;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  useEscapeToClose(menuOpen, () => setMenuOpen(false));
  useEscapeToClose(hoursOpen, () => setHoursOpen(false));
  useEscapeToClose(galleryOpen, () => setGalleryOpen(false));

  const photos = detail.gallery && detail.gallery.length > 0 ? detail.gallery : [detail.image];
  const galleryRailRef = useRef<HTMLDivElement | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);

  const goToPhoto = (idx: number) => {
    const rail = galleryRailRef.current;
    if (!rail) return;
    const next = Math.max(0, Math.min(photos.length - 1, idx));
    rail.scrollTo({ left: next * rail.clientWidth, behavior: 'smooth' });
    setPhotoIdx(next);
  };
  const onGalleryScroll = () => {
    const rail = galleryRailRef.current;
    if (!rail) return;
    setPhotoIdx(Math.round(rail.scrollLeft / rail.clientWidth));
  };

  const today = todayIndex();
  const todayRange = detail.openHours ? rangeOf(detail.openHours[DAY_KEYS[today]]) : '';
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${detail.coords.lat},${detail.coords.lng}`;
  const open = (url?: string) => url && window.open(url, '_blank', 'noopener,noreferrer');

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header fijo */}
      <div className="relative z-10 shrink-0" style={{ height: 88 * S, backgroundColor: BRAND }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 88, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <button
            type="button"
            aria-label="Back"
            onClick={() =>
              window.history.length > 1 ? router.back() : router.push('/pwa/restaurants/list')
            }
            className="absolute"
            style={{ left: 12, top: 44, width: 40, height: 40 }}
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
          <div
            className="pointer-events-none absolute text-center font-bold text-white"
            style={{ left: 0, top: 50, width: 375, fontSize: 17, fontFamily: OPEN_SANS }}
          >
            {texts.headerTitle}
          </div>
          <button
            type="button"
            aria-label="Share"
            onClick={() => open(detail.website)}
            className="absolute text-white"
            style={{ left: 335, top: 48, width: 26, height: 26 }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="6" cy="12" r="2.4" stroke="#fff" strokeWidth="1.8" />
              <circle cx="18" cy="5.5" r="2.4" stroke="#fff" strokeWidth="1.8" />
              <circle cx="18" cy="18.5" r="2.4" stroke="#fff" strokeWidth="1.8" />
              <path d="M8 11l8-4.5M8 13l8 4.5" stroke="#fff" strokeWidth="1.8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cuerpo scrolleable */}
      <div className="scrollbar-hide flex-1 overflow-y-auto">
        {/* Hero */}
        <div
          className="relative w-full bg-cover bg-center"
          style={{ height: 200, backgroundImage: `url("${resolveAssetUrl(detail.image)}")` }}
        >
          <span
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to bottom, hsl(0 0% 0% / 0) 35%, hsl(0 0% 0% / 0.7) 100%)',
            }}
          />
          <span
            className="absolute font-semibold uppercase tracking-wide text-white/90"
            style={{
              left: 16,
              bottom: detail.menuImage ? 78 : 52,
              fontSize: 11,
              fontFamily: OPEN_SANS,
            }}
          >
            {texts.eyebrow}
          </span>
          <span
            className="absolute font-bold text-white"
            style={{
              left: 16,
              bottom: detail.menuImage ? 50 : 18,
              fontSize: 24,
              fontFamily: OPEN_SANS,
            }}
          >
            {detail.title}
          </span>
          {detail.menuImage && (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="absolute left-1/2 -translate-x-1/2 rounded-[4px] font-bold uppercase text-white"
              style={{
                bottom: 12,
                padding: '8px 26px',
                fontSize: 13,
                backgroundColor: OLIVE,
                fontFamily: OPEN_SANS,
              }}
            >
              {texts.menu}
            </button>
          )}
          <button
            type="button"
            aria-label="Photos"
            onClick={() => setGalleryOpen(true)}
            className="absolute text-white/90"
            style={{ right: 16, bottom: 16, width: 28, height: 26 }}
          >
            <svg width={22} height={20} viewBox="0 0 24 24" fill="none">
              <rect x="6" y="3" width="15" height="12" rx="2" stroke="#fff" strokeWidth="1.6" />
              <path d="M3 7v13a1 1 0 0 0 1 1h13" stroke="#fff" strokeWidth="1.6" />
              <circle cx="11" cy="7.5" r="1.4" stroke="#fff" strokeWidth="1.4" />
              <path d="M9 15l3.5-3.5L21 20" stroke="#fff" strokeWidth="1.6" />
            </svg>
          </button>
        </div>

        {/* Barra de acciones */}
        <div className="flex w-full" style={{ height: 80, backgroundColor: BRAND }}>
          {[
            { k: 'call' as const, label: texts.call, onClick: () => open(`tel:${detail.phone}`) },
            { k: 'website' as const, label: texts.website, onClick: () => open(detail.website) },
            {
              k: 'fav' as const,
              label: fav ? texts.removeFavorite : texts.addFavorite,
              onClick: () => setFav((f) => !f),
            },
          ].map((a, i) => (
            <button
              key={a.k}
              type="button"
              onClick={a.onClick}
              className="flex flex-1 flex-col items-center justify-center gap-1.5 text-white"
              style={i > 0 ? { borderLeft: '1px solid hsl(0 0% 100% / 0.25)' } : undefined}
            >
              <ActionIcon kind={a.k} filled={a.k === 'fav' && fav} />
              <span
                className="px-1 text-center leading-tight"
                style={{ fontSize: 13, fontFamily: OPEN_SANS }}
              >
                {a.label}
              </span>
            </button>
          ))}
        </div>

        {/* Fila de horario (#10) */}
        {detail.openHours && (
          <div
            className="flex items-center justify-between border-b px-[18px]"
            style={{ height: 56, borderColor: 'hsl(var(--foreground) / 0.1)' }}
          >
            <div className="flex items-center gap-2">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke={FG} strokeWidth="1.6" />
                <path d="M12 7v5l3 2" stroke={FG} strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: 13.5, color: FG, fontFamily: OPEN_SANS }}>
                <span className="font-semibold">{texts.openNowUntil} </span>
                {todayRange}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHoursOpen(true)}
              className="font-semibold"
              style={{ fontSize: 13, color: PWA, fontFamily: OPEN_SANS }}
            >
              {texts.moreHours}
            </button>
          </div>
        )}

        {/* Open Dining Guide (#10) */}
        {detail.diningGuideUrl && (
          <button
            type="button"
            onClick={() => open(detail.diningGuideUrl)}
            className="block w-full border-b px-[18px] py-3 text-left font-bold"
            style={{
              fontSize: 13,
              color: PWA,
              borderColor: 'hsl(var(--foreground) / 0.1)',
              fontFamily: OPEN_SANS,
            }}
          >
            {texts.openDiningGuide}
          </button>
        )}

        {/* Mapa */}
        <MapboxMap
          token={mapboxToken}
          coords={detail.coords}
          interactive
          pinScale={0.6}
          className="w-full"
          style={{ height: 150 }}
        />

        {/* Dirección + Directions */}
        <div
          className="border-b px-[18px] py-4"
          style={{ borderColor: 'hsl(var(--foreground) / 0.1)' }}
        >
          <p style={{ fontSize: 14, color: FG, fontFamily: OPEN_SANS }}>{detail.address}</p>
          <button
            type="button"
            onClick={() => open(directionsUrl)}
            className="mt-1 font-bold"
            style={{ fontSize: 13, color: PWA, fontFamily: OPEN_SANS }}
          >
            {texts.seeDirections}
          </button>
        </div>

        {/* Descripción */}
        <div className="px-[18px] py-4">
          <h2 className="font-bold" style={{ fontSize: 17, color: FG, fontFamily: OPEN_SANS }}>
            {texts.description}
          </h2>
          <p
            className="mt-2"
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: 'hsl(var(--foreground) / 0.7)',
              fontFamily: OPEN_SANS,
            }}
          >
            {detail.description}
          </p>
        </div>
      </div>

      <PwaBottomNav active="dining" />

      {/* Popup menú (#9) */}
      {detail.menuImage && menuOpen && (
        <button
          type="button"
          aria-label={texts.menuClose}
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'hsl(0 0% 0% / 0.82)' }}
        >
          <span
            className="block aspect-square w-[86%] overflow-hidden rounded-[8px] bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${resolveAssetUrl(detail.menuImage)}")` }}
          />
        </button>
      )}

      {/* Slideshow de fotos del hero (#6) */}
      {galleryOpen && (
        <div
          className="absolute inset-0 z-50 flex items-center"
          style={{ backgroundColor: 'hsl(0 0% 0% / 0.9)' }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setGalleryOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: 'hsl(0 0% 100% / 0.2)' }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div
            ref={galleryRailRef}
            onScroll={onGalleryScroll}
            className="scrollbar-hide flex w-full snap-x snap-mandatory overflow-x-auto"
          >
            {photos.map((src, i) => (
              <div
                key={i}
                className="flex w-full shrink-0 snap-center items-center justify-center px-5"
              >
                <span
                  className="block w-full overflow-hidden rounded-[10px] bg-cover bg-center"
                  style={{ aspectRatio: '0.82', backgroundImage: `url("${resolveAssetUrl(src)}")` }}
                />
              </div>
            ))}
          </div>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => goToPhoto(photoIdx - 1)}
                disabled={photoIdx === 0}
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full disabled:opacity-30"
                style={{ backgroundColor: 'hsl(0 0% 100% / 0.2)' }}
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M15 5l-7 7 7 7"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => goToPhoto(photoIdx + 1)}
                disabled={photoIdx === photos.length - 1}
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full disabled:opacity-30"
                style={{ backgroundColor: 'hsl(0 0% 100% / 0.2)' }}
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M9 5l7 7-7 7"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="absolute inset-x-0 bottom-8 z-10 flex items-center justify-center gap-2">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Photo ${i + 1}`}
                    onClick={() => goToPhoto(i)}
                    className="rounded-full"
                    style={{
                      width: 7,
                      height: 7,
                      backgroundColor: i === photoIdx ? '#fff' : 'hsl(0 0% 100% / 0.4)',
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal Business Hours (#11) */}
      {detail.openHours && hoursOpen && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'hsl(0 0% 0% / 0.5)' }}
        >
          <button
            type="button"
            aria-label={texts.businessHours.close}
            onClick={() => setHoursOpen(false)}
            className="absolute inset-0"
          />
          <div className="relative w-[86%] rounded-[10px] bg-white p-5 shadow-xl">
            <h3
              className="text-center font-bold"
              style={{ fontSize: 17, color: BRAND, fontFamily: OPEN_SANS }}
            >
              {texts.businessHours.title}
            </h3>
            <div className="mt-3">
              {DAY_KEYS.map((dk, i) => (
                <div
                  key={dk}
                  className="flex items-center justify-between border-b py-2.5"
                  style={{ borderColor: 'hsl(var(--foreground) / 0.12)' }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color: FG,
                      fontFamily: OPEN_SANS,
                      fontWeight: i === today ? 700 : 400,
                    }}
                  >
                    {texts.businessHours.days[i]}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: FG,
                      fontFamily: OPEN_SANS,
                      fontWeight: i === today ? 700 : 400,
                    }}
                  >
                    {rangeOf(detail.openHours?.[dk])}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => setHoursOpen(false)}
                className="font-bold"
                style={{ fontSize: 14, color: PWA, fontFamily: OPEN_SANS }}
              >
                {texts.businessHours.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
