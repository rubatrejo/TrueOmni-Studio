'use client';

import { useCallback, useEffect, useState } from 'react';

import type { SignageDisplayListEntry } from '@/lib/signage/config';
import type { SignageClientResolved } from '@/lib/signage/schema';

import { useDebouncedAutosave } from '../_lib/save-display';
import { saveTheme } from '../_lib/save-theme';
import { SignageEditorProvider } from '../_lib/signage-editor-context';
import { useThemeEditStore } from '../_lib/theme-edit-store';
import { useSignageBridge } from '../_lib/use-signage-bridge';

import { SignagePreviewPanel } from './shell/SignagePreviewPanel';
import {
  SignageSidebarTabs,
  type SignageSectionKey,
} from './shell/SignageSidebarTabs';
import { SignageTopBar } from './shell/SignageTopBar';
import { SignageOnboardingTour } from './SignageOnboardingTour';
import { BrandingTab } from './tabs/BrandingTab';
import { DisplaysTab } from './tabs/DisplaysTab';
import { HeaderTab } from './tabs/HeaderTab';
import { I18nTab } from './tabs/I18nTab';
import { PublishTab } from './tabs/PublishTab';
import { VersionsTab } from './tabs/VersionsTab';

/**
 * `<ThemeEditor>` — Editor del signage theme con shell pattern.
 *
 * Mismo lenguaje visual que el editor del kiosk (`Shell.tsx`):
 *  - `<SignageTopBar>` arriba (h-14, sticky).
 *  - 3 paneles: `<SignageSidebarTabs>` | EditorPanel | `<SignagePreviewPanel>`.
 *  - `<SignageSaveBar>` al pie del editor.
 *  - `studio-shell` class activa el lock de scroll global del Studio.
 *
 * El bridge `useSignageBridge` sigue al iframe del primer display y empuja
 * `pushClient(...)` con debounce 120ms en cada cambio del draft. El runtime
 * tiene `<SignageBridgeStyleApplier>` que aplica los token overrides al
 * `:root` para preview live sin reload.
 */
export interface ThemeEditorProps {
  client: SignageClientResolved;
  displays: SignageDisplayListEntry[];
  tokensCss: string;
}

export function ThemeEditor({ client, displays, tokensCss }: ThemeEditorProps) {
  const [activeTab, setActiveTab] = useState<SignageSectionKey>('branding');
  const [previewKey, setPreviewKey] = useState(0);
  const firstDisplay = displays[0];
  const previewHref = firstDisplay
    ? `/signage/${client.slug}/${firstDisplay.slug}`
    : null;

  const bridge = useSignageBridge();

  const init = useThemeEditStore((s) => s.init);
  const draft = useThemeEditStore((s) => s.draft);
  const dirty = useThemeEditStore((s) => s.dirty);
  const saving = useThemeEditStore((s) => s.saving);
  const lastSavedAt = useThemeEditStore((s) => s.lastSavedAt);
  const error = useThemeEditStore((s) => s.error);
  const markSaving = useThemeEditStore((s) => s.markSaving);
  const markSaved = useThemeEditStore((s) => s.markSaved);
  const setError = useThemeEditStore((s) => s.setError);

  // Init draft con el client recibido del server (file shape, sin events/social/news).
  useEffect(() => {
    init({
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

  // Push live al iframe en cada cambio del draft (debounce 120ms en hook).
  useEffect(() => {
    if (!draft) return;
    bridge.pushClient({
      branding: draft.branding,
      header: draft.header,
      name: draft.name,
      website: draft.website,
    });
  }, [draft, bridge]);

  // Autosave 1s después del último cambio.
  const onAutosave = useCallback(async () => {
    const current = useThemeEditStore.getState().draft;
    if (!current) return;
    markSaving(true);
    const result = await saveTheme(current);
    if (result.ok) {
      markSaved();
      // Cambios estructurales del header (position, height, layout, visibility,
      // clockFormat, weatherUnits, forecastDays) requieren re-render server.
      // Los token overrides ya se aplican live via SignageBridgeStyleApplier;
      // refrescar el iframe los reaplica desde KV sin pérdida visual perceptible.
      setPreviewKey((k) => k + 1);
    } else {
      setError(result.error ?? 'Save failed');
    }
  }, [markSaving, markSaved, setError]);

  useDebouncedAutosave(draft, dirty, onAutosave);

  const saveState: 'idle' | 'saving' | 'saved' | 'error' = error
    ? 'error'
    : saving
      ? 'saving'
      : dirty
        ? 'idle'
        : lastSavedAt
          ? 'saved'
          : 'idle';

  const handleSave = useCallback(() => {
    void onAutosave();
  }, [onAutosave]);

  const handleDiscard = useCallback(() => {
    init({
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
    setPreviewKey((k) => k + 1);
  }, [client, init]);

  return (
    <SignageEditorProvider clientSlug={client.slug}>
    <div className="studio-shell flex h-screen w-full flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <SignageTopBar
        slug={client.slug}
        nombre={client.name}
        saveState={saveState}
        isDirty={dirty}
        previewHref={previewHref}
        onPublish={() => setActiveTab('publish')}
      />

      <div className="flex flex-1 overflow-hidden">
        <SignageSidebarTabs
          activeKey={activeTab}
          onSelect={setActiveTab}
          bridgeStatus={bridge.bridgeStatus}
          onReloadPreview={() => setPreviewKey((k) => k + 1)}
        />

        <main className="flex flex-1 overflow-hidden">
          {/* Editor panel — 400-480px en lg+ */}
          <div className="flex w-full shrink-0 flex-col overflow-hidden border-r border-zinc-200 dark:border-zinc-900 lg:w-[400px] xl:w-[480px]">
            <div
              key={activeTab}
              className="studio-tab-fade flex min-h-0 flex-1 flex-col overflow-y-auto"
            >
              <div className="flex flex-1 flex-col gap-6 px-6 py-6">
                {activeTab === 'branding' ? (
                  <BrandingTab client={client} tokensCss={tokensCss} />
                ) : null}
                {activeTab === 'header' ? <HeaderTab client={client} /> : null}
                {activeTab === 'displays' ? (
                  <DisplaysTab clientSlug={client.slug} displays={displays} />
                ) : null}
                {activeTab === 'i18n' ? (
                  <I18nTab clientSlug={client.slug} defaultLocale={client.locale} />
                ) : null}
                {activeTab === 'versions' ? (
                  <VersionsTab clientSlug={client.slug} />
                ) : null}
                {activeTab === 'publish' ? (
                  <PublishTab clientSlug={client.slug} />
                ) : null}
              </div>
            </div>
            <SignageSaveBar
              saveState={saveState}
              isDirty={dirty}
              onSave={handleSave}
              onDiscard={handleDiscard}
            />
          </div>

          {/* Preview — flex-1, ocupa el resto del viewport */}
          <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden">
            <SignagePreviewPanel
              clientSlug={client.slug}
              displaySlug={firstDisplay?.slug ?? null}
              displayName={firstDisplay?.name ?? null}
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
      <SignageOnboardingTour />
    </div>
    </SignageEditorProvider>
  );
}

function SignageSaveBar({
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
          <DiscardGlyph />
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
        <SaveGlyph />
        {saveState === 'saving'
          ? 'Saving…'
          : saveState === 'saved' && !isDirty
            ? 'Saved'
            : 'Save'}
      </button>
    </div>
  );
}

function SaveGlyph() {
  return (
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
  );
}

function DiscardGlyph() {
  return (
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
  );
}
