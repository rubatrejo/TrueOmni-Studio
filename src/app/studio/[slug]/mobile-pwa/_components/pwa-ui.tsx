'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Primitivas de UI del editor PWA, alineadas visualmente con el editor del
 * kiosk (tema zinc, mismos radios/typos). Mantenerlas aquí evita acoplar los
 * Field internos del kiosk y deja el editor PWA con una sola fuente propia.
 */

/**
 * Aviso sutil que aparece en la parte superior del panel cuando la sección
 * del editor no tiene preview reactivo (livePreview: false en pwa-sections.ts).
 * Informa al operador que los cambios se verán al guardar y recargar el preview,
 * para que no piense que el preview está roto.
 */
export function PwaNoLivePreviewBanner() {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-amber-200/70 bg-amber-50/60 px-6 py-2.5 dark:border-amber-800/40 dark:bg-amber-950/30">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 dark:bg-amber-500" />
      <p className="text-[11.5px] leading-snug text-amber-700 dark:text-amber-400">
        Vista previa · los cambios de esta sección se reflejan al guardar y recargar.
      </p>
    </div>
  );
}

export function PwaPanelHeader({ title, description }: { title: string; description: string }) {
  // Mismos tamaños que el header del EditorPanel del kiosk (px-6 py-5, text-xl).
  return (
    <header className="shrink-0 border-b border-zinc-200 px-6 py-5 dark:border-zinc-900">
      <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-500">
        {description}
      </p>
    </header>
  );
}

export function PwaGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      {title ? (
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {title}
        </h3>
      ) : null}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function PwaField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="block w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        />
      )}
    </label>
  );
}

export function PwaNumberField({
  label,
  value,
  onChange,
  min,
  step,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) ? n : 0);
          }}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        />
        {suffix ? (
          <span className="shrink-0 text-[12px] text-zinc-400 dark:text-zinc-500">{suffix}</span>
        ) : null}
      </div>
    </label>
  );
}

/**
 * Edita un array de strings (opciones / días) in-place, un `PwaField` por
 * elemento, sin añadir ni borrar (la longitud la fija el seed). Devuelve `null`
 * si el array está vacío.
 */
export function PwaOptionList({
  label,
  options,
  onChange,
}: {
  label: string;
  options: string[];
  onChange: (next: string[]) => void;
}) {
  if (options.length === 0) return null;
  return (
    <>
      {options.map((opt, i) => (
        <PwaField
          key={i}
          label={`${label} ${i + 1}`}
          value={opt}
          onChange={(next) => onChange(options.map((o, idx) => (idx === i ? next : o)))}
        />
      ))}
    </>
  );
}

/** Mueve un elemento de `from` a `to` (no muta el array original). */
export function move<T>(arr: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return [...arr];
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Botones subir/baja para reordenar items de una lista. */
export function ReorderButtons({
  index,
  count,
  onMove,
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
}) {
  return (
    <div className="flex shrink-0 flex-col">
      <button
        type="button"
        aria-label="Move up"
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        className="grid h-5 w-6 place-items-center rounded text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Move down"
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
        className="grid h-5 w-6 place-items-center rounded text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * Placeholder para secciones del editor PWA aún no implementadas (Fase 2).
 * Mantiene el chasis navegable sin prometer funcionalidad que no existe.
 */
export function PwaPlaceholderPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader title={title} description={description} />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
          Coming soon
        </span>
        <p className="max-w-xs text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          This editor ships in the next iteration of Phase 1. For now the branding and the language
          already preview live on the right.
        </p>
      </div>
    </div>
  );
}

// `XL` se conserva en el tipo por back-compat (configs guardados que ya lo traen
// no deben romper ni perder su valor), pero el editor ya no lo OFRECE como botón:
// el rango útil para el logo de la PWA mobile es XS→L. Ver `LOGO_SIZE_BUTTONS`.
export type PwaLogoSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

/** Tamaños ofrecidos en el editor (XS→M; L y XL quedan fuera por petición). */
const LOGO_SIZE_BUTTONS = ['XS', 'S', 'M'] as const;

/**
 * Controles del logo de una pantalla de la PWA: tamaño (XS/S/M/L, mismo look que
 * el selector del kiosk) + posición (move X/Y en px). Reutilizable en cualquier
 * editor PWA (Dashboard, Login…) para que el UI sea consistente.
 */
export function PwaLogoControls({
  size,
  offset,
  onSizeChange,
  onOffsetChange,
}: {
  size?: PwaLogoSize;
  offset?: { x: number; y: number };
  onSizeChange: (size: PwaLogoSize) => void;
  onOffsetChange: (offset: { x: number; y: number }) => void;
}) {
  const off = offset ?? { x: 0, y: 0 };
  return (
    <>
      <div>
        <span className="mb-1 block text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
          Logo size
        </span>
        <div
          role="radiogroup"
          aria-label="Logo size"
          className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          {LOGO_SIZE_BUTTONS.map((s) => {
            const active = (size ?? 'M') === s;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSizeChange(s)}
                className={
                  'rounded-md px-3.5 py-1 text-[11.5px] font-semibold transition ' +
                  (active
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40')
                }
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <PwaNumberField
          label="Move X"
          value={off.x}
          onChange={(x) => onOffsetChange({ x, y: off.y })}
          step={1}
          suffix="px"
        />
        <PwaNumberField
          label="Move Y"
          value={off.y}
          onChange={(y) => onOffsetChange({ x: off.x, y })}
          step={1}
          suffix="px"
        />
      </div>
    </>
  );
}
