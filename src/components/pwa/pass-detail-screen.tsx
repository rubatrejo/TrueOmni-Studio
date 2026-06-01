'use client';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { PassActivity, PassItem, PwaPassesModuleConfig } from '@/lib/config';

import { PwaBottomNav } from './bottom-nav';
import { S } from './mobile-layer';
import { PwaSubHeader } from './pwa-sub-header';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const FG = 'hsl(var(--foreground))';
const PWA = 'hsl(var(--pwa-primary))';

/** Abre un enlace externo en una pestaña nueva, de forma segura. */
function openExternal(url?: string) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}

/** Comparte el pass vía Web Share API; si no está disponible, abre el link. */
function sharePass(pass: PassItem) {
  const url = pass.bandwangoUrl;
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    navigator.share({ title: pass.title, text: pass.tagline, url }).catch(() => {});
  } else {
    openExternal(url);
  }
}

/** Botón de compartir del header (mismo glyph que el detalle de listings). */
function ShareButton({ onShare }: { onShare: () => void }) {
  return (
    <button type="button" aria-label="Share" onClick={onShare}>
      <svg width={18} height={20} viewBox="0 0 72.914 81.25" fill="currentColor" aria-hidden>
        <g transform="translate(-13.543 -9.375)">
          <path d="M70.832,9.375a15.625,15.625,0,1,1-11.52,26.18L43.9,44.8a15.61,15.61,0,0,1,0,10.395l15.41,9.246A15.607,15.607,0,1,1,56.094,69.8l-15.41-9.25a15.623,15.623,0,1,1,0-21.113l15.41-9.25A15.627,15.627,0,0,1,70.832,9.375Z" />
        </g>
      </svg>
    </button>
  );
}

/** Fila de actividad — thumbnail + título + descripción + enlace externo. */
function ActivityRow({ activity, viewWebsite }: { activity: PassActivity; viewWebsite: string }) {
  return (
    <div
      className="flex gap-2.5 border-b px-[14px] py-3"
      style={{ borderColor: 'hsl(var(--foreground) / 0.1)' }}
    >
      <span
        className="block h-[74px] w-[74px] shrink-0 overflow-hidden rounded-[6px] bg-cover bg-center"
        style={{ backgroundImage: `url("${resolveAssetUrl(activity.image)}")` }}
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-bold" style={{ fontSize: 12, color: FG, ...OPEN_SANS }}>
          {activity.title}
        </h3>
        <p
          className="mt-0.5"
          style={{
            fontSize: 10,
            lineHeight: 1.45,
            color: 'hsl(var(--foreground) / 0.7)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            ...OPEN_SANS,
          }}
        >
          {activity.description}
        </p>
        <button
          type="button"
          onClick={() => openExternal(activity.website)}
          className="mt-1 font-semibold"
          style={{ fontSize: 10.5, color: PWA, ...OPEN_SANS }}
        >
          {viewWebsite}
        </button>
      </div>
    </div>
  );
}

/**
 * Módulo Passes #2 — detalle (`/pwa/passes/[slug]`). Hero con cover + eyebrow +
 * título + tagline (sin CTA "GET YOURS": no aplica en mobile) + botón Share en el
 * header, seguido de la lista de actividades incluidas (cada una con "View Website"
 * → sitio externo) y bottom nav fijo.
 *
 * Réplica mobile de `pass-detail.tsx` + `activity-row.tsx` del kiosk. White-label:
 * textos UI desde `config.features.pwa.passes`; el pass desde `home.modules.passes`.
 */
export function PassDetailScreen({
  pass,
  texts,
}: {
  pass: PassItem;
  texts: PwaPassesModuleConfig;
}) {
  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header brand (escalado) */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader
            title={pass.title}
            backHref="/pwa/passes"
            right={<ShareButton onShare={() => sharePass(pass)} />}
          />
        </div>
      </div>

      {/* Cuerpo scroll */}
      <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
        {/* Hero */}
        <div
          className="relative w-full bg-cover bg-center"
          style={{ height: 160, backgroundImage: `url("${resolveAssetUrl(pass.cover)}")` }}
        >
          <span
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to bottom, hsl(0 0% 0% / 0) 30%, hsl(0 0% 0% / 0.75) 100%)',
            }}
          />
          <span
            className="absolute font-semibold uppercase tracking-wide text-white/90"
            style={{ left: 14, bottom: pass.tagline ? 44 : 18, fontSize: 9, ...OPEN_SANS }}
          >
            {texts.eyebrow}
          </span>
          <span
            className="absolute font-bold text-white"
            style={{ left: 14, bottom: pass.tagline ? 22 : 11, fontSize: 19, ...OPEN_SANS }}
          >
            {pass.title}
          </span>
          {pass.tagline ? (
            <span
              className="absolute text-white/90"
              style={{ left: 14, right: 14, bottom: 8, fontSize: 10.5, ...OPEN_SANS }}
            >
              {pass.tagline}
            </span>
          ) : null}
        </div>

        {/* Lista de actividades */}
        {pass.activities.length > 0 ? (
          pass.activities.map((a) => (
            <ActivityRow key={a.slug} activity={a} viewWebsite={texts.viewWebsite} />
          ))
        ) : (
          <p
            className="px-[14px] py-8 text-center"
            style={{ fontSize: 11, color: 'hsl(var(--foreground) / 0.6)', ...OPEN_SANS }}
          >
            {texts.activitiesEmpty}
          </p>
        )}
      </div>

      <PwaBottomNav />
    </div>
  );
}
