'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline';

/**
 * CTA primario de la PWA (fuente única de verdad — B5 de la auditoría).
 *
 * Encapsula la tipografía/color base + el feedback de press (`active:`) que antes
 * faltaba en los ~9 botones inline. Es layout-agnóstico: el consumidor sigue
 * pasando posición (`absolute`, coords vía `style`), bordes (`rounded-*`) y tamaño
 * de fuente vía `className`/`style`, igual que antes.
 *
 * - `variant="primary"` → fondo `--pwa-primary` (token, cero hardcoded).
 * - `variant="outline"` → borde blanco sin fondo (botón secundario tipo CREATE ACCOUNT).
 * - Press: `active:scale-[0.97]` en ambos; primary atenúa brillo, outline tiñe el fondo.
 *
 * No fuerza `uppercase` ni el radio: cada pantalla pasa `uppercase`, `rounded-*` y las
 * coords vía `className`/`style` (preserva el casing/forma de cada CTA del XD).
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[hsl(var(--pwa-primary))] active:brightness-90',
  outline: 'border border-white active:bg-white/10',
};

export function PwaPrimaryButton({
  variant = 'primary',
  className,
  children,
  type = 'button',
  ...rest
}: {
  variant?: Variant;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-bold text-white transition-transform duration-100 active:scale-[0.97]',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
