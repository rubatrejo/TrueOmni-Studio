'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  groupCatalogByRegion,
  type LocaleEntry,
  type LocaleRegion,
} from '@/lib/studio/locale-catalog';

import { useEscapeClose, useFocusTrap } from '../_lib/use-modal-a11y';

interface AddLanguageModalProps {
  open: boolean;
  /** Locales ya activos en el bundle (no se pueden añadir de nuevo). */
  existingLocales: readonly string[];
  onClose: () => void;
  onAdd: (code: string) => void;
}

/**
 * Modal para añadir un idioma al kiosk. Lista ~100 idiomas ISO 639-1
 * agrupados por región, con search filter. Idiomas ya presentes aparecen
 * disabled con check verde.
 *
 * El operador no está limitado a este catálogo — pero lo cubre 95% de
 * casos. Para idiomas custom el dev puede añadir entries en
 * `src/lib/studio/locale-catalog.ts`.
 */
export function AddLanguageModal({ open, existingLocales, onClose, onAdd }: AddLanguageModalProps) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setSearch('');
  }, [open]);

  // Hallazgos S-28 / S-29: Escape + focus trap unificados.
  useEscapeClose(open, onClose);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(open, dialogRef);

  const groups = useMemo(() => groupCatalogByRegion(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    const result: Record<LocaleRegion, LocaleEntry[]> = {
      Europe: [],
      Americas: [],
      Asia: [],
      'Middle East': [],
      Africa: [],
      Pacific: [],
    };
    for (const [region, entries] of Object.entries(groups) as Array<
      [LocaleRegion, LocaleEntry[]]
    >) {
      result[region] = entries.filter(
        (entry) =>
          entry.code.includes(q) ||
          entry.englishName.toLowerCase().includes(q) ||
          entry.nativeName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [search, groups]);

  const totalFiltered = Object.values(filtered).reduce((sum, arr) => sum + arr.length, 0);

  const existingSet = useMemo(() => new Set(existingLocales), [existingLocales]);

  const handleAdd = (code: string) => {
    if (existingSet.has(code)) return;
    onAdd(code);
    onClose();
  };

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
            aria-labelledby="add-language-modal-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-[8vh] z-50 mx-auto flex max-h-[84vh] w-[560px] max-w-[94vw] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
              <div>
                <h2
                  id="add-language-modal-title"
                  className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white"
                >
                  Add a language
                </h2>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  Adds a new locale column with empty translations. You can edit them manually or
                  use the ✨ button per cell.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- modal abierto por click; foco esperado en search.
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or code (e.g. italian, it, 日本語)"
                  className="w-full rounded-md border border-zinc-200 bg-white py-2 pl-9 pr-3 text-[13px] text-zinc-800 placeholder:text-zinc-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              {search && (
                <p className="mt-1.5 text-[11px] text-zinc-500">
                  {totalFiltered} {totalFiltered === 1 ? 'match' : 'matches'}
                </p>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {totalFiltered === 0 ? (
                <p className="px-3 py-8 text-center text-[12px] italic text-zinc-500">
                  No languages match &quot;{search}&quot;.
                </p>
              ) : (
                Object.entries(filtered).map(([region, entries]) => {
                  if (entries.length === 0) return null;
                  return (
                    <section key={region} className="mb-3">
                      <h3 className="px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                        {region}
                      </h3>
                      <ul className="space-y-0.5">
                        {entries.map((entry) => {
                          const exists = existingSet.has(entry.code);
                          return (
                            <li key={entry.code}>
                              <button
                                type="button"
                                onClick={() => handleAdd(entry.code)}
                                disabled={exists}
                                className={
                                  'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition ' +
                                  (exists
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60')
                                }
                              >
                                <span className="w-7 shrink-0 font-mono text-[10.5px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                                  {entry.code}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                                    {entry.englishName}
                                  </span>
                                  <span className="block text-[11.5px] text-zinc-500">
                                    {entry.nativeName}
                                  </span>
                                </span>
                                {exists && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <Check className="h-3 w-3" />
                                    Added
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
