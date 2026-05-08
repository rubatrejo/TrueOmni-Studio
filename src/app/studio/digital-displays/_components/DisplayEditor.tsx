'use client';

import {
  CalendarDays,
  History,
  Languages,
  LayoutPanelTop,
  ListVideo,
  Newspaper,
  Palette,
  Send,
  Share2,
  SlidersHorizontal,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type {
  SignageClientResolved,
  SignageDisplayConfig,
} from '@/lib/signage/schema';

import { useDisplayEditStore } from '../_lib/display-edit-store';
import { saveDisplay, useDebouncedAutosave } from '../_lib/save-display';
import { saveTheme } from '../_lib/save-theme';
import { SignageEditorProvider } from '../_lib/signage-editor-context';
import { useThemeEditStore } from '../_lib/theme-edit-store';
import { useSignageBridge } from '../_lib/use-signage-bridge';

import { DisplaySettingsPanel } from './display/DisplaySettingsPanel';
import { KvSizeAdvisor } from './display/KvSizeAdvisor';
import { PlaylistPanel } from './display/PlaylistPanel';
import { PublishToolbar } from './display/PublishToolbar';
import { VersionsPanel } from './display/VersionsPanel';
import { SignagePreviewPanel } from './shell/SignagePreviewPanel';
import {
  SignageSidebarTabs,
  type SignageSection,
} from './shell/SignageSidebarTabs';
import { SignageTopBar } from './shell/SignageTopBar';
import { BrandingTab } from './tabs/BrandingTab';
import { EventsTab } from './tabs/EventsTab';
import { HeaderTab } from './tabs/HeaderTab';
import { I18nTab } from './tabs/I18nTab';
import { NewsTab } from './tabs/NewsTab';
import { SocialTab } from './tabs/SocialTab';

/**
 * `<DisplayEditor>` — Editor del signage display con shell pattern.
 *
 * Mismo lenguaje visual que el `<ThemeEditor>`:
 *  - `<SignageTopBar>` con breadcrumb hasta el display.
 *  - `<SignageSidebarTabs>` con 4 secciones (Settings · Playlist · Versions · Publish).
 *  - Editor panel 400-480px con el panel del tab activo.
 *  - `<SignagePreviewPanel>` flex-1, 1920×1080 escalado, full screen.
 *  - SaveBar al pie del editor.
 *  - `<KvSizeAdvisor>` se muestra inline en cada tab cuando el payload se
 *    acerca al cap.
 */
type DisplaySectionKey =
  | 'branding'
  | 'header'
  | 'settings'
  | 'playlist'
  | 'events'
  | 'social'
  | 'news'
  | 'i18n'
  | 'versions'
  | 'publish';

const DISPLAY_SECTIONS: ReadonlyArray<SignageSection<DisplaySectionKey>> = [
  {
    key: 'branding',
    label: 'Branding',
    title: 'Brand colors, logos, fonts',
    icon: Palette,
  },
  {
    key: 'header',
    label: 'Header',
    title: 'Header position, weather, clock',
    icon: LayoutPanelTop,
  },
  {
    key: 'settings',
    label: 'Settings',
    title: 'Audio, sleep, transitions',
    icon: SlidersHorizontal,
  },
  {
    key: 'playlist',
    label: 'Playlist',
    title: 'Slides + scheduling',
    icon: ListVideo,
  },
  {
    key: 'events',
    label: 'Events',
    title: 'Events shown on the display',
    icon: CalendarDays,
  },
  {
    key: 'social',
    label: 'Social',
    title: 'Social posts and featured tweet',
    icon: Share2,
  },
  {
    key: 'news',
    label: 'News',
    title: 'News source and items',
    icon: Newspaper,
  },
  {
    key: 'i18n',
    label: 'Languages',
    title: 'i18n bag editor',
    icon: Languages,
  },
  {
    key: 'versions',
    label: 'Versions',
    title: 'Display snapshots & restore',
    icon: History,
  },
  {
    key: 'publish',
    label: 'Publish',
    title: 'Open PR with this display',
    icon: Send,
  },
];

export interface DisplayEditorProps {
  client: SignageClientResolved;
  display: SignageDisplayConfig;
  tokensCss: string;
}

export function DisplayEditor({ client, display, tokensCss }: DisplayEditorProps) {
  const init = useDisplayEditStore((s) => s.init);
  const draft = useDisplayEditStore((s) => s.draft);
  const dirty = useDisplayEditStore((s) => s.dirty);
  const saving = useDisplayEditStore((s) => s.saving);
  const lastSavedAt = useDisplayEditStore((s) => s.lastSavedAt);
  const error = useDisplayEditStore((s) => s.error);
  const markSaving = useDisplayEditStore((s) => s.markSaving);
  const markSaved = useDisplayEditStore((s) => s.markSaved);
  const setError = useDisplayEditStore((s) => s.setError);

  // Theme draft (branding/header) — compartido entre displays del mismo client.
  const initTheme = useThemeEditStore((s) => s.init);
  const themeDraft = useThemeEditStore((s) => s.draft);
  const themeDirty = useThemeEditStore((s) => s.dirty);

  const [activeTab, setActiveTab] = useState<DisplaySectionKey>('branding');
  const [previewKey, setPreviewKey] = useState(0);

  const bridge = useSignageBridge();

  // Init draft display.
  useEffect(() => {
    init(display);
    return () => {
      useDisplayEditStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display.slug, client.slug]);

  // Init draft theme (branding/header).
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
      displays: client.displays,
    });
    return () => {
      useThemeEditStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.slug]);

  // Push display al iframe (debounce 120ms en hook).
  // Dep: solo `draft` — `bridge.pushDisplay` es estable (useCallback []).
  useEffect(() => {
    if (!draft) return;
    bridge.pushDisplay(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Push theme branding/header al iframe.
  // Dep: solo `themeDraft` — `bridge.pushClient` es estable (useCallback []).
  useEffect(() => {
    if (!themeDraft) return;
    bridge.pushClient({
      branding: themeDraft.branding,
      header: themeDraft.header,
      name: themeDraft.name,
      website: themeDraft.website,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeDraft]);

  // Autosave display 1s después del último cambio.
  const onAutosave = useCallback(async () => {
    const current = useDisplayEditStore.getState().draft;
    if (!current) return;
    markSaving(true);
    const result = await saveDisplay(client.slug, current);
    if (result.ok) {
      markSaved();
    } else {
      setError(result.error ?? 'Save failed');
    }
  }, [client.slug, markSaving, markSaved, setError]);

  // Autosave theme 1s después del último cambio en branding/header.
  const onThemeAutosave = useCallback(async () => {
    const current = useThemeEditStore.getState().draft;
    if (!current) return;
    const result = await saveTheme(current);
    if (result.ok) {
      useThemeEditStore.getState().markSaved();
    } else {
      useThemeEditStore.getState().setError(result.error ?? 'Save failed');
    }
  }, []);

  useDebouncedAutosave(draft, dirty, onAutosave, 1000);
  useDebouncedAutosave(themeDraft, themeDirty, onThemeAutosave, 1000);

  if (!draft) {
    return null;
  }

  const saveState: 'idle' | 'saving' | 'saved' | 'error' = error
    ? 'error'
    : saving
      ? 'saving'
      : dirty
        ? 'idle'
        : lastSavedAt
          ? 'saved'
          : 'idle';

  const previewHref = `/signage/${client.slug}/${draft.slug}`;

  const handleSave = () => {
    void onAutosave();
  };

  const handleDiscard = () => {
    init(display);
    setPreviewKey((k) => k + 1);
  };

  return (
    <SignageEditorProvider
      clientSlug={client.slug}
      jumpToSlide={bridge.jumpToSlide}
      navSlide={bridge.navSlide}
      activeSlideId={bridge.activeSlide?.slideId ?? null}
    >
      <div className="studio-shell flex h-screen w-full flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <SignageTopBar
          slug={`${client.slug} / ${draft.slug}`}
          nombre={`${client.name} · ${draft.name}`}
          saveState={saveState}
          isDirty={dirty}
          previewHref={previewHref}
          onPublish={() => setActiveTab('publish')}
        />

        <div className="flex flex-1 overflow-hidden">
          <SignageSidebarTabs<DisplaySectionKey>
            sections={DISPLAY_SECTIONS}
            ariaLabel="Display editor sections"
            activeKey={activeTab}
            onSelect={setActiveTab}
            bridgeStatus={bridge.bridgeStatus}
            onReloadPreview={() => setPreviewKey((k) => k + 1)}
          />

          <main className="flex flex-1 overflow-hidden">
            {/* Editor panel */}
            <div className="flex w-full shrink-0 flex-col overflow-hidden border-r border-zinc-200 dark:border-zinc-900 lg:w-[400px] xl:w-[480px]">
              <div
                key={activeTab}
                className="studio-tab-fade flex min-h-0 flex-1 flex-col overflow-y-auto"
              >
                <div className="flex flex-1 flex-col gap-4 px-6 py-6">
                  {activeTab === 'branding' ? (
                    <BrandingTab client={client} tokensCss={tokensCss} />
                  ) : null}
                  {activeTab === 'header' ? <HeaderTab client={client} /> : null}
                  {activeTab === 'settings' ? <DisplaySettingsPanel /> : null}
                  {activeTab === 'playlist' ? <PlaylistPanel /> : null}
                  {activeTab === 'events' ? (
                    <EventsTab
                      clientSlug={client.slug}
                      initialEvents={client.events}
                    />
                  ) : null}
                  {activeTab === 'social' ? (
                    <SocialTab
                      clientSlug={client.slug}
                      initialSocial={client.social}
                    />
                  ) : null}
                  {activeTab === 'news' ? (
                    <NewsTab
                      clientSlug={client.slug}
                      initialNews={client.news}
                    />
                  ) : null}
                  {activeTab === 'i18n' ? (
                    <I18nTab
                      clientSlug={client.slug}
                      defaultLocale={client.locale}
                    />
                  ) : null}
                  {activeTab === 'versions' ? (
                    <VersionsPanel
                      clientSlug={client.slug}
                      displaySlug={draft.slug}
                      refreshTrigger={lastSavedAt}
                    />
                  ) : null}
                  {activeTab === 'publish' ? (
                    <PublishToolbar
                      clientSlug={client.slug}
                      displaySlug={draft.slug}
                    />
                  ) : null}
                  <KvSizeAdvisor
                    clientSlug={client.slug}
                    displaySlug={draft.slug}
                    refreshTrigger={lastSavedAt}
                  />
                </div>
              </div>
              <DisplaySaveBar
                saveState={saveState}
                isDirty={dirty}
                onSave={handleSave}
                onDiscard={handleDiscard}
              />
            </div>

            {/* Preview live, fullscreen-style */}
            <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden">
              <SignagePreviewPanel
                clientSlug={client.slug}
                displaySlug={draft.slug}
                displayName={draft.name}
                reloadKey={previewKey}
                iframeRef={bridge.iframeRef}
                onIframeLoad={bridge.onIframeLoad}
                onReload={() => setPreviewKey((k) => k + 1)}
                activeSlide={bridge.activeSlide}
                onNavSlide={bridge.navSlide}
              />
            </div>
          </main>
        </div>

        <p className="sr-only" aria-live="polite">
          {saveState === 'saving'
            ? 'Saving changes'
            : saveState === 'saved' && !dirty
              ? 'All changes saved'
              : dirty
                ? 'You have unsaved changes'
                : ''}
        </p>
      </div>
    </SignageEditorProvider>
  );
}

function DisplaySaveBar({
  saveState,
  isDirty,
  onSave,
  onDiscard,
}: {
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  isDirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-t border-zinc-200 bg-white px-4 dark:border-zinc-900 dark:bg-zinc-950">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onDiscard}
          disabled={!isDirty}
          className="grid h-8 w-8 place-items-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          aria-label="Discard changes"
          title="Discard unsaved changes"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3 7v6h6" />
            <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
          </svg>
        </button>
        <span className="ml-2 text-[11px] text-zinc-400 dark:text-zinc-600">
          {isDirty ? 'Unsaved changes' : 'No pending changes'}
        </span>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saveState === 'saving' || !isDirty}
        className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:disabled:hover:bg-white"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        {saveState === 'saving'
          ? 'Saving…'
          : saveState === 'saved' && !isDirty
            ? 'Saved'
            : 'Save'}
      </button>
    </div>
  );
}
