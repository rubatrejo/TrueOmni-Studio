'use client';

import type { ReactNode } from 'react';

import { ImageUrlField } from './ImageUrlField';
import { LatLngField } from './LatLngField';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Field config                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

export type FieldConfig<T> =
  | {
      kind: 'text';
      key: keyof T & string;
      label: string;
      placeholder?: string;
      helpText?: string;
    }
  | {
      kind: 'textarea';
      key: keyof T & string;
      label: string;
      rows?: number;
      helpText?: string;
    }
  | {
      kind: 'number';
      key: keyof T & string;
      label: string;
      min?: number;
      max?: number;
      step?: number;
      helpText?: string;
    }
  | {
      kind: 'image';
      key: keyof T & string;
      label: string;
      helpText?: string;
    }
  | {
      kind: 'latlng';
      /** Único caso donde el key es virtual — el valor lee de `coords`. */
      key: 'coords' & keyof T;
      label?: string;
    }
  | {
      kind: 'select';
      key: keyof T & string;
      label: string;
      options: { value: string; label: string }[];
      helpText?: string;
    }
  | {
      kind: 'taxonomy-pick';
      key: keyof T & string;
      label: string;
      options: string[];
      multiple?: boolean;
      helpText?: string;
    }
  | {
      kind: 'checkbox';
      key: keyof T & string;
      label: string;
      helpText?: string;
    };

interface CatalogItemFormProps<T> {
  item: T;
  fields: FieldConfig<T>[];
  onChange: (patch: Partial<T>) => void;
  /** Slot extra para renderizar UI custom debajo del último field. */
  footer?: ReactNode;
}

/**
 * Form genérico para un item de catálogo. Renderiza inputs según `kind`:
 *   text · textarea · number · image · latlng · select · taxonomy-pick · checkbox.
 * Cualquier campo no cubierto se debe renderizar fuera del form como custom UI.
 */
export function CatalogItemForm<T>({ item, fields, onChange, footer }: CatalogItemFormProps<T>) {
  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <FieldRenderer key={field.key} field={field} item={item} onChange={onChange} />
      ))}
      {footer}
    </div>
  );
}

function FieldRenderer<T>({
  field,
  item,
  onChange,
}: {
  field: FieldConfig<T>;
  item: T;
  onChange: (patch: Partial<T>) => void;
}) {
  // En todos los kinds usamos un cast controlado: el caller garantiza que
  // `item[field.key]` matches el tipo esperado por `kind`.
  const raw = (item as Record<string, unknown>)[field.key];

  switch (field.kind) {
    case 'text': {
      const value = (raw as string | undefined) ?? '';
      return (
        <Labeled label={field.label} helpText={field.helpText}>
          <input
            type="text"
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => onChange({ [field.key]: e.target.value } as Partial<T>)}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-[12px] text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500/60 focus:outline-none"
          />
        </Labeled>
      );
    }

    case 'textarea': {
      const value = (raw as string | undefined) ?? '';
      return (
        <Labeled label={field.label} helpText={field.helpText}>
          <textarea
            value={value}
            rows={field.rows ?? 3}
            onChange={(e) => onChange({ [field.key]: e.target.value } as Partial<T>)}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-[12px] text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500/60 focus:outline-none"
          />
        </Labeled>
      );
    }

    case 'number': {
      const value = typeof raw === 'number' ? raw : 0;
      return (
        <Labeled label={field.label} helpText={field.helpText}>
          <input
            type="number"
            value={value}
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            onChange={(e) => {
              const next = parseFloat(e.target.value);
              onChange({ [field.key]: Number.isFinite(next) ? next : 0 } as Partial<T>);
            }}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-[12px] text-zinc-100 focus:border-sky-500/60 focus:outline-none"
          />
        </Labeled>
      );
    }

    case 'image': {
      const value = (raw as string | undefined) ?? '';
      return (
        <ImageUrlField
          label={field.label}
          value={value}
          onChange={(next) => onChange({ [field.key]: next ?? '' } as Partial<T>)}
          helpText={field.helpText}
        />
      );
    }

    case 'latlng': {
      const coords =
        raw && typeof raw === 'object'
          ? (raw as { lat: number; lng: number })
          : { lat: 0, lng: 0 };
      return (
        <LatLngField
          label={field.label}
          value={coords}
          onChange={(next) => onChange({ [field.key]: next } as Partial<T>)}
        />
      );
    }

    case 'select': {
      const value = (raw as string | undefined) ?? '';
      return (
        <Labeled label={field.label} helpText={field.helpText}>
          <select
            value={value}
            onChange={(e) => onChange({ [field.key]: e.target.value } as Partial<T>)}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-[12px] text-zinc-100 focus:border-sky-500/60 focus:outline-none"
          >
            <option value="">—</option>
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Labeled>
      );
    }

    case 'taxonomy-pick': {
      if (field.multiple) {
        const selected = Array.isArray(raw) ? (raw as string[]) : [];
        return (
          <Labeled label={field.label} helpText={field.helpText}>
            <div className="flex flex-wrap gap-1.5">
              {field.options.length === 0 ? (
                <p className="text-[11px] italic text-zinc-500">
                  No options yet — define them in the taxonomy editor above.
                </p>
              ) : (
                field.options.map((opt) => {
                  const active = selected.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? selected.filter((s) => s !== opt)
                          : [...selected, opt];
                        onChange({ [field.key]: next } as Partial<T>);
                      }}
                      className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                        active
                          ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                          : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })
              )}
            </div>
          </Labeled>
        );
      }
      const value = (raw as string | undefined) ?? '';
      return (
        <Labeled label={field.label} helpText={field.helpText}>
          <select
            value={value}
            onChange={(e) => onChange({ [field.key]: e.target.value } as Partial<T>)}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-[12px] text-zinc-100 focus:border-sky-500/60 focus:outline-none"
          >
            <option value="">—</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Labeled>
      );
    }

    case 'checkbox': {
      const value = Boolean(raw);
      return (
        <label className="flex items-center gap-2 text-[12px] text-zinc-200">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange({ [field.key]: e.target.checked } as Partial<T>)}
            className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-sky-500 focus:ring-sky-500/40"
          />
          <span>{field.label}</span>
          {field.helpText ? (
            <span className="text-[11px] text-zinc-500">— {field.helpText}</span>
          ) : null}
        </label>
      );
    }
  }
}

function Labeled({
  label,
  helpText,
  children,
}: {
  label: string;
  helpText?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[12px] font-medium text-zinc-300">{label}</label>
      {children}
      {helpText ? <p className="text-[11px] text-zinc-500">{helpText}</p> : null}
    </div>
  );
}
