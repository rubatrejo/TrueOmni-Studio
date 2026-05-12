'use client';

import {
  CalendarDays,
  Image as ImageIcon,
  Layers,
  LayoutPanelTop,
  Newspaper,
  Palette,
  Send,
  Settings as SettingsIcon,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  SignageSidebarTabs,
  type SignageSection,
} from '@/app/studio/digital-displays/_components/shell/SignageSidebarTabs';
import type { SignageBridgeStatus } from '@/app/studio/digital-displays/_lib/use-signage-bridge';
import { GRID_CONFIGS, type GridConfig } from '@/lib/video-walls/dimensions';
import type { VideoWallConfig } from '@/lib/video-walls/schema';

import { PlaylistPanel } from './PlaylistPanel';
import { SettingsPanel } from './SettingsPanel';
import { WallPreviewPanel } from './WallPreviewPanel';
import { WallTopBar } from './WallTopBar';

/**
 * <WallEditorShell> — shell del editor de Video Walls.
 *
 * Misma estructura visual que el DisplayEditor (Digital Displays):
 *   - WallTopBar (clone visual de SignageTopBar con breadcrumb propio)
 *   - SignageSidebarTabs reusado literal del DD (genérico, acepta sections)
 *   - WallPreviewPanel (clone visual de SignagePreviewPanel adaptado a
 *     grid + crop por celda en lugar de orientation)
 *
 * Branding/Header tabs linkan a la Vista de Cliente (la edición de
 * branding es client-scoped y syncea con kiosks/signage automáticamente
 * via loadUnifiedBranding). Settings y Playlist son wall-scoped.
 */
export interface WallEditorShellProps {
  clientSlug: string;
  clientName: string;
  wallSlug: string;
  wallName: string;
  grid: GridConfig;
  initialWall: VideoWallConfig;
}

type TabKey =
  | 'branding'
  | 'header'
  | 'settings'
  | 'playlist'
  | 'events'
  | 'social'
  | 'news'
  | 'versions'
  | 'publish';

const SECTIONS: readonly SignageSection<TabKey>[] = [
  { key: 'branding', label: 'Branding', title: 'Brand colors, logos, fonts', icon: Palette },
  {
    key: 'header',
    label: 'Header',
    title: 'Header position, weather, clock',
    icon: LayoutPanelTop,
  },
  {
    key: 'settings',
    label: 'Settings',
    title: 'Wall settings (duration, transition, audio, sleep)',
    icon: SettingsIcon,
  },
  { key: 'playlist', label: 'Playlist', title: 'Slides and templates', icon: Layers },
  { key: 'events', label: 'Events', title: 'Events shown in event slots', icon: CalendarDays },
  { key: 'social', label: 'Social', title: 'Social posts and featured tweet', icon: Share2 },
  { key: 'news', label: 'News', title: 'News source and items', icon: Newspaper },
  { key: 'versions', label: 'Versions', title: 'Snapshots and restore', icon: ImageIcon },
  { key: 'publish', label: 'Publish', title: 'Promote KV draft', icon: Send },
];

export function WallEditorShell({
  clientSlug,
  clientName,
  wallSlug,
  wallName,
  grid,
  initialWall,
}: WallEditorShellProps) {
  const [tab, setTab] = useState<TabKey>('playlist');
  const [wall, setWall] = useState<VideoWallConfig>(initialWall);
  const [previewKey, setPreviewKey] = useState(0);
  // Bridge live editor↔iframe queda como sub-fase futura. Por ahora
  // bumpamos previewKey al guardar para forzar reload del iframe.
  const handleWallChange = (next: VideoWallConfig) => {
    setWall(next);
    setPreviewKey((k) => k + 1);
  };
  const bridgeStatus: SignageBridgeStatus = 'connected';
  const { cols, rows } = GRID_CONFIGS[grid];
  const previewHref = `/video-walls/${clientSlug}/${wallSlug}`;

  return (
    <div className="studio-shell flex h-screen w-full flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <WallTopBar
        slug={`${clientSlug} / ${wallSlug}`}
        clientSlug={clientSlug}
        clientName={clientName}
        wallName={wallName}
        saveState="saved"
        isDirty={false}
        previewHref={previewHref}
      />

      <div className="flex flex-1 overflow-hidden">
        <SignageSidebarTabs<TabKey>
          sections={SECTIONS}
          ariaLabel="Wall editor sections"
          activeKey={tab}
          onSelect={setTab}
          bridgeStatus={bridgeStatus}
          onReloadPreview={() => setPreviewKey((k) => k + 1)}
        />

        <main className="flex flex-1 overflow-hidden">
          <div className="flex w-full shrink-0 flex-col overflow-hidden border-r border-zinc-200 dark:border-zinc-900 lg:w-[400px] xl:w-[480px]">
            <div key={tab} className="studio-tab-fade flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="flex flex-1 flex-col gap-4 px-6 py-6">
                {tab === 'playlist' && (
                  <PlaylistPanel
                    clientSlug={clientSlug}
                    wall={wall}
                    onWallChange={handleWallChange}
                  />
                )}
                {tab === 'settings' && (
                  <SettingsPanel
                    clientSlug={clientSlug}
                    wall={wall}
                    onWallChange={handleWallChange}
                  />
                )}
                {tab === 'branding' && (
                  <ClientScopedNotice
                    clientSlug={clientSlug}
                    clientName={clientName}
                    title="Branding is client-scoped"
                    description="Logos, brand colors and fonts live on the client manifest and sync with every product (Kiosks, Digital Displays, Video Walls). Edit them from the client view so the changes propagate everywhere."
                  />
                )}
                {tab === 'header' && (
                  <ClientScopedNotice
                    clientSlug={clientSlug}
                    clientName={clientName}
                    title="Header is client-scoped"
                    description="Header position, weather placement, clock format, forecast days. Same configuration applies to Digital Displays and Video Walls of this client."
                  />
                )}
                {tab === 'events' && (
                  <ClientScopedNotice
                    clientSlug={clientSlug}
                    clientName={clientName}
                    productSegment="digital-displays"
                    title="Events are shared with Digital Displays"
                    description="Events shown in event-slot templates come from the client's events.json. Edit them in the Digital Displays editor (Events tab) — they apply to both products."
                  />
                )}
                {tab === 'social' && (
                  <ClientScopedNotice
                    clientSlug={clientSlug}
                    clientName={clientName}
                    productSegment="digital-displays"
                    title="Social posts are shared with Digital Displays"
                    description="Posts and featured tweet come from the client's social.json. Edit them in the Digital Displays editor (Social tab)."
                  />
                )}
                {tab === 'news' && (
                  <ClientScopedNotice
                    clientSlug={clientSlug}
                    clientName={clientName}
                    productSegment="digital-displays"
                    title="News source is shared with Digital Displays"
                    description="News configuration comes from the client's news.json. Edit it in the Digital Displays editor (News tab)."
                  />
                )}
                {tab === 'versions' && (
                  <SectionStub
                    title="Versions"
                    description="Snapshots history and restore — wires into the same KV snapshot pattern as signage. Sub-phase VW9.5."
                  />
                )}
                {tab === 'publish' && <PublishPanel clientSlug={clientSlug} wallSlug={wallSlug} />}
                <WallSummary
                  wallSlug={wallSlug}
                  wallName={wallName}
                  grid={grid}
                  cols={cols}
                  rows={rows}
                />
              </div>
            </div>
          </div>

          <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden">
            <WallPreviewPanel
              clientSlug={clientSlug}
              wallSlug={wallSlug}
              wallName={wallName}
              grid={grid}
              reloadKey={previewKey}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function ClientScopedNotice({
  clientSlug,
  clientName,
  productSegment,
  title,
  description,
}: {
  clientSlug: string;
  clientName: string;
  productSegment?: string;
  title: string;
  description: string;
}) {
  const href = productSegment ? `/studio/${clientSlug}/${productSegment}` : `/studio/${clientSlug}`;
  const linkLabel = productSegment
    ? `→ Open ${productSegment.replace('-', ' ')} editor`
    : `→ Edit on ${clientName}'s client view`;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-sky-600 dark:text-sky-400"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

function SectionStub({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-5 text-[12.5px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
      <h3 className="font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <p className="mt-2 leading-relaxed">{description}</p>
    </div>
  );
}

function WallSummary({
  wallSlug,
  wallName,
  grid,
  cols,
  rows,
}: {
  wallSlug: string;
  wallName: string;
  grid: GridConfig;
  cols: number;
  rows: number;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-zinc-500">
        Wall summary
      </h3>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
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
  );
}

function PublishPanel({ clientSlug, wallSlug }: { clientSlug: string; wallSlug: string }) {
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
        runtimeUrl?: string;
        error?: string;
      } | null;
      if (!res.ok || !body?.ok) {
        setResult({ ok: false, message: body?.error ?? `HTTP ${res.status}` });
      } else {
        setResult({
          ok: true,
          message: body.runtimeUrl ? `Published. Runtime: ${body.runtimeUrl}` : 'Published',
        });
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Publish failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-white">Publish wall</h3>
      <p className="mt-2 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        Confirms the wall config in KV. The runtime reads from KV first so production picks up
        changes immediately. GitHub PR sync follows the signage publish pattern (sub-phase VW9.5).
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
  );
}
