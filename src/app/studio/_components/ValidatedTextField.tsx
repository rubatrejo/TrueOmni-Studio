'use client';

import { type InputHTMLAttributes, type ReactNode } from 'react';
import type { ZodSchema } from 'zod';

import { useFieldValidation } from '../_lib/use-field-validation';

/**
 * Input de texto con validación inline (audit F-06).
 *
 * Convención del Studio: validate on blur + error inline (red-500 border +
 * texto explicativo). Use con cualquier `ZodSchema<string>`.
 *
 * Para inputs controlados desde el padre (lo más común en los editors), pasar
 * `value` + `onChange`. El estado `touched` y la validación son internos —
 * solo se exponen el `value` y el callback al padre.
 *
 * Para flows con submit (modales: NewClientModal, AddLanguageModal), exponer
 * el `<ValidatedTextField>` con `ref` y leer `isValid` desde fuera está fuera
 * de scope — usar `useFieldValidation` directamente en esos casos.
 */
export function ValidatedTextField({
  label,
  hint,
  schema,
  value,
  onChange,
  required = false,
  rightSlot,
  className = '',
  ...inputProps
}: {
  label?: string;
  hint?: string;
  schema: ZodSchema<string>;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  /** Adorno opcional a la derecha del input (icono, swatch…). */
  rightSlot?: ReactNode;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const field = useFieldValidation(value, schema);
  // Mantener el value externo en sync con el interno (este componente es
  // controlado por el padre, pero `useFieldValidation` mantiene su propio
  // valor para el cálculo de `touched` y validación reactiva).
  if (field.value !== value) field.setValue(value);

  const showError = field.touched && !field.isValid;
  const id = inputProps.id ?? inputProps.name;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label ? (
        <label
          htmlFor={id}
          className="text-[11px] font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
        >
          {label}
          {required ? <span className="ml-0.5 text-red-500">*</span> : null}
        </label>
      ) : null}
      <div className="flex items-center gap-2">
        <input
          {...inputProps}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            field.onBlur(e);
            inputProps.onBlur?.(e);
          }}
          aria-invalid={showError}
          aria-describedby={showError && id ? `${id}-error` : hint && id ? `${id}-hint` : undefined}
          className={
            'flex-1 rounded-md border bg-white px-2.5 py-1.5 text-[13px] text-zinc-900 outline-none transition placeholder:text-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600 ' +
            (showError
              ? 'border-red-500 ring-1 ring-red-500/30 focus:border-red-500 focus:ring-red-500/40'
              : 'border-zinc-200 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800')
          }
        />
        {rightSlot}
      </div>
      {showError ? (
        <p
          id={id ? `${id}-error` : undefined}
          role="alert"
          className="text-[11px] text-red-600 dark:text-red-400"
        >
          {field.error}
        </p>
      ) : hint ? (
        <p id={id ? `${id}-hint` : undefined} className="text-[11px] text-zinc-500 dark:text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
