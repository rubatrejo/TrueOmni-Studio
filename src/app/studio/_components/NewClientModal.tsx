'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;

export function NewClientModal({
  open,
  existingSlugs,
  onClose,
  onCreate,
}: {
  open: boolean;
  existingSlugs: string[];
  onClose: () => void;
  onCreate: (input: { slug: string; nombre: string }) => Promise<void>;
}) {
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nombreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setNombre('');
    setSlug('');
    setError(null);
    setSubmitting(false);
    // Auto-focus al abrir.
    setTimeout(() => nombreRef.current?.focus(), 50);
  }, [open]);

  // Auto-suggest slug a partir de nombre.
  useEffect(() => {
    setSlug((curr) => {
      if (curr) return curr; // si el usuario lo editó, no sobrescribir
      return slugify(nombre);
    });
  }, [nombre]);

  const validateSlug = (): string | null => {
    if (!slug) return 'Slug is required';
    if (!SLUG_REGEX.test(slug)) {
      return 'Slug must be lowercase letters, digits and hyphens (1–64 chars).';
    }
    if (existingSlugs.includes(slug)) {
      return `A kiosk with slug "${slug}" already exists`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombre.trim()) {
      setError('Name is required');
      return;
    }
    const slugError = validateSlug();
    if (slugError) {
      setError(slugError);
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({ slug, nombre: nombre.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
      setSubmitting(false);
    }
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
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-kiosk-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-[12vh] z-50 mx-auto w-[440px] max-w-[92vw] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
              <h2
                id="new-kiosk-title"
                className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white"
              >
                New kiosk
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
              <Field
                id="kiosk-name"
                label="Name"
                hint="Display name shown on the kiosk and in the studio list."
                input={
                  <input
                    ref={nombreRef}
                    id="kiosk-name"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="e.g. Phoenix Convention Center"
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
                    autoComplete="off"
                  />
                }
              />

              <Field
                id="kiosk-slug"
                label="Slug"
                hint="Used in URLs and in the file system: clients/<slug>/. Auto-generated from name."
                input={
                  <input
                    id="kiosk-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    placeholder="phoenix-convention-center"
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-[13px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
                    autoComplete="off"
                    spellCheck={false}
                  />
                }
              />

              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                >
                  {error}
                </p>
              )}

              <p className="text-[11.5px] leading-relaxed text-zinc-500">
                Cloning the default brand palette: TrueOmni Tech Blue. You can change all
                colors, logos, modules and content in the editor afterwards.
              </p>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !nombre.trim() || !slug}
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {submitting ? 'Creating…' : 'Create kiosk'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  id,
  label,
  hint,
  input,
}: {
  id: string;
  label: string;
  hint?: string;
  input: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </label>
      {input}
      {hint && (
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">{hint}</p>
      )}
    </div>
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
