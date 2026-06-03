'use client';

import { useMemo, useState } from 'react';

import { MapCanvas } from '@/components/map/map-canvas';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { MapSource, PwaTripPlannerModuleConfig } from '@/lib/config';
import type { UseItineraryRailResult } from '@/lib/itinerary-favorites';
import { smartRouteOrder } from '@/lib/itinerary-smart-route';
import type { MapItem } from '@/lib/map-item';

import { Layer } from '../mobile-layer';
import { PwaHeart } from '../pwa-heart';

import type { TpCard } from './types';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

export function TpMapView({
  tp,
  textos,
  stops,
  rail,
  clientCoords,
  mapboxToken,
  onBack,
  onShare,
}: {
  tp: PwaTripPlannerModuleConfig;
  textos: Record<string, string>;
  stops: TpCard[];
  rail: UseItineraryRailResult;
  clientCoords: { lat: number; lng: number };
  mapboxToken: string;
  onBack: () => void;
  onShare: () => void;
}) {
  const [hideMarkers, setHideMarkers] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const mapItems: MapItem[] = useMemo(
    () =>
      hideMarkers
        ? []
        : stops.map((s) => ({
            slug: s.slug,
            source: s.moduleSlug as MapSource,
            moduleSlug: 'trip-planner',
            title: s.title,
            subcategory: s.subcategory,
            image: s.image,
            coords: s.coords,
            address: s.address,
            features: [],
            popularity: 0,
          })),
    [stops, hideMarkers],
  );

  const routeStops = useMemo(
    () => stops.map((s) => ({ lng: s.coords.lng, lat: s.coords.lat })),
    [stops],
  );
  const center = stops[0]?.coords ?? clientCoords;

  const coordByKey = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number }>();
    stops.forEach((s) => m.set(`${s.kind}:${s.slug}`, s.coords));
    return m;
  }, [stops]);

  const onSmartRoute = () => {
    const target = smartRouteOrder(rail.stops, (e) => coordByKey.get(`${e.kind}:${e.slug}`));
    if (!target) return;
    const current = [...rail.stops];
    for (let to = 0; to < target.length; to++) {
      const from = current.findIndex(
        (s) => s.slug === target[to]!.slug && s.kind === target[to]!.kind,
      );
      if (from >= 0 && from !== to) {
        const [moved] = current.splice(from, 1);
        current.splice(to, 0, moved!);
        rail.reorder(from, to);
      }
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      {/* Header (back + share) */}
      <Layer
        h={90}
        className="relative z-10 shrink-0"
        style={{ backgroundColor: 'hsl(var(--brand-primary))' }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="absolute text-white"
          style={{ left: 18, top: 50, height: 28 }}
        >
          <svg width={11.87} height={20.36} viewBox="0 0 11.87 20.36" fill="#fff" aria-hidden>
            <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
          </svg>
        </button>
        <div
          className="pointer-events-none absolute text-center font-bold text-white"
          style={{ left: 60, top: 53, width: 255, fontSize: 17, ...OPEN_SANS }}
        >
          {tp.title}
        </div>
        <button
          type="button"
          aria-label="Share"
          onClick={onShare}
          className="absolute text-white"
          style={{ right: 18, top: 50 }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M18 8a3 3 0 10-2.83-4M6 15a3 3 0 100-6 3 3 0 000 6zm12 7a3 3 0 10-2.83-4M8.6 13.5l6.8 3.9M15.4 6.6l-6.8 3.9"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </Layer>

      {/* Mapa con ruta */}
      <div className="relative min-h-0 flex-1">
        {mapboxToken ? (
          <MapCanvas
            token={mapboxToken}
            items={mapItems}
            center={center}
            zoom={12}
            selectedSlug={selected}
            onSelect={setSelected}
            cluster={false}
            pinScale={0.5}
            routeStops={routeStops}
            fitRouteBounds
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-foreground/40">
            {textos.itinerary_map_unavailable ?? 'Map unavailable'}
          </div>
        )}

        {/* Toolbar */}
        <div
          className="pointer-events-auto absolute inset-x-0 bottom-[150px] flex items-center justify-center gap-2 px-3"
          style={OPEN_SANS}
        >
          <button
            type="button"
            onClick={() => setHideMarkers((h) => !h)}
            className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold shadow"
            style={{ color: 'hsl(var(--brand-primary))' }}
          >
            {textos.itinerary_hide_markers ?? 'Hide Markers'}
          </button>
          <button
            type="button"
            onClick={onSmartRoute}
            className="rounded-full px-3 py-1.5 text-[11px] font-bold text-white shadow"
            style={{ backgroundColor: 'hsl(var(--brand-tertiary))' }}
          >
            {textos.itinerary_smart_route ?? 'Smart Route'}
          </button>
        </div>

        {/* Carrusel de stops */}
        <div
          className="scrollbar-hide absolute inset-x-0 bottom-0 flex gap-3 overflow-x-auto px-3 pb-3"
          style={OPEN_SANS}
        >
          {stops.map((s, i) => {
            const fav = rail.has(s.slug, s.kind);
            return (
              <div
                key={`${s.kind}:${s.slug}`}
                className="flex w-[230px] shrink-0 items-center gap-2 rounded-[12px] bg-white p-2 shadow-lg"
              >
                <div
                  className="relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[8px] bg-cover bg-center"
                  style={{ backgroundImage: `url("${resolveAssetUrl(s.image)}")` }}
                >
                  <span
                    className="absolute left-1 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
                  >
                    {i === 0 ? '★' : i}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase text-foreground/50">
                    {i === 0
                      ? (textos.itinerary_slot_start_label ?? 'Start')
                      : `${textos.itinerary_slot_stop_word ?? 'Stop'} ${i}`}
                  </p>
                  <p className="truncate text-[13px] font-bold text-foreground">{s.title}</p>
                  <p className="text-[10px] text-foreground/60">{s.distanceMi.toFixed(1)} mi</p>
                </div>
                <button
                  type="button"
                  aria-label="Toggle"
                  onClick={() => (fav ? rail.remove(s.slug, s.kind) : rail.add(s.slug, s.kind))}
                >
                  <PwaHeart filled={fav} size={20} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
