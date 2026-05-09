'use client';

import { ArrowLeft, Trash2 } from 'lucide-react';
import { type ReactNode } from 'react';

interface CatalogItemPanelProps {
  /** Header del item — ej. el title actual del item. */
  title: string;
  /** Subtítulo opcional (slug, breadcrumb del catálogo). */
  subtitle?: string;
  onBack: () => void;
  onDelete?: () => void;
  /** Form / editor del item — el editor padre lo monta. */
  children: ReactNode;
}

/**
 * Pantalla dedicada de edición de un item del catálogo.
 *
 * Reemplaza al inline accordion: el editor padre conmuta entre la lista
 * (CatalogList) y este panel cuando el usuario selecciona un item.
 * Mantiene el live preview visible (el editor pane es la columna del medio).
 */
export function CatalogItemPanel({
  title,
  subtitle,
  onBack,
  onDelete,
  children,
}: CatalogItemPanelProps) {
  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to list"
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">
            {title || <span className="italic text-zinc-500">Untitled</span>}
          </h3>
          {subtitle ? <p className="truncate text-[11.5px] text-zinc-500">{subtitle}</p> : null}
        </div>

        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete item"
            className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 transition hover:bg-red-500/10 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </header>

      {children}
    </div>
  );
}
