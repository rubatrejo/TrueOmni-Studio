'use client';

import { Check } from 'lucide-react';

import {
  BILLBOARD_VARIANTS,
  type BillboardConfig,
  type BillboardVariant,
} from '@/lib/studio/schema';

const VARIANT_INFO: Record<
  BillboardVariant,
  { name: string; tagline: string; gradient: string }
> = {
  0: {
    name: 'Variant 1',
    tagline: 'Hero photo + center logo',
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #1796d6 60%, #b4bd01 100%)',
  },
  1: {
    name: 'Variant 2',
    tagline: 'Split screen + headline left',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #475569 100%)',
  },
  2: {
    name: 'Variant 3',
    tagline: 'Full-bleed video loop',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #14b8a6 100%)',
  },
  3: {
    name: 'Variant 4',
    tagline: 'Editorial / typographic',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #ec4899 100%)',
  },
};

export function BillboardEditor({
  billboard,
  onChange,
}: {
  billboard: BillboardConfig;
  onChange: (next: BillboardConfig) => void;
}) {
  return (
    <div className="space-y-7">
      <section>
        <header className="mb-3">
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Idle layout
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Pick which Billboard the kiosk shows when idle. Live preview updates instantly.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-2.5">
          {BILLBOARD_VARIANTS.map((v) => {
            const info = VARIANT_INFO[v];
            const active = billboard.variant === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ ...billboard, variant: v })}
                className={
                  'group relative overflow-hidden rounded-lg border p-2.5 text-left transition ' +
                  (active
                    ? 'border-sky-500/60 bg-sky-500/5 ring-2 ring-sky-500/30 dark:border-sky-400/60 dark:bg-sky-500/10'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700')
                }
              >
                <div
                  className="mb-2 flex aspect-[9/16] w-full items-end overflow-hidden rounded-md p-2"
                  style={{ background: info.gradient }}
                >
                  <span className="rounded-full bg-black/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white">
                    Touch here
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-200">
                      {info.name}
                    </div>
                    <div className="mt-0.5 truncate text-[10.5px] text-zinc-500">
                      {info.tagline}
                    </div>
                  </div>
                  {active && (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky-500 text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <header className="mb-3">
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Inactivity timeout
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Seconds without interaction before the kiosk shows the &ldquo;Are you still
            there?&rdquo; warning and returns to idle.
          </p>
        </header>

        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-900 dark:bg-zinc-900/40">
          <input
            type="range"
            min={15}
            max={300}
            step={5}
            value={billboard.idleTimeoutSec}
            onChange={(e) =>
              onChange({ ...billboard, idleTimeoutSec: Number(e.target.value) })
            }
            className="flex-1 accent-sky-500"
            aria-label="Idle timeout seconds"
          />
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11.5px] font-mono dark:border-zinc-800 dark:bg-zinc-950">
            <input
              type="number"
              min={15}
              max={600}
              value={billboard.idleTimeoutSec}
              onChange={(e) =>
                onChange({
                  ...billboard,
                  idleTimeoutSec: Math.max(15, Math.min(600, Number(e.target.value) || 15)),
                })
              }
              className="w-12 bg-transparent text-right outline-none"
            />
            <span className="text-zinc-500">s</span>
          </div>
        </div>
      </section>
    </div>
  );
}
