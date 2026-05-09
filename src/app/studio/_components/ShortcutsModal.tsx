'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import { useRef } from 'react';

import { useEscapeClose, useFocusTrap } from '../_lib/use-modal-a11y';

/**
 * Modal con la lista de shortcuts del Studio (audit F-44).
 *
 * Disparado con `Cmd+/` (Mac) o `Ctrl+/` (Win/Linux). El operador no tenía
 * forma de descubrir Cmd+S → save / Esc → close — este modal documenta los
 * shortcuts implementados en una sola pantalla.
 *
 * NO documenta shortcuts no implementados (ej. Cmd+N, Cmd+K) hasta que
 * existan — para evitar prometer features que no llegan.
 */
export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Hallazgos S-28 / S-29: Escape + focus trap unificados.
  useEscapeClose(open, onClose);
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
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-md"
          />
          <motion.div
            key="modal"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-modal-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/5"
          >
            <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                  <Keyboard className="h-3.5 w-3.5" />
                </span>
                <h2
                  id="shortcuts-modal-title"
                  className="font-display text-[14px] font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  Keyboard shortcuts
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </header>

            <div className="px-5 py-4">
              <ShortcutGroup title="Editor">
                <ShortcutRow keys={['⌘', 'S']} description="Save changes" />
                <ShortcutRow keys={['↑', '↓']} description="Navigate sections in the sidebar" />
                <ShortcutRow keys={['Home']} description="Jump to the first section" />
                <ShortcutRow keys={['End']} description="Jump to the last section" />
              </ShortcutGroup>

              <ShortcutGroup title="Modals & overlays">
                <ShortcutRow keys={['⌘', 'K']} description="Open the command palette" />
                <ShortcutRow keys={['⌘', '/']} description="Show this shortcuts panel" />
                <ShortcutRow keys={['Esc']} description="Close any open modal or overlay" />
              </ShortcutGroup>

              <p className="mt-4 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
                Cmd+N (new kiosk) lands with the next iteration. On Windows/Linux replace ⌘ with
                Ctrl.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ShortcutGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 last:mb-0">
      <h3 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      <ul className="space-y-1.5">{children}</ul>
    </section>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-[12.5px] text-zinc-700 dark:text-zinc-300">
      <span>{description}</span>
      <span className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="inline-grid min-w-[22px] place-items-center rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {k}
          </kbd>
        ))}
      </span>
    </li>
  );
}
