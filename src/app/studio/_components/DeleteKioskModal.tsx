'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useRef } from 'react';

import { useEscapeClose, useFocusTrap } from '../_lib/use-modal-a11y';

interface DeleteKioskModalProps {
  open: boolean;
  /** Nombre legible del cliente a eliminar (mostrado al operador). */
  kioskName: string;
  /** Slug del cliente — se usa solo en el confirmation copy. */
  kioskSlug: string;
  deleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Modal de warning antes de eliminar un cliente unified entero (kiosk +
 * signage + video walls + mobile pwa + tablets + manifest + branding).
 * Reemplaza el `confirm()` nativo del browser por un diálogo consistente
 * con el resto del Studio (`<UnsavedChangesModal>`). Acción destructiva →
 * botón rojo "Delete client" y cancel default.
 */
export function DeleteKioskModal({
  open,
  kioskName,
  kioskSlug,
  deleting = false,
  onCancel,
  onConfirm,
}: DeleteKioskModalProps) {
  // Hallazgos S-28 / S-29: Escape + focus trap unificados via hook.
  useEscapeClose(open, onCancel);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(open, dialogRef);

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
              aria-labelledby="delete-kiosk-title"
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
                    id="delete-kiosk-title"
                    className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white"
                  >
                    Delete &quot;{kioskName}&quot;?
                  </h2>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    This will permanently remove the client{' '}
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">{kioskSlug}</span>{' '}
                    and every product it owns (kiosks, digital displays, video walls, mobile PWA,
                    tablets) along with all its branding, content, integrations and version history.
                    This action cannot be undone.
                  </p>
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
                  {deleting ? 'Deleting…' : 'Delete client'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
