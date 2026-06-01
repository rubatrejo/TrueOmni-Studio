'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { BrochureItem, PwaDigitalBrochureModuleConfig } from '@/lib/config';

import { PwaBottomNav } from './bottom-nav';
import { SearchIcon } from './dashboard-icons';
import { S } from './mobile-layer';

const BRAND = 'hsl(var(--brand-primary))';
const PWA = 'hsl(var(--pwa-primary))';
const FG = 'hsl(var(--foreground))';
const OPEN_SANS = 'var(--font-open-sans)';
const HEADER_H = 150;

/** Cover A4 (ratio 0.707) con fallback a gradiente de marca si falla la imagen. */
function Cover({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const box = 'h-[124px] w-[88px] shrink-0 overflow-hidden rounded-[5px]';
  if (failed || !src) {
    return (
      <div
        aria-hidden
        className={box}
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-secondary)))',
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolveAssetUrl(src)}
      alt={alt}
      onError={() => setFailed(true)}
      className={`${box} object-cover`}
    />
  );
}

/**
 * Digital Brochure #1 — listado (`/pwa/digital-brochure`). Mismo header brand que
 * `ListingsListScreen` (back + título centrado), pero donde va el segmented
 * "Listings/Map" va el **search bar** (filtra el listado por título/desc/categoría).
 * Debajo: tabs de categoría (All + categorías) + cards (cover A4 + categoría +
 * título + descripción + fecha). Tap en card → reader. Bottom nav sin `active`.
 *
 * White-label: textos desde `config.features.pwa.digitalBrochure`; la data
 * (cover/título/fecha/pdf) se reutiliza del kiosk (`home.modules['digital-brochure']`).
 */
export function BrochuresListScreen({
  texts,
  categories,
  brochures,
}: {
  texts: PwaDigitalBrochureModuleConfig;
  categories: string[];
  brochures: BrochureItem[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brochures.filter((b) => {
      if (category !== 'all' && b.category !== category) return false;
      if (q) {
        const hay = `${b.title} ${b.description} ${b.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [brochures, category, query]);

  const tabs = ['all', ...categories];

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header brand (mismo patrón que ListingsListScreen): back + título +
          search bar donde va el segmented "Listings/Map". */}
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
            aria-label="Back"
            onClick={() => router.back()}
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
            {texts.title}
          </div>
          {/* Search bar (sustituye al segmented Listings/Map del listings screen) */}
          <div
            className="absolute flex items-center gap-2 rounded-full px-[14px] text-white"
            style={{
              left: 16,
              top: 100,
              width: 343,
              height: 38,
              backgroundColor: 'hsl(0 0% 100% / 0.25)',
            }}
          >
            <SearchIcon size={15} className="shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={texts.searchPlaceholder}
              className="h-full flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/70"
              style={{ fontFamily: OPEN_SANS }}
            />
            {query.trim() ? (
              <button
                type="button"
                aria-label="Clear"
                onClick={() => setQuery('')}
                className="text-xl leading-none text-white/70"
              >
                ×
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabs de categoría */}
      <div
        className="scrollbar-hide flex shrink-0 items-center gap-6 overflow-x-auto border-b px-4"
        style={{ height: 46, borderColor: 'hsl(var(--foreground) / 0.1)' }}
      >
        {tabs.map((t) => {
          const active = category === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setCategory(t)}
              aria-pressed={active}
              className="relative h-full shrink-0 whitespace-nowrap"
              style={{
                fontSize: 14,
                fontFamily: OPEN_SANS,
                fontWeight: active ? 700 : 500,
                color: active ? PWA : 'hsl(var(--foreground) / 0.5)',
              }}
            >
              {t === 'all' ? texts.allLabel : t}
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 rounded-t"
                  style={{ height: 3, backgroundColor: PWA }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Lista de brochures */}
      <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
        {visible.length === 0 ? (
          <p
            className="px-6 py-16 text-center"
            style={{ fontSize: 14, color: 'hsl(var(--foreground) / 0.6)', fontFamily: OPEN_SANS }}
          >
            {texts.noResults.replace('{query}', query.trim())}
          </p>
        ) : (
          <ul className="px-4 py-4">
            {visible.map((b) => (
              <li key={b.slug} className="mb-3.5">
                <button
                  type="button"
                  onClick={() => router.push(`/pwa/digital-brochure/${b.slug}`)}
                  className="flex w-full items-stretch gap-3 overflow-hidden rounded-[8px] p-3 text-left"
                  style={{ backgroundColor: 'hsl(var(--foreground) / 0.05)' }}
                >
                  <Cover src={b.cover} alt={b.title} />
                  <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <span
                      style={{
                        fontSize: 12,
                        color: 'hsl(var(--foreground) / 0.55)',
                        fontFamily: OPEN_SANS,
                      }}
                    >
                      {b.category}
                    </span>
                    <span
                      className="font-bold"
                      style={{
                        fontSize: 16,
                        lineHeight: 1.2,
                        color: FG,
                        fontFamily: OPEN_SANS,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {b.title}
                    </span>
                    <span
                      style={{
                        fontSize: 12.5,
                        lineHeight: 1.4,
                        color: 'hsl(var(--foreground) / 0.6)',
                        fontFamily: OPEN_SANS,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {b.description}
                    </span>
                    <span
                      className="mt-0.5"
                      style={{
                        fontSize: 11.5,
                        color: 'hsl(var(--foreground) / 0.45)',
                        fontFamily: OPEN_SANS,
                      }}
                    >
                      {b.publishedLabel}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PwaBottomNav />
    </div>
  );
}
