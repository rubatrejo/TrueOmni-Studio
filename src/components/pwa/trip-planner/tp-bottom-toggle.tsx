'use client';

import type { PwaTripPlannerModuleConfig } from '@/lib/config';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/** Barra LIST / AI / MAP. El AI es un botón circular blanco elevado al centro. */
export function TpBottomToggle({
  tp,
  active,
  onList,
  onAi,
  onMap,
}: {
  tp: PwaTripPlannerModuleConfig;
  active: 'list' | 'map';
  onList: () => void;
  onAi: () => void;
  onMap: () => void;
}) {
  return (
    <div
      className="relative z-20 flex shrink-0 items-stretch"
      style={{ height: 52, backgroundColor: 'hsl(var(--brand-secondary))', ...OPEN_SANS }}
    >
      {/* LIST */}
      <button
        type="button"
        onClick={onList}
        className="flex flex-1 items-center justify-center gap-2 text-white"
        style={{ opacity: active === 'list' ? 1 : 0.75 }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[14px] font-bold">{tp.toggle.list}</span>
      </button>

      {/* MAP */}
      <button
        type="button"
        onClick={onMap}
        className="flex flex-1 items-center justify-center gap-2 text-white"
        style={{ opacity: active === 'map' ? 1 : 0.75 }}
      >
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[14px] font-bold">{tp.toggle.map}</span>
      </button>

      {/* AI central elevado */}
      <button
        type="button"
        onClick={onAi}
        aria-label={tp.toggle.ai}
        className="absolute left-1/2 top-0 flex h-[64px] w-[64px] -translate-x-1/2 -translate-y-[22px] items-center justify-center rounded-full bg-white shadow-lg"
      >
        <span
          className="text-[20px] font-extrabold"
          style={{ color: 'hsl(var(--brand-secondary))' }}
        >
          {tp.toggle.ai}
        </span>
      </button>
    </div>
  );
}
