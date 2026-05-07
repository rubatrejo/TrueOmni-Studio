'use client';

import { ExternalLink, Monitor } from 'lucide-react';
import Link from 'next/link';

import type { SignageDisplayListEntry } from '@/lib/signage/config';

/**
 * Tab `Displays` — read-only en DSS1.
 *
 * Lista los displays del theme con `slug`, `name`, `slidesCount` y un link
 * "Preview" que abre el runtime en una nueva pestaña.
 *
 * En DSS2+ esta tab se reemplaza por el editor de display (sidebar +
 * playlist + module forms + preview iframe). DSS4 introduce drag-to-reorder
 * + Add slide wizard.
 */
export interface DisplaysTabProps {
  clientSlug: string;
  displays: SignageDisplayListEntry[];
}

export function DisplaysTab({ clientSlug, displays }: DisplaysTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
          Displays
        </h3>
        <p className="mt-0.5 text-[12px] text-zinc-500">
          {displays.length} display{displays.length === 1 ? '' : 's'} configured ·
          click to open editor
        </p>
      </header>

      {displays.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <Monitor
            className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-600"
            strokeWidth={1.5}
          />
          <p className="mt-4 text-base font-medium text-zinc-700 dark:text-zinc-300">
            No displays yet
          </p>
          <p className="mt-1 text-[12.5px] text-zinc-500">
            Drop a folder under{' '}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11.5px] dark:bg-zinc-800">
              displays/&lt;slug&gt;/
            </code>{' '}
            to bootstrap one.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {displays.map((d) => {
            const editorHref = `/studio/digital-displays/${clientSlug}/displays/${d.slug}`;
            const previewHref = `/signage/${clientSlug}/${d.slug}`;
            return (
              <li key={d.slug}>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
                  <Link
                    href={editorHref}
                    className="flex flex-1 items-center gap-3"
                    title={`Open editor for ${d.name}`}
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                      <Monitor className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-zinc-900 dark:text-white">
                        {d.name}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-zinc-500">
                        <span className="font-mono">{d.slug}</span>
                        <span className="mx-1.5 text-zinc-400 dark:text-zinc-600">·</span>
                        {d.slidesCount} slide{d.slidesCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </Link>
                  <a
                    href={previewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Preview ${d.name} in new tab`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
                  >
                    Preview
                    <ExternalLink className="h-3 w-3" strokeWidth={2} />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
