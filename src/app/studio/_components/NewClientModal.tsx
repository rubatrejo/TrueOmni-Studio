'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;

type Orientation = 'portrait' | 'landscape' | 'mobile-pwa';

export function NewClientModal({
  open,
  existingSlugs,
  onClose,
  onCreate,
}: {
  open: boolean;
  existingSlugs: string[];
  onClose: () => void;
  onCreate: (input: { slug: string; nombre: string; orientation: Orientation }) => Promise<void>;
}) {
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nombreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setNombre('');
    setSlug('');
    setOrientation('portrait');
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

  // Escape cierra el modal (audit F-35 — los otros 3 modales del Studio
  // ya lo hacían; este faltaba).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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
      await onCreate({ slug, nombre: nombre.trim(), orientation });
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
            className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-md"
          />
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-kiosk-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto w-[440px] max-w-[92vw] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
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

              <div>
                <span className="mb-1.5 block text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
                  Orientation
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <OrientationOption
                    active={orientation === 'portrait'}
                    onClick={() => setOrientation('portrait')}
                    label="Portrait"
                    sub="1080 × 1920"
                    glyph={
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="7" y="2.5" width="10" height="19" rx="1.5" />
                        <line x1="10.5" y1="19" x2="13.5" y2="19" />
                      </svg>
                    }
                  />
                  <OrientationOption
                    active={orientation === 'landscape'}
                    onClick={() => setOrientation('landscape')}
                    label="Landscape"
                    sub="1920 × 1080"
                    glyph={
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2.5" y="7" width="19" height="10" rx="1.5" />
                        <line x1="19" y1="10.5" x2="19" y2="13.5" />
                      </svg>
                    }
                  />
                  <OrientationOption
                    active={orientation === 'mobile-pwa'}
                    onClick={() => setOrientation('mobile-pwa')}
                    label="Mobile PWA"
                    sub="390 × 844"
                    glyph={
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="8" y="2" width="8" height="20" rx="2" />
                        <line x1="11" y1="18.5" x2="13" y2="18.5" />
                        <line x1="10" y1="4.5" x2="14" y2="4.5" />
                      </svg>
                    }
                  />
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
                  This is the primary view that opens in the editor. All three formats
                  (Portrait, Landscape, Mobile PWA) are generated automatically — you can
                  switch between them inside the editor and export any of them at publish
                  time.
                </p>
              </div>

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
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function OrientationOption({
  active,
  onClick,
  label,
  sub,
  glyph,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
  glyph: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition ${
        active
          ? 'border-sky-500 bg-sky-50 text-sky-900 dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-100'
          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-900'
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${
          active
            ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400'
        }`}
        aria-hidden="true"
      >
        {glyph}
      </span>
      <span className="flex flex-col">
        <span className="text-[12.5px] font-semibold leading-tight">{label}</span>
        <span className="text-[10.5px] font-mono opacity-70">{sub}</span>
      </span>
    </button>
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
