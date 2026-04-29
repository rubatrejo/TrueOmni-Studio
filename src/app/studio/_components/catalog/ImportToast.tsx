'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { useEffect } from 'react';

import type { ImportStats } from '@/app/studio/_lib/import-helpers';

interface ImportToastProps {
  stats: ImportStats | null;
  noun: string;
  onDismiss: () => void;
  durationMs?: number;
}

/**
 * Banner verde temporal que aparece tras un import exitoso. Se autodescarta
 * después de `durationMs` (default 4s).
 */
export function ImportToast({
  stats,
  noun,
  onDismiss,
  durationMs = 4000,
}: ImportToastProps) {
  useEffect(() => {
    if (!stats) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [stats, durationMs, onDismiss]);

  return (
    <AnimatePresence>
      {stats ? (
        <motion.div
          key="toast"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[12px] text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              <strong>{stats.total}</strong> {noun} imported
              {stats.added > 0 || stats.updated > 0 ? (
                <span className="ml-1 font-mono text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                  ({stats.added} added · {stats.updated} updated
                  {stats.errors > 0 ? ` · ${stats.errors} skipped` : ''})
                </span>
              ) : null}
            </span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="grid h-6 w-6 place-items-center rounded text-emerald-800/70 transition hover:bg-emerald-100 hover:text-emerald-900 dark:text-emerald-300/70 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
