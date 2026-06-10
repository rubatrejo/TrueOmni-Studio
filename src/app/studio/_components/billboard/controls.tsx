'use client';

import type { BillboardConfig, BillboardVariant } from '@/lib/studio/schema';

import { ColorPicker } from '../ui';

/* ────────────────────────────────────────────────────────────────────────── */
/* Controles del BillboardEditor — F-QA-1: extraídos del monolito.            */
/* Sliders, color rows, y las secciones de posición de logo (idle + footer).  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * 9 presets de posición para el logo idle. Coords absolutas dentro del
 * canvas 1080×1920 que representan el top-left del slot (694 wide). El
 * operador puede afinar con los sliders después de elegir un anchor.
 */
const LOGO_POSITION_PRESETS = [
  { id: 'top-left', label: 'Top left', x: 60, y: 120 },
  { id: 'top-center', label: 'Top center', x: 193, y: 120 },
  { id: 'top-right', label: 'Top right', x: 326, y: 120 },
  { id: 'middle-left', label: 'Middle left', x: 60, y: 800 },
  { id: 'middle-center', label: 'Middle center', x: 193, y: 800 },
  { id: 'middle-right', label: 'Middle right', x: 326, y: 800 },
  { id: 'bottom-left', label: 'Bottom left', x: 60, y: 1500 },
  { id: 'bottom-center', label: 'Bottom center', x: 193, y: 1500 },
  { id: 'bottom-right', label: 'Bottom right', x: 326, y: 1500 },
] as const;

/** Posición histórica del logo por variant (matchea use-billboard-override). */
const DEFAULT_LOGO_POSITION_PER_VARIANT: Record<BillboardVariant, { x: number; y: number }> = {
  0: { x: 193, y: 371 },
  1: { x: 193, y: 60 },
  2: { x: 193, y: 120 },
  3: { x: 193, y: 720 },
};

export function SliderRow({
  label,
  min,
  max,
  step,
  unit,
  value,
  onChange,
  hint,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  value: number;
  onChange: (next: number) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
        <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sky-500"
        aria-label={label}
      />
      {hint ? <p className="text-[10.5px] text-zinc-500 dark:text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="space-y-1">
      <span className="block text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </span>
      <ColorPicker
        value={value}
        onChange={onChange}
        allowAlpha
        placeholder="#000000 or #000000FF"
      />
    </div>
  );
}

/** Cuenta cuántos strings vacíos hay al final del array. */
export function trailingEmpty(arr: readonly string[]): number {
  let n = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === '') n++;
    else break;
  }
  return n;
}

/**
 * Sección "Logo position" del editor. Permite al operador mover el logo
 * idle a 9 anchors predefinidos o ajustar con sliders X/Y. El "reset"
 * vuelve al default histórico de cada variant (posición del SVG original).
 *
 * Los anchors cubren combinaciones de top/middle/bottom × left/center/right,
 * útiles como inicio rápido. Después de un anchor, los sliders permiten
 * fine-tune en px (granularidad 5px). Las coords son top-left absolutas
 * dentro del canvas 1080×1920; el slot del logo es 694×logoH.
 */
export function LogoPositionSection({
  billboard,
  onChange,
}: {
  billboard: BillboardConfig;
  onChange: (next: BillboardConfig) => void;
}) {
  const defaultPos = DEFAULT_LOGO_POSITION_PER_VARIANT[billboard.variant];
  const pos = billboard.logoPosition ?? defaultPos;
  const isOverridden = billboard.logoPosition !== undefined;

  const setPos = (next: { x: number; y: number }) => {
    onChange({ ...billboard, logoPosition: next });
  };
  const reset = () => {
    onChange({ ...billboard, logoPosition: undefined });
  };

  // Detectar qué preset (si alguno) coincide con la posición actual.
  const activePresetId = LOGO_POSITION_PRESETS.find((p) => p.x === pos.x && p.y === pos.y)?.id;

  return (
    <section>
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Logo position
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Where the idle logo sits in the 1080×1920 canvas. Pick a corner or fine-tune with the
            sliders.
          </p>
        </div>
        {isOverridden && (
          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10.5px] font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Reset
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {/* 9-point anchor picker: grid 3×3. */}
        <div
          role="radiogroup"
          aria-label="Logo anchor"
          className="grid w-[140px] shrink-0 grid-cols-3 gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          {LOGO_POSITION_PRESETS.map((preset) => {
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                role="radio"
                aria-checked={active}
                aria-label={preset.label}
                title={`${preset.label} (${preset.x}, ${preset.y})`}
                type="button"
                onClick={() => setPos({ x: preset.x, y: preset.y })}
                className={`grid h-10 w-10 place-items-center rounded-md border text-[10px] transition ${
                  active
                    ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                    : 'border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-600 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                <span
                  aria-hidden
                  className={`block h-1.5 w-1.5 rounded-full ${active ? 'bg-white' : 'bg-current'}`}
                />
              </button>
            );
          })}
        </div>

        {/* Sliders X / Y para fine-tune. */}
        <div className="flex w-full min-w-0 flex-col gap-2">
          <LogoSliderRow
            label="X"
            min={0}
            max={1080}
            step={5}
            value={pos.x}
            onChange={(x) => setPos({ x, y: pos.y })}
          />
          <LogoSliderRow
            label="Y"
            min={0}
            max={1920}
            step={5}
            value={pos.y}
            onChange={(y) => setPos({ x: pos.x, y })}
          />
          <p className="mt-0.5 font-mono text-[10.5px] text-zinc-400 dark:text-zinc-600">
            x={pos.x}px · y={pos.y}px
            {!isOverridden && <span className="ml-1.5 italic">(default)</span>}
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Sección "Footer logo position" — mismo patrón que `LogoPositionSection`
 * pero opera sobre `billboard.footerLogoPosition` y solo aplica visualmente
 * al Variant 1 (B0). Default histórico: { x: 60, y: 1805 } (footer block
 * arranca en y=1702, logo a 103px dentro del block).
 */
const DEFAULT_FOOTER_LOGO_POS = { x: 60, y: 1805 };

export function FooterLogoPositionSection({
  billboard,
  onChange,
}: {
  billboard: BillboardConfig;
  onChange: (next: BillboardConfig) => void;
}) {
  const pos = billboard.footerLogoPosition ?? DEFAULT_FOOTER_LOGO_POS;
  const isOverridden = billboard.footerLogoPosition !== undefined;

  const setPos = (next: { x: number; y: number }) => {
    onChange({ ...billboard, footerLogoPosition: next });
  };
  const reset = () => {
    onChange({ ...billboard, footerLogoPosition: undefined });
  };

  return (
    <section>
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Footer logo position
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Where the &quot;Powered by&quot; logo sits in the footer of Variant 1. X/Y are absolute
            coords in the 1080×1920 canvas.
          </p>
        </div>
        {isOverridden && (
          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10.5px] font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Reset
          </button>
        )}
      </header>
      <div className="flex w-full min-w-0 flex-col gap-2">
        <LogoSliderRow
          label="X"
          min={0}
          max={1080}
          step={5}
          value={pos.x}
          onChange={(x) => setPos({ x, y: pos.y })}
        />
        <LogoSliderRow
          label="Y"
          min={1702}
          max={1900}
          step={2}
          value={pos.y}
          onChange={(y) => setPos({ x: pos.x, y })}
        />
        <p className="mt-0.5 font-mono text-[10.5px] text-zinc-400 dark:text-zinc-600">
          x={pos.x}px · y={pos.y}px
          {!isOverridden && <span className="ml-1.5 italic">(default)</span>}
        </p>
      </div>
    </section>
  );
}

/** Fila label + slider + input numérico — usada solo por LogoPositionSection. */
function LogoSliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
      <span className="w-3 shrink-0 font-mono font-semibold uppercase">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-sky-500 dark:bg-zinc-800"
        aria-label={label}
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!Number.isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
        className="w-14 shrink-0 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-right font-mono text-[11px] text-zinc-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
        aria-label={`${label} value in px`}
      />
    </label>
  );
}
