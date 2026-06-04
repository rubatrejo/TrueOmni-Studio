'use client';

import { useEffect, useState } from 'react';

import { useSafeTimeout } from '@/hooks/use-safe-timeout';
import type { PwaTripPlannerModuleConfig } from '@/lib/config';
import { buildMapboxStaticUrl } from '@/lib/itinerary-asset';

const STORAGE_KEY = 'pwa-trip-planner-welcomed';
const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

// TEMPORAL — modo revisión: el welcome sale CADA vez para revisar el diseño.
// Al aprobar, poner en `false` (show-once vía sessionStorage).
const ALWAYS_SHOW_FOR_REVIEW = true;

/** Pin de categoría sobre la ilustración del mapa del welcome. */
function MapPin({ label, style }: { label: string; style: React.CSSProperties }) {
  return (
    <div className="absolute flex flex-col items-center" style={style}>
      <div
        className="rounded-[8px] bg-white px-2 py-1 text-[10px] font-bold shadow"
        style={{ color: 'hsl(var(--brand-primary))', ...OPEN_SANS }}
      >
        {label}
      </div>
      <svg width={18} height={22} viewBox="0 0 24 30" fill="none" className="-mt-0.5">
        <path
          d="M12 0a9 9 0 00-9 9c0 6.5 9 21 9 21s9-14.5 9-21a9 9 0 00-9-9z"
          fill="hsl(var(--brand-primary))"
        />
        <circle cx="12" cy="9" r="3.4" fill="white" />
      </svg>
    </div>
  );
}

export function TpWelcomePopup({
  tp,
  mapboxToken,
  clientCoords,
}: {
  tp: PwaTripPlannerModuleConfig;
  mapboxToken: string;
  clientCoords: { lat: number; lng: number };
}) {
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);
  const schedule = useSafeTimeout();
  const mapUrl = buildMapboxStaticUrl({
    token: mapboxToken,
    lng: clientCoords.lng,
    lat: clientCoords.lat,
    zoom: 10.5,
    width: 700,
    height: 380,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (ALWAYS_SHOW_FOR_REVIEW || !window.sessionStorage.getItem(STORAGE_KEY)) {
      setShow(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    // Persistir inmediato (no perderlo si se desmonta durante el fade) — C6.
    if (!ALWAYS_SHOW_FOR_REVIEW) window.sessionStorage.setItem(STORAGE_KEY, '1');
    schedule(() => setShow(false), 250);
  };

  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 px-5">
      <div
        className="duration-250 flex w-full flex-col items-center overflow-hidden rounded-[14px] bg-white pb-6 transition-all ease-out"
        style={{
          ...OPEN_SANS,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.96)',
        }}
      >
        {/* Ilustración: mapa real de la ciudad del cliente + pins de categoría */}
        <div
          className="relative h-[190px] w-full bg-cover bg-center"
          style={
            mapUrl
              ? { backgroundImage: `url("${mapUrl}")` }
              : { backgroundColor: 'hsl(var(--brand-secondary)/0.08)' }
          }
        >
          <MapPin label="THINGS TO DO" style={{ left: 28, top: 44 }} />
          <MapPin label="RESTAURANTS" style={{ left: 150, top: 70 }} />
          <MapPin label="PLACES TO STAY" style={{ left: 30, top: 118 }} />
          <MapPin label="VENUES" style={{ right: 24, top: 120 }} />
        </div>

        <div className="flex w-full flex-col items-center px-6 pt-5">
          <h2
            className="text-center text-[22px] font-extrabold leading-tight"
            style={{ color: 'hsl(var(--brand-secondary))' }}
          >
            {tp.welcome.title}
          </h2>
          <p className="mt-2 text-center text-[14px] font-bold text-gray-800">
            {tp.welcome.subtitle}
          </p>
          <p
            className="mt-3 text-center text-[13px] leading-relaxed"
            style={{ color: 'hsl(var(--brand-secondary))' }}
          >
            {tp.welcome.body}
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-5 w-full rounded-full py-[13px] text-center text-[14px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: 'hsl(var(--brand-tertiary))' }}
          >
            {tp.welcome.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
