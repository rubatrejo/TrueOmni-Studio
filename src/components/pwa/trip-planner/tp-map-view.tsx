'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { MapCanvas } from '@/components/map/map-canvas';
import type { MapSource, PwaTripPlannerModuleConfig } from '@/lib/config';
import type { UseItineraryRailResult } from '@/lib/itinerary-favorites';
import { smartRouteOrder } from '@/lib/itinerary-smart-route';
import type { MapItem } from '@/lib/map-item';

import { Layer } from '../mobile-layer';
import { ShareIconButton } from '../share-icon-button';

import { TP_STOP_CARD_GAP, TP_STOP_CARD_W, TpStopCard } from './tp-stop-card';
import type { TpCard } from './types';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/**
 * Pill de la toolbar (mismo lenguaje que el kiosk `map-toolbar`: outline blanco
 * sobre fondo navy), compacto para mobile.
 */
function TbPill({
  label,
  onTap,
  disabled = false,
}: {
  label: string;
  onTap: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      className="flex h-[28px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-2.5 text-[10px] font-semibold text-white transition disabled:opacity-40"
      style={{ borderColor: 'rgba(255,255,255,0.7)' }}
    >
      {label}
    </button>
  );
}

/** Toggle switch de la toolbar (idéntico al del kiosk, escalado a mobile). */
function TbToggle({ label, on, onChange }: { label: string; on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={on}
      className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[10px] font-medium text-white"
    >
      <span
        className="relative h-[16px] w-[28px] rounded-full transition"
        style={{ backgroundColor: on ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)' }}
      >
        <span
          className="absolute top-[2px] h-[12px] w-[12px] rounded-full transition"
          style={{ left: on ? 14 : 2, backgroundColor: on ? 'hsl(var(--brand-primary))' : 'white' }}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}

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
  const [showDriving, setShowDriving] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const syncing = useRef(false);

  // Padding del encuadre: deja los pins por encima del panel inferior
  // (toolbar + carrusel) para que se vean todos. Aplica al fitBounds inicial
  // y al easeTo del pin seleccionado.
  const FLY_PADDING = useMemo(() => ({ bottom: 170, top: 10, left: 8, right: 8 }), []);

  // Pin seleccionado → centrar su card en el carrusel.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || selected == null) return;
    const idx = stops.findIndex((s) => s.slug === selected);
    if (idx < 0) return;
    syncing.current = true;
    rail.scrollTo({ left: idx * (TP_STOP_CARD_W + TP_STOP_CARD_GAP), behavior: 'smooth' });
    const t = setTimeout(() => (syncing.current = false), 450);
    return () => clearTimeout(t);
  }, [selected, stops]);

  // Scroll del carrusel → seleccionar el pin centrado (mapa vuela a esa parada).
  const onRailScroll = () => {
    if (syncing.current || !railRef.current) return;
    const idx = Math.round(railRef.current.scrollLeft / (TP_STOP_CARD_W + TP_STOP_CARD_GAP));
    const slug = stops[idx]?.slug;
    if (slug && slug !== selected) setSelected(slug);
  };

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
        <ShareIconButton
          onShare={onShare}
          size={20}
          className="absolute right-[18px] top-[50px] text-white"
        />
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
            selectedPinScale={0.34}
            routeStops={showDriving ? routeStops : undefined}
            fitRouteBounds
            flyToPadding={FLY_PADDING}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-foreground/40">
            {textos.itinerary_map_unavailable ?? 'Map unavailable'}
          </div>
        )}

        {/* Hoja inferior: toolbar navy (estilo kiosk, sin Share) + carrusel sobre blanco */}
        <div className="absolute inset-x-0 bottom-0">
          {/* Toolbar — Remove All · Show Driving · Hide Markers · Smart Route */}
          <div
            className="flex items-center justify-between gap-1.5 px-3 py-2.5"
            style={{ backgroundColor: 'hsl(var(--brand-primary))', ...OPEN_SANS }}
          >
            <TbPill
              label={textos.itinerary_remove_all ?? 'Remove All'}
              onTap={() => rail.clear()}
              disabled={stops.length === 0}
            />
            <TbToggle
              label={textos.itinerary_show_driving ?? 'Show Driving'}
              on={showDriving}
              onChange={() => setShowDriving((d) => !d)}
            />
            <TbToggle
              label={textos.itinerary_hide_markers ?? 'Hide Markers'}
              on={hideMarkers}
              onChange={() => setHideMarkers((h) => !h)}
            />
            <TbPill
              label={textos.itinerary_smart_route ?? 'Smart Route'}
              onTap={onSmartRoute}
              disabled={stops.length === 0}
            />
          </div>

          {/* Carrusel de stops — cards estilo módulo Map (imagen 16:9 + footer gris).
              Tap/scroll en una card → vuela al pin de esa parada en el mapa. */}
          <div
            ref={railRef}
            onScroll={onRailScroll}
            className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto bg-background px-3 pb-3 pt-3 shadow-[0_-6px_16px_rgba(0,0,0,0.10)]"
            style={{ gap: TP_STOP_CARD_GAP, ...OPEN_SANS }}
          >
            {stops.map((s, i) => {
              const fav = rail.has(s.slug, s.kind);
              const orderLabel =
                i === 0
                  ? (textos.itinerary_slot_start_label ?? 'Start')
                  : `${textos.itinerary_slot_stop_word ?? 'Stop'} ${i}`;
              return (
                <TpStopCard
                  key={`${s.kind}:${s.slug}`}
                  image={s.image}
                  eyebrow={orderLabel}
                  title={s.title}
                  meta={`${s.distanceMi.toFixed(1)} mi · ${s.address}`}
                  openUntil={s.openUntil}
                  fav={fav}
                  onToggleFav={() => (fav ? rail.remove(s.slug, s.kind) : rail.add(s.slug, s.kind))}
                  onSelect={() => setSelected(s.slug)}
                  dimmed={Boolean(selected) && s.slug !== selected}
                  badge={
                    <span
                      className="absolute left-1.5 top-1.5 flex h-[20px] min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                      style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
                    >
                      {i === 0 ? '★' : i}
                    </span>
                  }
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
