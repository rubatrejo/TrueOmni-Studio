'use client';

import { ChevronRight, Eye } from 'lucide-react';
import Link from 'next/link';

import { StudioBrand } from '../../../../_components/StudioBrand';
import { ThemeToggle } from '../../../../_components/ThemeToggle';

/**
 * `<WallTopBar>` — clone del SignageTopBar para Video Walls.
 *
 * Mismo lenguaje visual: brand izq + breadcrumb "Clients > {client} >
 * Video Walls > {wall}" + slug pill + save status + open in tab.
 */
export interface WallTopBarProps {
  slug: string;
  clientSlug: string;
  clientName: string;
  wallName: string;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  isDirty: boolean;
  previewHref: string | null;
}

export function WallTopBar({
  slug,
  clientSlug,
  clientName,
  wallName,
  saveState,
  isDirty,
  previewHref,
}: WallTopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5 dark:border-zinc-900 dark:bg-zinc-950">
      <div className="flex items-center gap-4">
        <StudioBrand />
        <span className="block h-5 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
        <nav className="flex items-center gap-1.5 text-[13px] text-zinc-500">
          <Link
            href="/studio"
            className="hidden transition hover:text-zinc-800 dark:hover:text-zinc-300 xl:inline"
          >
            Clients
          </Link>
          <ChevronRight
            className="hidden h-3.5 w-3.5 text-zinc-400 dark:text-zinc-700 xl:block"
            aria-hidden="true"
          />
          <Link
            href={`/studio/${clientSlug}`}
            className="hidden transition hover:text-zinc-800 dark:hover:text-zinc-300 xl:inline"
          >
            {clientName}
          </Link>
          <ChevronRight
            className="hidden h-3.5 w-3.5 text-zinc-400 dark:text-zinc-700 xl:block"
            aria-hidden="true"
          />
          <Link
            href={`/studio/${clientSlug}/video-walls`}
            className="hidden transition hover:text-zinc-800 dark:hover:text-zinc-300 xl:inline"
          >
            Video Walls
          </Link>
          <ChevronRight
            className="hidden h-3.5 w-3.5 text-zinc-400 dark:text-zinc-700 xl:block"
            aria-hidden="true"
          />
          <span className="grid h-4 w-4 place-items-center rounded-sm bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="1.5" y="3" width="13" height="9" rx="1" />
              <line x1="6" y1="14" x2="10" y2="14" />
            </svg>
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{wallName}</span>
          <span
            className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500"
            title={`Wall slug: ${slug}`}
          >
            {slug}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <SaveStatusPill state={saveState} isDirty={isDirty} />
        <span className="mx-1 block h-5 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
        <ThemeToggle />
        {previewHref ? (
          <Link
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
            title="Open runtime URL in new tab"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Link>
        ) : null}
      </div>
    </header>
  );
}

function SaveStatusPill({
  state,
  isDirty,
}: {
  state: 'idle' | 'saving' | 'saved' | 'error';
  isDirty: boolean;
}) {
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        Saving
      </span>
    );
  }
  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-800 dark:bg-red-500/10 dark:text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Save failed
      </span>
    );
  }
  if (state === 'saved' && !isDirty) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Saved
      </span>
    );
  }
  if (isDirty) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
        Unsaved
      </span>
    );
  }
  return null;
}
