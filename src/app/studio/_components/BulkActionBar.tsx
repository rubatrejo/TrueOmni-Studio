'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Download, Loader2, RefreshCw, Star, Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Barra flotante de acciones bulk del dashboard de clientes (F-HUB-9).
 *
 * Visible solo en modo selección (≥1 cliente marcado). Sticky abajo-centro.
 * Pin/Unpin son acciones separadas (el endpoint pin es toggle): cada botón
 * actúa solo sobre el subconjunto relevante de la selección.
 */
interface BulkActionBarProps {
  selectedCount: number;
  /** Total de clientes seleccionables (para "Select all" y el "N / M"). */
  selectableCount: number;
  /** Cuántos de los seleccionados están unpinned (targets de Pin). */
  pinnableCount: number;
  /** Cuántos de los seleccionados están pinned (targets de Unpin). */
  unpinnableCount: number;
  busy: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onResync: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export function BulkActionBar({
  selectedCount,
  selectableCount,
  pinnableCount,
  unpinnableCount,
  busy,
  onSelectAll,
  onClear,
  onPin,
  onUnpin,
  onResync,
  onExport,
  onDelete,
}: BulkActionBarProps) {
  const open = selectedCount > 0;
  const allSelected = selectedCount >= selectableCount;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="toolbar"
          aria-label="Bulk actions"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-6 z-50 mx-auto flex w-max max-w-[94vw] flex-wrap items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white/95 px-3 py-2 shadow-2xl backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95"
        >
          <span className="px-1.5 text-[12.5px] font-semibold tabular-nums text-zinc-900 dark:text-white">
            {selectedCount} selected
          </span>

          <Divider />

          <button
            type="button"
            onClick={onSelectAll}
            disabled={busy || allSelected}
            className="rounded-md px-2 py-1.5 text-[12.5px] font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            Select all
          </button>

          <Divider />

          <BarButton
            label="Pin"
            count={pinnableCount}
            disabled={busy || pinnableCount === 0}
            onClick={onPin}
            icon={<Star className="h-3.5 w-3.5" strokeWidth={2} />}
          />
          <BarButton
            label="Unpin"
            count={unpinnableCount}
            disabled={busy || unpinnableCount === 0}
            onClick={onUnpin}
            icon={<Star className="h-3.5 w-3.5 fill-current" strokeWidth={2} />}
          />
          <BarButton
            label="Resync"
            disabled={busy}
            onClick={onResync}
            icon={<RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />}
          />
          <BarButton
            label="Export"
            disabled={busy}
            onClick={onExport}
            icon={<Download className="h-3.5 w-3.5" strokeWidth={2} />}
          />

          <Divider />

          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12.5px] font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            Delete
          </button>

          <Divider />

          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            aria-label="Clear selection"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Divider() {
  return <span aria-hidden className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />;
}

function BarButton({
  label,
  count,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  count?: number;
  disabled?: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12.5px] font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
    >
      {icon}
      {label}
      {typeof count === 'number' && count > 0 && (
        <span className="tabular-nums text-zinc-400 dark:text-zinc-500">{count}</span>
      )}
    </button>
  );
}
