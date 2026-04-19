import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Helper de shadcn/ui: combina clases condicionalmente y resuelve conflictos
 * de Tailwind (p. ej. `px-2 px-4` → `px-4`). Exportado como `cn`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
