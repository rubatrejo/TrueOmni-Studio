'use client';

import { type ReactNode } from 'react';

/**
 * Primitivas compartidas por los 6 module forms (DSS5).
 *
 * Estilo compacto consistente con el resto del editor signage. Si DSS5.5
 * necesita validación inline o tooltips ricos, se pueden migrar a las
 * primitivas Field/TextInput/Select que el kiosk usa en `_components/ui/`.
 */

const inputBase =
  'w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[11.5px] text-zinc-700 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300';

export function FieldStack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

export function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
      />
    </label>
  );
}

export function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isNaN(v)) return;
          let clamped = v;
          if (min !== undefined) clamped = Math.max(clamped, min);
          if (max !== undefined) clamped = Math.min(clamped, max);
          onChange(Math.round(clamped));
        }}
        className={inputBase}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputBase}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[11px] text-zinc-500">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
      />
      <span>{label}</span>
    </label>
  );
}
