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
import type { SignageContentSavedDetail } from '@/app/studio/digital-displays/_lib/save-content';
import { useDebouncedAutosave } from '@/app/studio/digital-displays/_lib/save-display';
import { saveTheme } from '@/app/studio/digital-displays/_lib/save-theme';
import { SignageEditorProvider } from '@/app/studio/digital-displays/_lib/signage-editor-context';
import { useThemeEditStore } from '@/app/studio/digital-displays/_lib/theme-edit-store';
import type { SignageClientResolved } from '@/lib/signage/schema';
import { useVideoWallBridge } from '@/lib/video-walls/bridge';
import { GRID_CONFIGS, type GridConfig } from '@/lib/video-walls/dimensions';
import type { VideoWallConfig } from '@/lib/video-walls/schema';

import { PlaylistPanel } from './PlaylistPanel';
import { PublishToolbar } from './PublishToolbar';
import { SettingsPanel } from './SettingsPanel';
import { VersionsPanel } from './VersionsPanel';
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
  grid: _grid,
  initialWall,
}: WallEditorShellProps) {
  const [tab, setTab] = useState<TabKey>('branding');
  const [wall, setWall] = useState<VideoWallConfig>(initialWall);
  const [previewKey, setPreviewKey] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [versionsRefreshAt, setVersionsRefreshAt] = useState<number | null>(null);

  // Bridge live editor↔iframe — postMessage al runtime con cada cambio en
  // lugar de reload del iframe. Drástica mejora de UX (sin flicker 500ms
  // por cada autosave). El runtime hace merge no-destructivo entre el patch
  // del bridge y la prop server.
  const {
    iframeRef,
    pushClient,
    pushWall,
    pushEvents,
    pushSocial,
    pushNews,
    onIframeLoad,
    bridgeStatus,
  } = useVideoWallBridge();

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
      // Bridge live: push del client al iframe sin reload. Si el bridge no
      // está conectado el push no daña; el listener de `signage-theme-saved`
      // de abajo cae al previewKey bump como fallback defensivo.
      pushClient({
        branding: cur.branding,
        header: cur.header,
        locale: cur.locale,
        timezone: cur.timezone,
        location: cur.location,
      });
    } else {
      useThemeEditStore.getState().setError(result.error ?? 'Save failed');
    }
  }, [pushClient]);
  useDebouncedAutosave(themeDraft, themeDirty, onThemeAutosave, 1000);

  // Listener legacy `signage-theme-saved` — fallback defensivo si el bridge
  // está caído (status `lost`). Con bridge conectado, el `pushClient` del
  // autosave ya propagó la data sin reload; el bump del previewKey haría
  // flicker innecesario, así que lo skipeamos.
  useEffect(() => {
    function onThemeSaved(e: Event) {
      const detail = (e as CustomEvent<{ clientSlug?: string }>).detail;
      if (detail && detail.clientSlug !== clientSlug) return;
      if (bridgeStatus === 'connected') return; // bridge ya propagó
      setPreviewKey((k) => k + 1);
    }
    window.addEventListener('signage-theme-saved', onThemeSaved);
    return () => window.removeEventListener('signage-theme-saved', onThemeSaved);
  }, [clientSlug, bridgeStatus]);

  // Listener `signage-content-saved` — los Tabs DD (Events/Social/News) lo
  // emiten tras un PUT exitoso al KV. Si el bridge está vivo, propagamos el
  // payload por postMessage al iframe (sin reload). Si está `lost`, caemos a
  // bumpear `previewKey` para forzar reload como fallback. Backwards-compat:
  // el listener acepta el detail viejo (sin payload) y el nuevo.
  useEffect(() => {
    function onContentSaved(e: Event) {
      const detail = (e as CustomEvent<SignageContentSavedDetail>).detail;
      if (!detail || detail.clientSlug !== clientSlug) return;

      const bridgeAlive = bridgeStatus === 'connected' || bridgeStatus === 'connecting';
      if (bridgeAlive) {
        if (detail.kind === 'events' && detail.events) {
          pushEvents(detail.events);
          return;
        }
        if (detail.kind === 'social' && detail.social) {
          pushSocial(detail.social);
          return;
        }
        if (detail.kind === 'news' && detail.news) {
          pushNews(detail.news);
          return;
        }
      }
      // Fallback: sin payload en el detail o bridge perdido — recargar
      // iframe para que el runtime relea desde el KV via server props.
      setPreviewKey((k) => k + 1);
    }
    window.addEventListener('signage-content-saved', onContentSaved);
    return () => window.removeEventListener('signage-content-saved', onContentSaved);
  }, [clientSlug, bridgeStatus, pushEvents, pushSocial, pushNews]);

  // Bridge live editor↔iframe — el host empuja el wall completo al iframe
  // con cada cambio. El runtime hace merge no-destructivo (ver
  // VideoWallRuntime). Sin reload del iframe — sin FOUC.
  const handleWallChange = (next: VideoWallConfig) => {
    setWall(next);
    pushWall(next);
    // Bump del trigger de Versions: cada save vale como punto restaurable
    // potencial (el operador puede crear un snapshot inmediatamente).
    setVersionsRefreshAt(Date.now());
    // Clamp slide index si la playlist se acortó.
    if (currentSlideIndex >= next.playlist.length) {
      setCurrentSlideIndex(Math.max(0, next.playlist.length - 1));
    }
  };

  // Cambia el grid del wall completo. Los templates están vinculados al grid
  // actual (e.g. `01-full-events` solo existe para 3x2), así que al cambiar
  // de grid se vacían playlists. Confirm explícito si hay slides existentes.
  const handleGridChange = useCallback(
    async (nextGrid: GridConfig) => {
      if (nextGrid === wall.grid) return;
      const totalSlides =
        (wall.playlists ?? []).reduce((sum, p) => sum + p.slides.length, 0) || wall.playlist.length;
      if (totalSlides > 0) {
        const ok = window.confirm(
          `Switching to ${nextGrid} will remove all ${totalSlides} slide${
            totalSlides === 1 ? '' : 's'
          } (templates are specific to the current grid). Continue?`,
        );
        if (!ok) return;
      }
      const nextWall: VideoWallConfig = {
        ...wall,
        grid: nextGrid,
        playlist: [],
        playlists: [{ id: 'main', name: 'Main', slides: [] }],
        activePlaylistId: 'main',
      };
      try {
        const res = await fetch(`/api/studio/video-walls/walls/${clientSlug}/${wall.slug}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ wall: nextWall }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        setWall(nextWall);
        pushWall(nextWall);
        setCurrentSlideIndex(0);
        setVersionsRefreshAt(Date.now());
        // Bump preview key — cambiar el grid cambia el viewport del iframe;
        // mejor hacer reload duro para que el runtime recalcule layouts en
        // lugar de depender del merge no-destructivo del bridge.
        setPreviewKey((k) => k + 1);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[video-walls] grid change failed', err);
        window.alert(
          `Failed to change grid: ${err instanceof Error ? err.message : 'unknown error'}`,
        );
      }
    },
    [wall, clientSlug, pushWall],
  );

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

  // Empuja el estado inicial del wall/client al iframe en cuanto el bridge
  // monta — el editor puede tener el preview cargado antes del primer
  // autosave y queremos que el iframe vea exactamente lo que el operador
  // tiene en pantalla. Incluimos events/social/news para que los slots de
  // contenido se rendericen con la versión del cliente actual aunque el
  // operador nunca toque esos tabs.
  useEffect(() => {
    pushWall(wall);
    if (client.events) pushEvents(client.events);
    if (client.social) pushSocial(client.social);
    if (client.news) pushNews(client.news);
    // Solo en mount: handleWallChange / listeners de save empujan cambios.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `wall.grid` es el estado vivo del editor (cambiable via onGridChange).
  // La prop `grid` del shell es solo el valor inicial del server.
  const currentGrid = wall.grid;
  const { cols, rows } = GRID_CONFIGS[currentGrid];
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
                    <VersionsPanel
                      clientSlug={clientSlug}
                      wallSlug={wallSlug}
                      refreshTrigger={versionsRefreshAt}
                    />
                  )}
                  {tab === 'publish' && (
                    <PublishToolbar clientSlug={clientSlug} wallSlug={wallSlug} />
                  )}
                  <WallSummary
                    wallSlug={wallSlug}
                    wallName={wallName}
                    grid={currentGrid}
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
                grid={currentGrid}
                reloadKey={previewKey}
                slides={wall.playlist}
                currentSlideIndex={currentSlideIndex}
                onNavSlide={handleNavSlide}
                iframeRef={iframeRef}
                onIframeLoad={onIframeLoad}
                onGridChange={handleGridChange}
              />
            </div>
          </main>
        </div>
      </div>
    </SignageEditorProvider>
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
