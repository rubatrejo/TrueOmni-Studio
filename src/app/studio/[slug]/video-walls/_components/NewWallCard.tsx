'use client';

import { Loader2, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { GRID_CONFIGS, type GridConfig } from '@/lib/video-walls/dimensions';

import { useEscapeClose, useFocusTrap } from '../../../_lib/use-modal-a11y';

/**
 * `<NewWallCard>` — botón + modal para crear un wall nuevo dentro de un
 * cliente con `products.videoWalls = true`.
 *
 * Pasos:
 *  1. Name + slug (auto-generado, editable).
 *  2. Grid picker 5-way (3×2 · 4×2 · 2×2 · 2×1 · 1×2) con SVG glyphs.
 *  3. POST `/api/studio/video-walls/walls/{client}` → redirect al editor.
 */
export function NewWallCard({
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
  const [grid, setGrid] = useState<GridConfig>('3x2');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setSlug('');
    setSlugTouched(false);
    setGrid('3x2');
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
      return `A wall "${slug}" already exists in this client.`;
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
      const res = await fetch(`/api/studio/video-walls/walls/${clientSlug}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, name: name.trim(), grid }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setOpen(false);
      router.push(`/studio/${clientSlug}/video-walls/${slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wall');
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Add a new video wall to ${clientSlug}`}
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/40 px-6 py-12 text-zinc-500 transition hover:border-sky-400 hover:bg-sky-50/40 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-500 dark:hover:border-sky-500/60 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
      >
        <span
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 dark:bg-zinc-800"
        >
          <Plus className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="text-sm font-medium">Add wall</span>
        <span className="text-[10.5px] uppercase tracking-wider text-zinc-400">
          Choose grid · 3×2 / 4×2 / 2×2 / 2×1 / 1×2
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
              aria-labelledby="new-wall-title"
              className="pointer-events-auto w-[560px] max-w-[94vw] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
                <h2
                  id="new-wall-title"
                  className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white"
                >
                  New video wall in {clientSlug}
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
                    htmlFor="new-wall-name"
                    className="text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Name
                  </label>
                  <input
                    ref={inputRef}
                    id="new-wall-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lobby Wall"
                    autoComplete="off"
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="new-wall-slug"
                    className="text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Slug
                  </label>
                  <input
                    id="new-wall-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugTouched(true);
                    }}
                    placeholder="lobby-wall"
                    autoComplete="off"
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 font-mono text-[12.5px] text-zinc-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                  />
                  {slugError ? (
                    <p className="text-[11px] text-red-600 dark:text-red-400">{slugError}</p>
                  ) : (
                    <p className="text-[11px] text-zinc-500">
                      URL-safe identifier. Auto-generated from the name; edit if needed.
                    </p>
                  )}
                </div>

                <div>
                  <span className="mb-1.5 block text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300">
                    Grid configuration
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {(['3x2', '4x2', '2x2', '2x1', '1x2'] as const).map((g) => (
                      <GridButton key={g} grid={g} active={grid === g} onClick={() => setGrid(g)} />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                    Each cell is a 1920×1080 landscape TV. Total canvas ={' '}
                    <span className="font-mono">
                      {GRID_CONFIGS[grid].cols * 1920}×{GRID_CONFIGS[grid].rows * 1080}
                    </span>
                    .
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
                    Create wall
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

/** SVG glyph que renderiza un grid M×N en una caja 36×24 (landscape-ish). */
export function GridGlyph({ grid, size = 36 }: { grid: GridConfig; size?: number }) {
  const { cols, rows } = GRID_CONFIGS[grid];
  // Boundary 36×24 base; ajustamos para portrait (1x2) que es más alto que ancho.
  const isPortrait = cols < rows;
  const w = size;
  const h = isPortrait ? Math.round(size * 1.4) : Math.round(size * 0.667);
  const cellW = w / cols;
  const cellH = h / rows;
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let c = 1; c < cols; c += 1) lines.push({ x1: c * cellW, y1: 0, x2: c * cellW, y2: h });
  for (let r = 1; r < rows; r += 1) lines.push({ x1: 0, y1: r * cellH, x2: w, y2: r * cellH });
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="0.75" y="0.75" width={w - 1.5} height={h - 1.5} rx="1.5" />
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
      ))}
    </svg>
  );
}

function GridButton({
  grid,
  active,
  onClick,
}: {
  grid: GridConfig;
  active: boolean;
  onClick: () => void;
}) {
  const { cols, rows } = GRID_CONFIGS[grid];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-md border px-2 py-2.5 transition ${
        active
          ? 'border-sky-500 bg-sky-50 text-sky-900 dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-100'
          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-900'
      }`}
    >
      <span
        className={`grid h-12 place-items-center ${
          active ? 'text-sky-600 dark:text-sky-300' : 'text-zinc-500 dark:text-zinc-500'
        }`}
        aria-hidden="true"
      >
        <GridGlyph grid={grid} size={36} />
      </span>
      <span className="font-mono text-[11px] font-semibold tracking-wide">
        {cols}×{rows}
      </span>
    </button>
  );
}
