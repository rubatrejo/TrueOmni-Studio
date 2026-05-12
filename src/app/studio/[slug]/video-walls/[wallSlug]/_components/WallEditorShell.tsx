'use client';

import { Image, Layers, Palette, Settings } from 'lucide-react';
import { useState } from 'react';

import { GRID_CONFIGS, type GridConfig } from '@/lib/video-walls/dimensions';

import { PreviewFrame } from './PreviewFrame';

/**
 * <WallEditorShell> — VW5 minimal shell.
 *
 * Layout:
 *   - TopBar (server-rendered, server side)
 *   - Sidebar de tabs (4 stubs por ahora: Playlist, Branding, Settings, Versions)
 *   - Panel central con info de la tab activa (stub)
 *   - PreviewFrame derecha (iframe runtime + cell selector + bezel toggle)
 *
 * VW6 cablea Playlist (add/remove/reorder slides + assign modules).
 * VW7 cablea Branding/Header/Settings/Versions/Publish.
 */
export interface WallEditorShellProps {
  clientSlug: string;
  clientName: string;
  wallSlug: string;
  wallName: string;
  grid: GridConfig;
}

type TabId = 'playlist' | 'branding' | 'settings' | 'versions';

const TABS: { id: TabId; label: string; icon: typeof Layers; description: string }[] = [
  {
    id: 'playlist',
    label: 'Playlist',
    icon: Layers,
    description: 'Add slides, pick templates, assign modules to slots.',
  },
  {
    id: 'branding',
    label: 'Branding',
    icon: Palette,
    description: 'Logos, brand colors and fonts (synced with other products of this client).',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'Audio, transitions, default slide duration, sleep schedule.',
  },
  {
    id: 'versions',
    label: 'Versions',
    icon: Image,
    description: 'Snapshots history and restore.',
  },
];

export function WallEditorShell({ wallSlug, wallName, grid }: WallEditorShellProps) {
  const [tab, setTab] = useState<TabId>('playlist');
  const { cols, rows } = GRID_CONFIGS[grid];

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="flex w-[68px] shrink-0 flex-col items-center gap-1 border-r border-zinc-200 bg-white py-3 dark:border-zinc-800 dark:bg-zinc-950">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={active}
              title={t.label}
              className={`flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-md transition ${
                active
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <span className="text-[9.5px] font-medium">{t.label}</span>
            </button>
          );
        })}
      </aside>

      {/* Tab content (stub) */}
      <section className="flex w-[360px] shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="font-display text-[14px] font-semibold text-zinc-900 dark:text-white">
            {TABS.find((t) => t.id === tab)?.label}
          </h2>
          <p className="mt-0.5 text-[11.5px] text-zinc-500">
            {TABS.find((t) => t.id === tab)?.description}
          </p>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center text-[12px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="font-medium">Coming in VW6 / VW7</p>
            <p className="mt-1.5 text-[11px] leading-relaxed">
              The shell + preview pipeline is wired (VW5). Playlist editing and module forms land in
              VW6; branding / header / settings / versions / publish in VW7.
            </p>
          </div>

          {tab === 'settings' && (
            <div className="mt-4 space-y-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-zinc-500">
                Read-only summary
              </h3>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
                <dt className="text-zinc-500">Slug</dt>
                <dd className="font-mono text-zinc-800 dark:text-zinc-200">{wallSlug}</dd>
                <dt className="text-zinc-500">Name</dt>
                <dd className="text-zinc-800 dark:text-zinc-200">{wallName}</dd>
                <dt className="text-zinc-500">Grid</dt>
                <dd className="font-mono text-zinc-800 dark:text-zinc-200">{grid}</dd>
                <dt className="text-zinc-500">Cells</dt>
                <dd className="font-mono text-zinc-800 dark:text-zinc-200">
                  {cols} × {rows} = {cols * rows}
                </dd>
                <dt className="text-zinc-500">Canvas</dt>
                <dd className="font-mono text-zinc-800 dark:text-zinc-200">
                  {cols * 1920} × {rows * 1080}
                </dd>
              </dl>
            </div>
          )}
        </div>
      </section>

      {/* Preview */}
      <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
        <PreviewFrame wallSlug={wallSlug} clientSlug={useClientSlugFromUrl()} grid={grid} />
      </main>
    </div>
  );
}

/** Hack barato para evitar prop-drilling del clientSlug por toda la prop chain.
 *  Lee el slug del path (`/studio/{slug}/video-walls/{wallSlug}`). */
function useClientSlugFromUrl(): string {
  if (typeof window === 'undefined') return '';
  const parts = window.location.pathname.split('/').filter(Boolean);
  // Esperado: ['studio', '{slug}', 'video-walls', '{wallSlug}']
  return parts[1] ?? '';
}
