'use client';

import { Check, ChevronDown, GripVertical } from 'lucide-react';
import { useMemo } from 'react';

import {
  BILLBOARD_LOGO_SIZES,
  BILLBOARD_VARIANTS,
  type BillboardConfig,
  type BillboardLogoSize,
  type BillboardVariant,
  type ModuleEntry,
} from '@/lib/studio/schema';

import { BILLBOARD_WIREFRAMES } from './billboard-wireframes';

const VARIANT_INFO: Record<BillboardVariant, { name: string; tagline: string }> = {
  0: { name: 'Variant 1', tagline: 'Hero photo + center logo' },
  1: { name: 'Variant 2', tagline: 'Grid + clock & weather' },
  2: { name: 'Variant 3', tagline: 'Hero + 3-up carousel' },
  3: { name: 'Variant 4', tagline: '2 cards + center banner + 2 cards' },
};

const LOGO_SIZE_INFO: Record<BillboardLogoSize, { label: string; px: string }> = {
  S: { label: 'Small', px: '80px' },
  M: { label: 'Medium', px: '128px' },
  L: { label: 'Large', px: '180px' },
};

/** Cuántos slots de módulos pinta cada variant (B0 = 0, no tiene grid). */
const VARIANT_SLOTS: Record<BillboardVariant, number> = {
  0: 0,
  1: 4,
  2: 4,
  3: 4,
};

/** Variants que muestran logo idle grande editable. B1 no aplica. */
const VARIANT_HAS_LOGO: Record<BillboardVariant, boolean> = {
  0: true,
  1: false,
  2: true,
  3: true,
};

export function BillboardEditor({
  billboard,
  onChange,
  modulesAvailable,
  onBillboardPreview,
}: {
  billboard: BillboardConfig;
  onChange: (next: BillboardConfig) => void;
  /**
   * Lista de módulos activos en el Modules tab (filtrados por `enabled` y
   * excluyendo `wayfinding`). El Billboard solo puede usar módulos que ya
   * existen en el kiosk.
   */
  modulesAvailable: readonly ModuleEntry[];
  /** Audit F-23: al elegir un variant nuevo, también disparamos el preview
   *  del idle en el iframe para que el operador vea el cambio sin clic extra. */
  onBillboardPreview?: () => void;
}) {
  const slots = VARIANT_SLOTS[billboard.variant];
  const hasLogo = VARIANT_HAS_LOGO[billboard.variant];
  const notEnoughModules = slots > 0 && modulesAvailable.length < slots;

  // Slots actuales: paddear a `slots` con strings vacíos para que el render
  // siempre pinte exactamente N slots, aunque billboard.modules tenga menos.
  const slotValues = useMemo(() => {
    const arr = [...billboard.modules.slice(0, slots)];
    while (arr.length < slots) arr.push('');
    return arr;
  }, [billboard.modules, slots]);

  const setSlot = (index: number, key: string) => {
    const next = [...slotValues];
    next[index] = key;
    // Limpiar trailing empty al guardar para no contaminar el config publicado.
    const cleaned = next.filter((v, i) => v !== '' || i < next.length - trailingEmpty(next));
    onChange({ ...billboard, modules: cleaned });
  };

  const moveSlot = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slots) return;
    const next = [...slotValues];
    const tmp = next[index]!;
    next[index] = next[target]!;
    next[target] = tmp;
    onChange({ ...billboard, modules: next });
  };

  return (
    <div className="space-y-7">
      {/* ───────────── Idle layout (wireframes) ───────────── */}
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
            const Wireframe = BILLBOARD_WIREFRAMES[v];
            const active = billboard.variant === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => {
                  onChange({ ...billboard, variant: v });
                  onBillboardPreview?.();
                }}
                className={
                  'group relative overflow-hidden rounded-lg border p-2.5 text-left transition ' +
                  (active
                    ? 'border-sky-500/60 bg-sky-500/5 ring-2 ring-sky-500/30 dark:border-sky-400/60 dark:bg-sky-500/10'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700')
                }
              >
                <div className="mb-2 flex aspect-[9/16] w-full items-center justify-center overflow-hidden rounded-md bg-zinc-50 p-2 dark:bg-zinc-950/40">
                  <Wireframe />
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

      {/* ───────────── Logo size (B0/B2/B3) ───────────── */}
      {hasLogo && (
        <section>
          <header className="mb-3">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Logo size
            </h3>
            <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
              Height of the idle logo on the Billboard.
            </p>
          </header>

          <div
            role="radiogroup"
            aria-label="Logo size"
            className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            {BILLBOARD_LOGO_SIZES.map((size) => {
              const info = LOGO_SIZE_INFO[size];
              const active = billboard.logoSize === size;
              return (
                <button
                  key={size}
                  role="radio"
                  aria-checked={active}
                  type="button"
                  onClick={() => onChange({ ...billboard, logoSize: size })}
                  className={
                    'flex flex-col items-center rounded-md px-3.5 py-1.5 text-[11.5px] transition ' +
                    (active
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40')
                  }
                >
                  <span className="font-semibold">{info.label}</span>
                  <span
                    className={
                      'mt-0.5 font-mono text-[9.5px] ' +
                      (active ? 'text-white/70' : 'text-zinc-400 dark:text-zinc-500')
                    }
                  >
                    {info.px}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ───────────── Modules in this layout (B1/B2/B3) ───────────── */}
      {slots > 0 && (
        <section>
          <header className="mb-3">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Modules in this layout
            </h3>
            <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
              {slots} slots — pick which active modules show on the Billboard, in order.
            </p>
          </header>

          {notEnoughModules && (
            <p className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11.5px] text-amber-600 dark:text-amber-400">
              Activate at least {slots} modules in the Modules tab to fill all slots of this
              billboard.
            </p>
          )}

          <ol className="space-y-1.5">
            {slotValues.map((value, index) => (
              <li
                key={index}
                className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white py-1 pl-1 pr-2 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveSlot(index, -1)}
                    disabled={index === 0}
                    aria-label="Move slot up"
                    className="grid h-3 w-5 place-items-center rounded text-zinc-400 transition hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
                  >
                    <GripVertical className="h-2.5 w-2.5 rotate-90" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlot(index, 1)}
                    disabled={index === slots - 1}
                    aria-label="Move slot down"
                    className="grid h-3 w-5 place-items-center rounded text-zinc-400 transition hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
                  >
                    <GripVertical className="h-2.5 w-2.5 -rotate-90" />
                  </button>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="relative flex-1">
                  <select
                    value={value}
                    onChange={(e) => setSlot(index, e.target.value)}
                    className="w-full appearance-none rounded-md bg-transparent py-1 pl-1.5 pr-6 text-[12px] text-zinc-800 outline-none focus:ring-2 focus:ring-sky-500/40 dark:text-zinc-200"
                    aria-label={`Slot ${index + 1} module`}
                  >
                    <option value="">— Empty —</option>
                    {modulesAvailable.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label.replace(/\n/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400"
                    aria-hidden
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ───────────── Inactivity timeout (sin cambios) ───────────── */}
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
            onChange={(e) => onChange({ ...billboard, idleTimeoutSec: Number(e.target.value) })}
            className="flex-1 accent-sky-500"
            aria-label="Idle timeout seconds"
          />
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-[11.5px] dark:border-zinc-800 dark:bg-zinc-950">
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

/** Cuenta cuántos strings vacíos hay al final del array. */
function trailingEmpty(arr: readonly string[]): number {
  let n = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === '') n++;
    else break;
  }
  return n;
}
