'use client';

import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';

/**
 * Botón reusable del Studio (audit F-27).
 *
 * Tres variants con jerarquía visual clara:
 *   - `primary`:   acción principal de la pantalla (Save, Publish, New kiosk).
 *                  zinc-900 sólido, máxima atención.
 *   - `secondary`: acción de soporte (Versions, Open in tab).
 *                  border + bg blanco, peso medio.
 *   - `ghost`:     acción terciaria (Cancel, Discard).
 *                  sin border, hover sutil.
 *
 * Tres sizes: sm (toolbars), md (default), lg (CTAs hero).
 *
 * Use cualquier `<svg>` o icono lucide como hijo + texto:
 *
 *   <StudioButton variant="primary" leftIcon={<Plus />}>
 *     New kiosk
 *   </StudioButton>
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-zinc-900 text-white shadow-sm hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200',
  secondary:
    'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800',
  ghost:
    'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100',
  danger: 'bg-red-500/15 text-red-700 hover:bg-red-500/25 disabled:opacity-50 dark:text-red-300',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-[11.5px] gap-1.5',
  md: 'h-8 px-3 text-[12px] gap-1.5',
  lg: 'h-10 px-4 text-sm gap-2',
};

interface StudioButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const StudioButton = forwardRef<HTMLButtonElement, StudioButtonProps>(
  (
    { variant = 'primary', size = 'md', leftIcon, rightIcon, className = '', children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={props.type ?? 'button'}
        {...props}
        className={
          'inline-flex items-center justify-center rounded-md font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 ' +
          VARIANT_CLASSES[variant] +
          ' ' +
          SIZE_CLASSES[size] +
          ' ' +
          className
        }
      >
        {leftIcon}
        {children}
        {rightIcon}
      </button>
    );
  },
);

StudioButton.displayName = 'StudioButton';
