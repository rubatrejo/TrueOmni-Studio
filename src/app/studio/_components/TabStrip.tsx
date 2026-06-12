'use client';

import type { LucideIcon } from 'lucide-react';

import { useRovingTabList } from '../_lib/use-roving-tab-list';

/**
 * `<TabStrip>` — horizontal tab list reutilizable. Patrón estándar del
 * Studio para selectores de panel inline (BrandingForm, futuros).
 *
 * Hallazgo S-15 del audit panorámico v2: BrandingForm usaba
 * `<button aria-current="page">` sin role=tablist; kiosk/signage sidebars
 * usan tablist vertical correcto. Esto unifica el patrón horizontal con
 * full ARIA + keyboard nav (Arrow Left/Right, Home, End).
 *
 * Variants visuales:
 *   - `underline` (default): tab activo con barra inferior sólida.
 *   - `chip`: tab activo con fondo pill.
 */
export interface TabStripItem<K extends string = string> {
  key: K;
  label: string;
  icon?: LucideIcon;
  /** Tooltip / aria-description opcional. */
  title?: string;
}

export interface TabStripProps<K extends string = string> {
  /** Lista de tabs. Orden importa — define el tab order de Arrow keys. */
  items: ReadonlyArray<TabStripItem<K>>;
  /** Tab activo. Debe coincidir con un `item.key`. */
  active: K;
  onChange: (key: K) => void;
  /** Variant visual. Default `underline`. */
  variant?: 'underline' | 'chip';
  /**
   * `id` base para los pares tab/panel. El componente genera
   * `${idBase}-tab-{key}` y `${idBase}-panel-{key}` para cada item.
   * El padre debe usar ese mismo `id` en sus `<div role="tabpanel">`.
   */
  idBase: string;
  /** Etiqueta accesible del tablist (ej. "Branding sections"). */
  ariaLabel: string;
  /** Container className override. */
  className?: string;
}

export function TabStrip<K extends string = string>({
  items,
  active,
  onChange,
  variant = 'underline',
  idBase,
  ariaLabel,
  className,
}: TabStripProps<K>) {
  const { buttonRefs, handleKeyDown } = useRovingTabList({
    count: items.length,
    onSelect: (idx) => {
      const item = items[idx];
      if (item) onChange(item.key);
    },
  });

  const baseContainer =
    variant === 'chip'
      ? 'inline-flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900'
      : 'scrollbar-hide flex items-center gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      className={`${baseContainer} ${className ?? ''}`}
    >
      {items.map(({ key, label, icon: Icon, title }, idx) => {
        const isActive = key === active;
        const tabId = `${idBase}-tab-${key}`;
        const panelId = `${idBase}-panel-${key}`;

        const chipClass = isActive
          ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700'
          : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200';

        const underlineClass = isActive
          ? 'text-zinc-900 dark:text-white'
          : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300';

        return (
          <button
            key={key}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            id={tabId}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            title={title}
            onClick={() => onChange(key)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 ${
              variant === 'chip' ? 'py-1.5' : 'py-3'
            } text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 ${
              variant === 'chip' ? chipClass : underlineClass
            }`}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> : null}
            <span>{label}</span>
            {variant === 'underline' && isActive ? (
              <span
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-zinc-900 dark:bg-white"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
