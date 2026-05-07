'use client';

import { History, ListVideo, Send, SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type {
  SignageClientResolved,
  SignageDisplayConfig,
} from '@/lib/signage/schema';

import { useDisplayEditStore } from '../_lib/display-edit-store';
import { saveDisplay, useDebouncedAutosave } from '../_lib/save-display';
import { SignageEditorProvider } from '../_lib/signage-editor-context';
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
type DisplaySectionKey = 'settings' | 'playlist' | 'versions' | 'publish';

const DISPLAY_SECTIONS: ReadonlyArray<SignageSection<DisplaySectionKey>> = [
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
}

export function DisplayEditor({ client, display }: DisplayEditorProps) {
  const init = useDisplayEditStore((s) => s.init);
  const draft = useDisplayEditStore((s) => s.draft);
  const dirty = useDisplayEditStore((s) => s.dirty);
  const saving = useDisplayEditStore((s) => s.saving);
  const lastSavedAt = useDisplayEditStore((s) => s.lastSavedAt);
  const error = useDisplayEditStore((s) => s.error);
  const markSaving = useDisplayEditStore((s) => s.markSaving);
  const markSaved = useDisplayEditStore((s) => s.markSaved);
  const setError = useDisplayEditStore((s) => s.setError);

  const [activeTab, setActiveTab] = useState<DisplaySectionKey>('playlist');
  const [previewKey, setPreviewKey] = useState(0);

  const bridge = useSignageBridge();

  // Inicializa el draft con el display recibido del server. Solo cuando
  // cambia el slug del display (navegación) reseteamos.
  useEffect(() => {
    init(display);
    return () => {
      useDisplayEditStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display.slug, client.slug]);

  // Push live al iframe en cada cambio del draft (debounce 120ms en hook).
  useEffect(() => {
    if (!draft) return;
    bridge.pushDisplay(draft);
  }, [draft, bridge]);

  // Autosave 1s después del último cambio.
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

  useDebouncedAutosave(draft, dirty, onAutosave, 1000);

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
    <SignageEditorProvider clientSlug={client.slug}>
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
                  {activeTab === 'settings' ? <DisplaySettingsPanel /> : null}
                  {activeTab === 'playlist' ? <PlaylistPanel /> : null}
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
