'use client';

import { useMemo, useState } from 'react';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaTripPlannerModuleConfig } from '@/lib/config';
import type { UseItineraryRailResult } from '@/lib/itinerary-favorites';
import { smartRouteOrder } from '@/lib/itinerary-smart-route';

import { SearchIcon } from '../dashboard-icons';
import { Layer } from '../mobile-layer';

import type { TpCard } from './types';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;
const STOP_MINUTES = 60; // duración mock por stop

function fmtTime(totalMin: number): string {
  const base = 8 * 60; // 8:00 AM
  const t = base + totalMin;
  let h = Math.floor(t / 60) % 24;
  const m = t % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

function fmtDuration(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}hr ${m}m`;
}

export function TpMyPlan({
  tp,
  textos,
  stops,
  rail,
  onBack,
  onStartPlan,
}: {
  tp: PwaTripPlannerModuleConfig;
  textos: Record<string, string>;
  stops: TpCard[];
  rail: UseItineraryRailResult;
  onBack: () => void;
  onStartPlan: () => void;
}) {
  const [optimalNote, setOptimalNote] = useState(false);
  const coordByKey = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number }>();
    stops.forEach((s) => m.set(`${s.kind}:${s.slug}`, s.coords));
    return m;
  }, [stops]);

  const totalMin = stops.length * STOP_MINUTES;
  const distanceTemplate = textos.itinerary_distance_away ?? '{n} mi away';

  const onSmartRoute = () => {
    const target = smartRouteOrder(rail.stops, (e) => coordByKey.get(`${e.kind}:${e.slug}`));
    if (!target) {
      setOptimalNote(true);
      setTimeout(() => setOptimalNote(false), 2200);
      return;
    }
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
      {/* Header (back propio → vuelve a LIST) */}
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
          {tp.myPlan.title}
        </div>
        <div className="absolute text-white" style={{ right: 18, top: 48 }}>
          <SearchIcon size={20} />
        </div>
      </Layer>

      {/* Barra MY PLAN + reset + duración */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={OPEN_SANS}>
        <span
          className="flex items-center gap-2 rounded-full py-1.5 pl-3 pr-1.5 text-white"
          style={{ backgroundColor: 'hsl(var(--brand-tertiary))' }}
        >
          <span className="text-[12px] font-bold">{tp.myPlan.myPlanLabel}</span>
          <span
            className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 text-[11px] font-bold"
            style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
          >
            {rail.count}
          </span>
        </span>
        <button
          type="button"
          aria-label="Clear"
          onClick={() => rail.clear()}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full border"
          style={{ borderColor: 'hsl(var(--foreground)/0.25)' }}
        >
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"
              stroke="hsl(var(--brand-primary))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span
          className="ml-auto flex items-center gap-2 rounded-full px-3 py-1.5 text-white"
          style={{ backgroundColor: 'hsl(var(--brand-tertiary))' }}
        >
          <svg width={18} height={14} viewBox="0 0 24 18" fill="white" aria-hidden>
            <path d="M3 10l1.5-4.5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.5L21 10v6h-2v-2H5v2H3v-6zm3.2-1h11.6l-.9-3H7.1l-.9 3z" />
          </svg>
          <span className="text-[12px] font-bold">{fmtDuration(totalMin)}</span>
        </span>
      </div>

      <p className="px-4 pb-1 text-[11px] leading-snug text-foreground/60" style={OPEN_SANS}>
        {tp.myPlan.intro}
      </p>

      {/* Stops */}
      <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3 pt-1">
        {stops.map((s, i) => (
          <div
            key={`${s.kind}:${s.slug}`}
            className="overflow-hidden rounded-[10px] border"
            style={{ borderColor: 'hsl(var(--brand-secondary)/0.4)', ...OPEN_SANS }}
          >
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{ backgroundColor: 'hsl(var(--brand-secondary)/0.12)' }}
            >
              <span
                className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[12px] font-bold text-white"
                style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
              >
                {i + 1}
              </span>
              <span className="flex-1 truncate text-[14px] font-bold text-foreground">
                {s.title}
              </span>
              <button type="button" aria-label="Remove" onClick={() => rail.remove(s.slug, s.kind)}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"
                    stroke="hsl(var(--brand-primary))"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div
              className="relative h-[88px] w-full bg-cover bg-center"
              style={{ backgroundImage: `url("${resolveAssetUrl(s.image)}")` }}
            />
            <div className="flex items-stretch">
              <div className="flex-1 px-3 py-2">
                <p className="text-[11px] text-foreground/70">
                  {distanceTemplate.replace('{n}', s.distanceMi.toFixed(1))} · {s.address}
                </p>
                {s.openUntil ? (
                  <p
                    className="text-[11px] font-semibold"
                    style={{ color: 'hsl(var(--brand-tertiary))' }}
                  >
                    {s.openUntil}
                  </p>
                ) : null}
              </div>
              <div
                className="w-[120px] shrink-0 border-l px-3 py-2 text-[9px]"
                style={{ borderColor: 'hsl(var(--foreground)/0.1)' }}
              >
                <p className="font-bold text-foreground/50">{tp.myPlan.startTimeLabel}</p>
                <p className="mb-1 text-foreground">{fmtTime(i * STOP_MINUTES)}</p>
                <p className="font-bold text-foreground/50">{tp.myPlan.endTimeLabel}</p>
                <p className="text-foreground">{fmtTime((i + 1) * STOP_MINUTES)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botones */}
      <div className="flex shrink-0 gap-3 px-4 py-3" style={OPEN_SANS}>
        <button
          type="button"
          onClick={onSmartRoute}
          className="flex-1 rounded-full border-2 py-2.5 text-[13px] font-bold uppercase"
          style={{
            borderColor: 'hsl(var(--brand-secondary))',
            color: 'hsl(var(--brand-secondary))',
          }}
        >
          {tp.myPlan.smartRoute}
        </button>
        <button
          type="button"
          onClick={onStartPlan}
          className="flex-1 rounded-full py-2.5 text-[13px] font-bold uppercase text-white"
          style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
        >
          {tp.myPlan.startPlan}
        </button>
      </div>

      {optimalNote && (
        <div
          className="pointer-events-none absolute inset-x-6 bottom-20 rounded-[10px] bg-black/80 px-4 py-3 text-center text-[12px] font-semibold text-white"
          style={OPEN_SANS}
        >
          {textos.itinerary_smart_route_optimal_body ??
            'Your stops are already in the most efficient order.'}
        </div>
      )}
    </div>
  );
}
