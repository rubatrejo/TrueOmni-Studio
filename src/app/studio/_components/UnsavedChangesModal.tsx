'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

interface UnsavedChangesModalProps {
  open: boolean;
  saving?: boolean;
  /** Cancelar la navegación pendiente y volver al editor. */
  onCancel: () => void;
  /** Descartar cambios y proceder con la navegación. */
  onDiscard: () => void;
  /** Guardar y luego navegar. */
  onSave: () => void;
}

/**
 * Modal de warning cuando el operador intenta navegar fuera del editor con
 * cambios sin guardar. Complementa el `beforeunload` nativo (que solo cubre
 * cerrar/refrescar pestaña): este maneja la nav intra-app del Studio.
 */
export function UnsavedChangesModal({
  open,
  saving = false,
  onCancel,
  onDiscard,
  onSave,
}: UnsavedChangesModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onCancel}
            className="fixed inset-0 z-[60] bg-zinc-950/70 backdrop-blur-md"
          />
          <div className="pointer-events-none fixed inset-0 z-[61] grid place-items-center p-4">
            <motion.div
              key="modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="unsaved-title"
              aria-describedby="unsaved-desc"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto w-[460px] max-w-[94vw] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start gap-3 px-5 py-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h2
                    id="unsaved-title"
                    className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white"
                  >
                    Unsaved changes
                  </h2>
                  <p
                    id="unsaved-desc"
                    className="mt-1 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400"
                  >
                    You have changes that haven&apos;t been saved yet. If you leave now they
                    will be lost. Save them first or discard to continue.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                <button
                  type="button"
                  onClick={onDiscard}
                  disabled={saving}
                  className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/40 dark:bg-zinc-900 dark:text-red-300 dark:hover:border-red-800 dark:hover:bg-red-950/30"
                >
                  Discard changes
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={saving}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {saving ? 'Saving…' : 'Save & continue'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
