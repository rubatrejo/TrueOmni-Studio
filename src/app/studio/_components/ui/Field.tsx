'use client';

/**
 * Primitives unificados de formulario para editores del Studio.
 *
 * Hallazgo #15 / Tema B.2 del audit panorámico (2026-05-05):
 * habían 3 patrones distintos de form field y 2 color pickers
 * dispersos por los 21 editores. Migración progresiva — los
 * editores se reescriben uno por uno; mientras tanto coexisten
 * estilos heredados.
 *
 * Reglas:
 *  - Focus ring sky-500 (neutral del Studio, no se mezcla con la
 *    brand color del kiosk activo).
 *  - Dark mode: zinc-900/40 + zinc-100 text + zinc-800 border.
 *  - Tipografía 12px (mantiene la densidad visual del Studio).
 *  - Variantes de tamaño: sm (default 12px) y md (13.5px) — `md`
 *    para campos hero / settings principales.
 */

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Field wrapper                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

interface FieldProps {
  label: string;
  /** Texto secundario debajo del control (no del label). */
  helpText?: string;
  /** Mensaje de error (rojo, prevalece sobre helpText cuando está set). */
  error?: string;
  /** Children = el control (TextInput, Select, ColorPicker, etc.). */
  children: ReactNode;
  /** Adornos a la derecha del label (eg. botón "AI suggest"). */
  labelAside?: ReactNode;
  /** Forzar id sobre el control para a11y (usar cuando hace sentido). */
  htmlFor?: string;
  /** Apila los hijos sin gap (cuando el control trae su propio padding/border). */
  flush?: boolean;
}

export function Field({
  label,
  helpText,
  error,
  children,
  labelAside,
  htmlFor,
  flush = false,
}: FieldProps) {
  return (
    <div className={flush ? 'space-y-1' : 'block space-y-1'}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
        {labelAside ? <span className="flex items-center gap-1">{labelAside}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>
      ) : helpText ? (
        <p className="text-[11px] leading-snug text-zinc-500">{helpText}</p>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Inputs                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

const INPUT_BASE =
  'w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-600';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  invalid?: boolean;
  className?: string;
};

export function TextInput({ invalid, className = '', ...rest }: InputProps) {
  return (
    <input
      type="text"
      className={`${INPUT_BASE} ${invalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''} ${className}`}
      {...rest}
    />
  );
}

export function NumberInput({ invalid, className = '', ...rest }: InputProps) {
  return (
    <input
      type="number"
      className={`${INPUT_BASE} ${invalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''} ${className}`}
      {...rest}
    />
  );
}

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & {
  invalid?: boolean;
  className?: string;
  /** mono = font-mono (para JSON, code) */
  mono?: boolean;
};

export function Textarea({
  invalid,
  className = '',
  mono = false,
  rows = 3,
  ...rest
}: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={`${INPUT_BASE} ${mono ? 'font-mono text-[11px]' : ''} ${invalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''} ${className}`}
      {...rest}
    />
  );
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
  className?: string;
};

export function Select({ className = '', children, ...rest }: SelectProps) {
  return (
    <select
      className={`${INPUT_BASE} appearance-none bg-[length:14px_14px] bg-[right_0.5rem_center] bg-no-repeat pr-7 ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%2371717a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Checkbox                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  helpText?: string;
  disabled?: boolean;
}

export function Checkbox({ label, checked, onChange, helpText, disabled }: CheckboxProps) {
  const id = useId();
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 bg-white text-sky-500 focus:ring-2 focus:ring-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <label htmlFor={id} className="flex-1 cursor-pointer">
        <span className="block text-[12px] text-zinc-700 dark:text-zinc-200">{label}</span>
        {helpText ? (
          <span className="block text-[11px] text-zinc-500">{helpText}</span>
        ) : null}
      </label>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  ColorPicker                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

interface ColorPickerProps {
  value: string;
  onChange: (next: string) => void;
  /** Permite alpha 8-digit (`#RRGGBBAA`). Default: false (solo 6-digit). */
  allowAlpha?: boolean;
  /** Texto del botón de reset (presencia ⇒ se muestra). */
  resetTo?: string;
  placeholder?: string;
  disabled?: boolean;
}

const HEX6 = /^#([0-9a-fA-F]{6})$/;
const HEX8 = /^#([0-9a-fA-F]{8})$/;

/**
 * Color picker unificado:
 *  - Swatch grande con `<input type="color">` overlay invisible (clic en el
 *    swatch abre el picker nativo).
 *  - Hex text editable a la derecha.
 *  - Soporta `#RRGGBB` (default) o `#RRGGBBAA` (con alpha) según prop.
 *  - Sanitiza input: 8-digit alpha collapsa a 6-digit para el `<input type="color">`,
 *    pero se preserva en el state si `allowAlpha`.
 */
export function ColorPicker({
  value,
  onChange,
  allowAlpha = false,
  resetTo,
  placeholder = '#000000',
  disabled,
}: ColorPickerProps) {
  // El <input type="color"> solo acepta 6-digit hex; si nos llega 8-digit
  // (alpha), tomamos los primeros 6 para el swatch.
  const sixDigit = HEX8.test(value) ? value.slice(0, 7) : HEX6.test(value) ? value : '#000000';

  const handleHexChange = (raw: string) => {
    const v = raw.trim();
    if (v === '') {
      onChange('');
      return;
    }
    if (allowAlpha ? HEX6.test(v) || HEX8.test(v) : HEX6.test(v)) {
      onChange(v);
    } else {
      // Permite escribir parcialmente — el commit final pasa por el regex.
      onChange(v);
    }
  };

  const isInvalid =
    value.length > 0 && !(HEX6.test(value) || (allowAlpha && HEX8.test(value)));

  return (
    <div className="flex items-center gap-2">
      <span
        className="relative inline-flex h-8 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-zinc-200 dark:border-zinc-700"
        style={{ background: sixDigit }}
        aria-hidden="true"
      >
        <input
          type="color"
          value={sixDigit}
          onChange={(e) => {
            // Si tenemos alpha en el state previo, conservamos los 2 chars
            // finales para no perderla al usar el picker nativo.
            if (allowAlpha && HEX8.test(value)) {
              onChange(`${e.target.value}${value.slice(7)}`);
            } else {
              onChange(e.target.value);
            }
          }}
          disabled={disabled}
          aria-label="Color picker"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => handleHexChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        disabled={disabled}
        className={`flex-1 rounded-md border bg-white px-2 py-1 font-mono text-[11px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 ${
          isInvalid
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-zinc-200 focus:border-sky-500/60 focus:ring-sky-500/20 dark:border-zinc-700'
        }`}
      />
      {resetTo && value !== resetTo ? (
        <button
          type="button"
          onClick={() => onChange(resetTo)}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300 dark:hover:bg-zinc-900"
          title={`Reset to ${resetTo}`}
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}
