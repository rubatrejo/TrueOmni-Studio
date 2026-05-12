'use client';

import { Loader2, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import type { SignageOrientation } from '@/lib/signage/schema';

import { useEscapeClose, useFocusTrap } from '../../../_lib/use-modal-a11y';

/**
 * `<NewDisplayCard>` — reemplaza el placeholder "Coming soon" del card
 * "Add display" en `/studio/[slug]/digital-displays`. Hallazgo S-44 del
 * audit panorámico v2.
 *
 * Abre un modal con name + slug auto-generado, llama al endpoint existente
 * `POST /api/studio/signage/displays/[client]` (DSS sub-fase) y redirige
 * al editor del display recién creado. El endpoint clona desde
 * `default/lobby-tv` automáticamente.
 */
export function NewDisplayCard({
  clientSlug,
  existingSlugs,
}: {
  clientSlug: string;
  existingSlugs: ReadonlyArray<string>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [orientation, setOrientation] = useState<SignageOrientation>('landscape');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setSlug('');
    setSlugTouched(false);
    setOrientation('landscape');
    setSubmitting(false);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugify(name));
  }, [name, slugTouched]);

  useEscapeClose(open, () => setOpen(false));
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(open, dialogRef);

  const slugError = (() => {
    if (!slug) return null;
    if (!/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/.test(slug)) {
      return 'Slug must be lowercase letters, digits and dashes.';
    }
    if (existingSlugs.includes(slug)) {
      return `A display "${slug}" already exists in this client.`;
    }
    return null;
  })();
  const canSubmit = name.trim().length > 0 && slug.length > 0 && !slugError && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/studio/signage/displays/${clientSlug}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          defaultOrientation: orientation,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setOpen(false);
      router.push(`/studio/${clientSlug}/digital-displays/${slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create display');
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Add a new display to ${clientSlug}`}
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/40 px-6 py-12 text-zinc-500 transition hover:border-sky-400 hover:bg-sky-50/40 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-500 dark:hover:border-sky-500/60 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
      >
        <span
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 dark:bg-zinc-800"
        >
          <Plus className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="text-sm font-medium">Add display</span>
        <span className="text-[10.5px] uppercase tracking-wider text-zinc-400">
          Clones from default · lobby-tv
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-md"
            onClick={() => !submitting && setOpen(false)}
            aria-hidden
          />
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-display-title"
              className="pointer-events-auto w-[480px] max-w-[94vw] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
                <h2
                  id="new-display-title"
                  className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white"
                >
                  New display in {clientSlug}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="new-display-name"
                    className="text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Name
                  </label>
                  <input
                    ref={inputRef}
                    id="new-display-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lobby TV"
                    autoComplete="off"
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Display name shown on the workspace and signage editor.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="new-display-slug"
                    className="text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Slug
                  </label>
                  <input
                    id="new-display-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugTouched(true);
                    }}
                    placeholder="lobby-tv"
                    autoComplete="off"
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 font-mono text-[12.5px] text-zinc-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                  />
                  {slugError ? (
                    <p className="text-[11px] text-red-600 dark:text-red-400">{slugError}</p>
                  ) : (
                    <p className="text-[11px] text-zinc-500">
                      URL-safe identifier. Auto-generated from the name; edit if you need it
                      different.
                    </p>
                  )}
                </div>

                <div>
                  <span className="mb-1.5 block text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300">
                    Orientation
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <OrientationButton
                      active={orientation === 'landscape'}
                      onClick={() => setOrientation('landscape')}
                      label="Landscape"
                      sub="1920 × 1080"
                      glyph={
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="2.5" y="7" width="19" height="10" rx="1.5" />
                          <line x1="19" y1="10.5" x2="19" y2="13.5" />
                        </svg>
                      }
                    />
                    <OrientationButton
                      active={orientation === 'portrait'}
                      onClick={() => setOrientation('portrait')}
                      label="Portrait"
                      sub="1080 × 1920"
                      glyph={
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="7" y="2.5" width="10" height="19" rx="1.5" />
                          <line x1="10.5" y1="19" x2="13.5" y2="19" />
                        </svg>
                      }
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                    Physical orientation of the screen. Templates and preview adapt automatically.
                  </p>
                </div>

                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50/60 p-2.5 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={submitting}
                    className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Create display
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
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

function OrientationButton({
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
      <span className="flex min-w-0 flex-col">
        <span className="whitespace-nowrap text-[13px] font-semibold leading-tight">{label}</span>
        <span className="whitespace-nowrap font-mono text-[11px] opacity-70">{sub}</span>
      </span>
    </button>
  );
}
