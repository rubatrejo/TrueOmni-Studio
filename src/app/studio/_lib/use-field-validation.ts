'use client';

import { useCallback, useState, type ChangeEvent, type FocusEvent } from 'react';
import { z, type ZodSchema } from 'zod';

/**
 * Hook reusable para validación de inputs (audit F-06).
 *
 * Convención global del Studio:
 *   - Validate on **blur** (no on change — eso interrumpe al operador).
 *   - Mostrar error inline (red-500 border + texto explicativo).
 *   - Nunca silenciar — si la edición es inválida, el operador debe verlo
 *     antes de pulsar Save.
 *
 * Uso:
 *   const slugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Use lowercase + dashes only');
 *   const slug = useFieldValidation('', slugSchema);
 *
 *   <input
 *     value={slug.value}
 *     onChange={slug.onChange}
 *     onBlur={slug.onBlur}
 *     aria-invalid={slug.touched && !slug.isValid}
 *     className={slug.touched && !slug.isValid ? 'border-red-500' : ''}
 *   />
 *   {slug.touched && slug.error ? <p className="text-red-500">{slug.error}</p> : null}
 *
 * El componente `<ValidatedTextField>` aplica este patrón con estilos por
 * defecto — preferir ese para inputs nuevos.
 */
export function useFieldValidation<T = string>(
  initial: T,
  schema: ZodSchema<T>,
  options?: { reset?: T },
) {
  const [value, setValue] = useState<T>(initial);
  const [touched, setTouched] = useState(false);

  const result = schema.safeParse(value);
  const isValid = result.success;
  const error = result.success ? null : (result.error.issues[0]?.message ?? 'Invalid');

  const onChange = useCallback((next: T | ChangeEvent<HTMLInputElement>) => {
    if (typeof next === 'object' && next !== null && 'target' in next) {
      setValue((next.target as HTMLInputElement).value as unknown as T);
    } else {
      setValue(next as T);
    }
  }, []);

  const onBlur = useCallback((_e?: FocusEvent<HTMLInputElement>) => {
    setTouched(true);
  }, []);

  const reset = useCallback(() => {
    setValue(options?.reset ?? initial);
    setTouched(false);
  }, [initial, options?.reset]);

  return {
    value,
    setValue,
    touched,
    isValid,
    error,
    onChange,
    onBlur,
    reset,
    /** Marca el campo como tocado sin esperar al blur (útil al pulsar Submit). */
    touch: () => setTouched(true),
  };
}

/** Schemas comunes reutilizables — extender según el editor lo necesite. */
export const fieldSchemas = {
  /** Slug para clientes/módulos — kebab-case. */
  slug: z
    .string()
    .min(2, 'At least 2 characters')
    .max(40, 'At most 40 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes'),
  /** Hex color con o sin #, 3 o 6 dígitos. */
  hexColor: z
    .string()
    .regex(/^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/, 'Use 3 or 6 hex digits (e.g. #1f8ad9)'),
  /** URL absoluta. */
  url: z.string().url('Must be a valid URL (https://…)'),
  /** Email. */
  email: z.string().email('Must be a valid email'),
  /** Número entero positivo. */
  positiveInt: z.coerce.number().int('Must be a whole number').positive('Must be > 0'),
};
