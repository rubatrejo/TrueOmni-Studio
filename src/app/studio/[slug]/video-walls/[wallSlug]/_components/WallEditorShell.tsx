'use client';

import { Image, Layers, Palette, Send, Settings } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { GRID_CONFIGS, type GridConfig } from '@/lib/video-walls/dimensions';
import type { VideoWallConfig } from '@/lib/video-walls/schema';

import { PlaylistPanel } from './PlaylistPanel';
import { PreviewFrame } from './PreviewFrame';
import { SettingsPanel } from './SettingsPanel';

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
  initialWall: VideoWallConfig;
}

type TabId = 'playlist' | 'branding' | 'settings' | 'versions' | 'publish';

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
  {
    id: 'publish',
    label: 'Publish',
    icon: Send,
    description: 'Promote KV draft to the filesystem via GitHub PR.',
  },
];

export function WallEditorShell({
  clientSlug,
  clientName,
  wallSlug,
  wallName,
  grid,
  initialWall,
}: WallEditorShellProps) {
  const [tab, setTab] = useState<TabId>('playlist');
  const [wall, setWall] = useState<VideoWallConfig>(initialWall);
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
        <div className="flex flex-1 flex-col overflow-hidden">
          {tab === 'playlist' && (
            <PlaylistPanel clientSlug={clientSlug} wall={wall} onWallChange={setWall} />
          )}
          {tab === 'settings' && (
            <SettingsPanel clientSlug={clientSlug} wall={wall} onWallChange={setWall} />
          )}
          {tab === 'branding' && (
            <div className="space-y-4 overflow-auto p-4 text-[12px]">
              <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-zinc-500">
                  Branding is client-scoped
                </h3>
                <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Logos, brand colors and fonts live on the client manifest and sync with every
                  product (Kiosks, Digital Displays, Video Walls). Edit them from the client view so
                  the changes propagate everywhere at once.
                </p>
                <Link
                  href={`/studio/${clientSlug}`}
                  className="mt-3 inline-flex items-center gap-1 text-sky-600 dark:text-sky-400"
                >
                  → Edit branding for {clientName}
                </Link>
              </div>
            </div>
          )}
          {tab === 'versions' && (
            <div className="space-y-4 overflow-auto p-4 text-[12px]">
              <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
                Snapshots history and restore — wires into the same KV snapshot pattern used by
                signage. Pending sub-phase VW9.5.
              </div>
            </div>
          )}
          {tab === 'publish' && <PublishStubPanel clientSlug={clientSlug} wallSlug={wallSlug} />}

          {tab !== 'playlist' && tab !== 'settings' && tab !== 'branding' && (
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
        <PreviewFrame
          wallSlug={wallSlug}
          clientSlug={clientSlug}
          grid={grid}
          reloadKey={JSON.stringify(wall)}
        />
      </main>
    </div>
  );
}

function PublishStubPanel({ clientSlug, wallSlug }: { clientSlug: string; wallSlug: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handlePublish = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch(`/api/studio/video-walls/walls/${clientSlug}/${wallSlug}/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        prUrl?: string;
        error?: string;
      } | null;
      if (!res.ok || !body?.ok) {
        setResult({ ok: false, message: body?.error ?? `HTTP ${res.status}` });
      } else {
        setResult({
          ok: true,
          message: body?.prUrl ? `PR created: ${body.prUrl}` : 'Published successfully',
        });
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Publish failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 overflow-auto p-4 text-[12px]">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-zinc-500">
          Publish wall to filesystem
        </h3>
        <p className="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-400">
          Creates a PR on GitHub with the wall config JSON. The runtime hardware reads from the
          filesystem (after merge) or from KV (live edit). Publishing locks the current draft as the
          deployed version.
        </p>
        <button
          type="button"
          onClick={handlePublish}
          disabled={submitting}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {submitting ? 'Publishing…' : 'Publish wall'}
        </button>
        {result && (
          <div
            className={`mt-3 rounded-md p-2.5 text-[11.5px] ${
              result.ok
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200'
                : 'border border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200'
            }`}
          >
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
