'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useRef } from 'react';

import { useEscapeClose, useFocusTrap } from '../_lib/use-modal-a11y';

interface BulkDeleteModalProps {
  open: boolean;
  /** Nombres legibles de los clientes a eliminar (para la lista). */
  names: string[];
  deleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmación de borrado en bulk (F-HUB-9). Mismo lenguaje visual que
 * `DeleteKioskModal` pero con conteo + lista de nombres, ya que es una
 * acción destructiva sobre varios clientes a la vez.
 */
export function BulkDeleteModal({
  open,
  names,
  deleting = false,
  onCancel,
  onConfirm,
}: BulkDeleteModalProps) {
  useEscapeClose(open, onCancel);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(open, dialogRef);

  const count = names.length;

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
              ref={dialogRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="bulk-delete-title"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto w-[480px] max-w-[94vw] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start gap-3 px-5 py-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                  <AlertTriangle className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h2
                    id="bulk-delete-title"
                    className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white"
                  >
                    Delete {count} client{count === 1 ? '' : 's'}?
                  </h2>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    This permanently removes every selected client and all the products they own
                    (kiosks, digital displays, video walls, mobile PWA, tablets), along with their
                    branding, content, integrations and version history. This action cannot be
                    undone.
                  </p>
                  <ul className="mt-3 max-h-40 overflow-auto rounded-lg border border-zinc-100 bg-zinc-50/70 px-3 py-2 text-[12px] dark:border-zinc-800 dark:bg-zinc-950/40">
                    {names.map((name) => (
                      <li
                        key={name}
                        className="truncate py-0.5 text-zinc-700 dark:text-zinc-300"
                        title={name}
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={deleting}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : `Delete ${count} client${count === 1 ? '' : 's'}`}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
