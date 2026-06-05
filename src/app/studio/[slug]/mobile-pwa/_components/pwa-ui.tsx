'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Primitivas de UI del editor PWA, alineadas visualmente con el editor del
 * kiosk (tema zinc, mismos radios/typos). Mantenerlas aquí evita acoplar los
 * Field internos del kiosk y deja el editor PWA con una sola fuente propia.
 */

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
          En construcción
        </span>
        <p className="max-w-xs text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          Este editor llega en la siguiente iteración de la Fase 1. Por ahora el branding y el
          idioma ya se previsualizan en vivo a la derecha.
        </p>
      </div>
    </div>
  );
}
