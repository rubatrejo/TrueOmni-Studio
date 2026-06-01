'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { PassItem } from '@/lib/config';

import { PwaBottomNav } from './bottom-nav';
import { S } from './mobile-layer';
import { PwaSubHeader } from './pwa-sub-header';

const MONTSERRAT = { fontFamily: 'var(--font-montserrat)' } as const;
const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/**
 * Módulo Passes #1 — Grid de passes (`/pwa/passes`). Entry point desde el tile
 * "PASSES" del Dashboard. Header brand (`PwaSubHeader`, back + título) sobre una
 * columna scrolleable de cards full-width (cover + band con título + tagline) y
 * bottom nav fijo. Tap en una card → detalle `/pwa/passes/{slug}`.
 *
 * Réplica mobile del look del kiosk (`pass-card.tsx`). White-label: título desde
 * `config.features.pwa.passes`; los passes se reutilizan de `home.modules.passes`.
 */
export function PassesGridScreen({ title, passes }: { title: string; passes: PassItem[] }) {
  const router = useRouter();

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header brand (escalado) */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={title} backHref="/pwa/dashboard" />
        </div>
      </div>

      {/* Cuerpo scroll: cards de passes */}
      <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto bg-background px-4 pb-5 pt-3">
        {passes.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => router.push(`/pwa/passes/${p.slug}`)}
            className="relative block w-full overflow-hidden rounded-[8px] bg-cover bg-center text-left"
            style={{
              height: 144,
              backgroundImage: `url("${resolveAssetUrl(p.cover)}")`,
              boxShadow: '0 8px 20px -10px hsl(0 0% 0% / 0.45)',
            }}
          >
            <span className="absolute inset-0" style={{ backgroundColor: 'hsl(0 0% 0% / 0.18)' }} />
            <span
              className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[8px] px-4 py-2.5 text-center"
              style={{ width: '84%', backgroundColor: 'hsl(var(--brand-primary) / 0.88)' }}
            >
              <span
                className="font-bold uppercase leading-tight text-white"
                style={{ fontSize: 16, letterSpacing: 0.32, ...MONTSERRAT }}
              >
                {p.title}
              </span>
              {p.tagline ? (
                <span
                  className="mt-1 leading-snug text-white/90"
                  style={{ fontSize: 10, ...OPEN_SANS }}
                >
                  {p.tagline}
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>

      <PwaBottomNav />
    </div>
  );
}
