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
import { useCallback, useEffect, useState } from 'react';

import {
  SignageSidebarTabs,
  type SignageSection,
} from '@/app/studio/digital-displays/_components/shell/SignageSidebarTabs';
import { SignageTopBar } from '@/app/studio/digital-displays/_components/shell/SignageTopBar';
import { BrandingTab } from '@/app/studio/digital-displays/_components/tabs/BrandingTab';
import { EventsTab } from '@/app/studio/digital-displays/_components/tabs/EventsTab';
import { HeaderTab } from '@/app/studio/digital-displays/_components/tabs/HeaderTab';
import { NewsTab } from '@/app/studio/digital-displays/_components/tabs/NewsTab';
import { SocialTab } from '@/app/studio/digital-displays/_components/tabs/SocialTab';
import { useDebouncedAutosave } from '@/app/studio/digital-displays/_lib/save-display';
import { saveTheme } from '@/app/studio/digital-displays/_lib/save-theme';
import { SignageEditorProvider } from '@/app/studio/digital-displays/_lib/signage-editor-context';
import { useThemeEditStore } from '@/app/studio/digital-displays/_lib/theme-edit-store';
import type { SignageBridgeStatus } from '@/app/studio/digital-displays/_lib/use-signage-bridge';
import type { SignageClientResolved } from '@/lib/signage/schema';
import { GRID_CONFIGS, type GridConfig } from '@/lib/video-walls/dimensions';
import type { VideoWallConfig } from '@/lib/video-walls/schema';

import { PlaylistPanel } from './PlaylistPanel';
import { SettingsPanel } from './SettingsPanel';
import { WallPreviewPanel } from './WallPreviewPanel';

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
  /** Cliente resuelto del KV/fs (incluye branding/header/events/social/news). */
  client: SignageClientResolved;
  tokensCss: string;
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
  client,
  tokensCss,
  wallSlug,
  wallName,
  grid,
  initialWall,
}: WallEditorShellProps) {
  const [tab, setTab] = useState<TabKey>('branding');
  const [wall, setWall] = useState<VideoWallConfig>(initialWall);
  const [previewKey, setPreviewKey] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Theme store (branding/header) compartido con Digital Displays — la data
  // del cliente vive en `signage:client:{slug}` KV y syncea entre productos.
  // Mismo patrón de save que DisplayEditor: `useDebouncedAutosave(trigger,
  // dirty, onSave, 1000)`. Sin botón Save manual — el SaveStatusPill del
  // SignageTopBar refleja el estado (Saving/Saved/Unsaved/Error).
  const initTheme = useThemeEditStore((s) => s.init);
  const themeDraft = useThemeEditStore((s) => s.draft);
  const themeDirty = useThemeEditStore((s) => s.dirty);
  const themeSaving = useThemeEditStore((s) => s.saving);
  const themeError = useThemeEditStore((s) => s.error);

  useEffect(() => {
    initTheme({
      slug: client.slug,
      name: client.name,
      locale: client.locale,
      timezone: client.timezone,
      location: client.location,
      website: client.website,
      branding: client.branding,
      header: client.header,
      displays: [],
    });
    return () => {
      useThemeEditStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.slug]);

  const onThemeAutosave = useCallback(async () => {
    const cur = useThemeEditStore.getState().draft;
    if (!cur) return;
    useThemeEditStore.getState().markSaving(true);
    const result = await saveTheme(cur);
    if (result.ok) {
      useThemeEditStore.getState().markSaved();
      setPreviewKey((k) => k + 1);
    } else {
      useThemeEditStore.getState().setError(result.error ?? 'Save failed');
    }
  }, []);
  useDebouncedAutosave(themeDraft, themeDirty, onThemeAutosave, 1000);

  // Reload iframe cuando los tabs (events/social/news/theme) guardan al KV.
  // Emiten `signage-content-saved` / `signage-theme-saved` via save-content
  // / save-theme. Filtramos por clientSlug del wall actual.
  useEffect(() => {
    function onSaved(e: Event) {
      const detail = (e as CustomEvent<{ clientSlug?: string }>).detail;
      if (!detail || detail.clientSlug === clientSlug) {
        setPreviewKey((k) => k + 1);
      }
    }
    window.addEventListener('signage-content-saved', onSaved);
    window.addEventListener('signage-theme-saved', onSaved);
    return () => {
      window.removeEventListener('signage-content-saved', onSaved);
      window.removeEventListener('signage-theme-saved', onSaved);
    };
  }, [clientSlug]);

  // Bridge live editor↔iframe queda como sub-fase futura. Por ahora
  // bumpamos previewKey al guardar para forzar reload del iframe.
  const handleWallChange = (next: VideoWallConfig) => {
    setWall(next);
    setPreviewKey((k) => k + 1);
    // Clamp slide index si la playlist se acortó.
    if (currentSlideIndex >= next.playlist.length) {
      setCurrentSlideIndex(Math.max(0, next.playlist.length - 1));
    }
  };

  const activeSlideId = wall.playlist[currentSlideIndex]?.id ?? null;
  const handleSelectSlide = (slideId: string) => {
    const idx = wall.playlist.findIndex((s) => s.id === slideId);
    if (idx >= 0) setCurrentSlideIndex(idx);
  };
  const handleNavSlide = (direction: 'prev' | 'next') => {
    if (wall.playlist.length === 0) return;
    setCurrentSlideIndex((i) => {
      const next = direction === 'next' ? i + 1 : i - 1;
      // Wrap-around.
      if (next < 0) return wall.playlist.length - 1;
      if (next >= wall.playlist.length) return 0;
      return next;
    });
  };

  const bridgeStatus: SignageBridgeStatus = 'connected';
  const { cols, rows } = GRID_CONFIGS[grid];
  const previewHref = `/video-walls/${clientSlug}/${wallSlug}`;

  return (
    <SignageEditorProvider clientSlug={clientSlug}>
      <div className="studio-shell flex h-screen w-full flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <SignageTopBar
          slug={`${clientSlug} / ${wallSlug}`}
          clientSlug={clientSlug}
          nombre={wallName}
          saveState={themeError ? 'error' : themeSaving ? 'saving' : themeDirty ? 'idle' : 'saved'}
          isDirty={themeDirty}
          previewHref={previewHref}
          productLabel="Video Walls"
          productHref={`/studio/${clientSlug}/video-walls`}
          clientLabel={clientName}
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
              <div
                key={tab}
                className="studio-tab-fade flex min-h-0 flex-1 flex-col overflow-y-auto"
              >
                <div className="flex flex-1 flex-col gap-4 px-6 py-6">
                  {tab === 'playlist' && (
                    <PlaylistPanel
                      clientSlug={clientSlug}
                      wall={wall}
                      onWallChange={handleWallChange}
                      activeSlideId={activeSlideId}
                      onSelectSlide={handleSelectSlide}
                    />
                  )}
                  {tab === 'settings' && (
                    <SettingsPanel
                      clientSlug={clientSlug}
                      wall={wall}
                      onWallChange={handleWallChange}
                    />
                  )}
                  {tab === 'branding' && <BrandingTab client={client} tokensCss={tokensCss} />}
                  {tab === 'header' && <HeaderTab client={client} />}
                  {tab === 'events' && (
                    <EventsTab clientSlug={clientSlug} initialEvents={client.events ?? []} />
                  )}
                  {tab === 'social' && (
                    <SocialTab
                      clientSlug={clientSlug}
                      initialSocial={client.social ?? { posts: [] }}
                    />
                  )}
                  {tab === 'news' && (
                    <NewsTab
                      clientSlug={clientSlug}
                      initialNews={
                        client.news ?? {
                          source: { kind: 'manual', items: [] },
                          rotationIntervalSec: 8,
                        }
                      }
                    />
                  )}
                  {tab === 'versions' && (
                    <SectionStub
                      title="Versions"
                      description="Snapshots history and restore — wires into the same KV snapshot pattern as signage. Sub-phase VW9.5."
                    />
                  )}
                  {tab === 'publish' && (
                    <PublishPanel clientSlug={clientSlug} wallSlug={wallSlug} />
                  )}
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
                slides={wall.playlist}
                currentSlideIndex={currentSlideIndex}
                onNavSlide={handleNavSlide}
              />
            </div>
          </main>
        </div>
      </div>
    </SignageEditorProvider>
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
