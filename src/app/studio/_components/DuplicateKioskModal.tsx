'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useEscapeClose, useFocusTrap } from '../_lib/use-modal-a11y';

interface DuplicateKioskModalProps {
  open: boolean;
  /** Nombre legible del kiosk fuente — mostrado al operador para confirmar
   *  desde dónde está clonando. */
  sourceNombre: string;
  /** Lista de slugs ya existentes (para validar el slug auto-generado). */
  existingSlugs: string[];
  cloning?: boolean;
  onCancel: () => void;
  onConfirm: (newNombre: string) => void;
}

/**
 * Modal liviano para duplicar un kiosk existente. Reusa el endpoint
 * `/api/studio/configs/[slug]/clone` (S3.x). El slug se genera del nombre
 * via slugify (matchea la lógica de `NewClientModal`).
 *
 * Hallazgo #24 del audit: el endpoint existía sin UI surface.
 */
export function DuplicateKioskModal({
  open,
  sourceNombre,
  existingSlugs,
  cloning = false,
  onCancel,
  onConfirm,
}: DuplicateKioskModalProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(`${sourceNombre} copy`);
    // Auto-focus diferido para evitar el lint `jsx-a11y/no-autofocus` (que
    // bloquea el atributo prop) y para que la animación de mount termine
    // antes de mover el foco.
    const id = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(id);
  }, [open, sourceNombre]);

  // Hallazgos S-28 / S-29: Escape + focus trap unificados.
  useEscapeClose(open, onCancel);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(open, dialogRef);

  const slug = slugify(name);
  const slugConflict = existingSlugs.includes(slug);
  const canSubmit = name.trim().length > 0 && slug.length > 0 && !slugConflict && !cloning;

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
              role="dialog"
              aria-modal="true"
              aria-labelledby="duplicate-kiosk-title"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto w-[480px] max-w-[94vw] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-300">
                  <Copy className="h-4 w-4" />
                </span>
                <h2
                  id="duplicate-kiosk-title"
                  className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white"
                >
                  Duplicate &quot;{sourceNombre}&quot;
                </h2>
              </div>
              <div className="space-y-3 px-5 py-5">
                <p className="text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Clones the entire config (branding, modules, content, integrations) of
                  <strong className="font-medium text-zinc-700 dark:text-zinc-300">
                    {' '}{sourceNombre}
                  </strong>{' '}
                  into a new kiosk. You can edit anything in the editor afterwards.
                </p>
                <div>
                  <label
                    htmlFor="duplicate-name"
                    className="mb-1.5 block text-[12px] font-medium text-zinc-800 dark:text-zinc-200"
                  >
                    New kiosk name
                  </label>
                  <input
                    ref={inputRef}
                    id="duplicate-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Davenport Visitor Center"
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
                  />
                  <p className="mt-1.5 text-[11px] text-zinc-500">
                    Slug:{' '}
                    <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                      {slug || '—'}
                    </code>
                    {slugConflict && (
                      <span className="ml-2 text-red-600 dark:text-red-400">
                        already exists
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onConfirm(name)}
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400"
                >
                  {cloning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                  {cloning ? 'Duplicating…' : 'Duplicate'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}
