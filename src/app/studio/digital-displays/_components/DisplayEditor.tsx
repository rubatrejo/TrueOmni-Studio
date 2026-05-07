'use client';

import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect } from 'react';

import type {
  SignageClientResolved,
  SignageDisplayConfig,
} from '@/lib/signage/schema';

import { StudioPageHeader } from '../../_components/PageHeader';
import { useDisplayEditStore } from '../_lib/display-edit-store';
import { saveDisplay, useDebouncedAutosave } from '../_lib/save-display';
import { useSignageBridge } from '../_lib/use-signage-bridge';

import { DisplaySettingsPanel } from './display/DisplaySettingsPanel';
import { PlaylistPanel } from './display/PlaylistPanel';
import { PreviewFrame } from './display/PreviewFrame';

/**
 * `<DisplayEditor>` — Editor del signage display (DSS4).
 *
 * Orquesta:
 *  - Working copy zustand del display draft (`useDisplayEditStore`).
 *  - Bridge editor↔iframe (`useSignageBridge`) — push live al iframe en
 *    cada change con debounce 120ms.
 *  - Autosave 1s después del último cambio (`useDebouncedAutosave` →
 *    `saveDisplay` → PUT al KV).
 *  - Dirty/Saving/Saved indicator en el header del editor.
 *
 * El runtime YA recibe `signage:display-update` desde DSS3 y popula su
 * store. La aplicación visual de los overrides en runtime aterriza en DSS5.
 * Por ahora el preview-iframe refleja los cambios tras el save al KV (la
 * próxima carga del runtime los leerá del KV).
 */
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

  const bridge = useSignageBridge();

  // Inicializa el draft con el display recibido del server. Solo cuando
  // cambia el slug del display (navegación) reseteamos.
  useEffect(() => {
    init(display);
    // Reset al desmontar para que la próxima visita parta limpio.
    return () => {
      useDisplayEditStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display.slug, client.slug]);

  // Push live al iframe en cada cambio del draft (debounce 120ms ya en hook).
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

  return (
    <main className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 pb-24 pt-12 sm:px-8">
      <StudioPageHeader />

      {/* Breadcrumb */}
      <Link
        href={`/studio/digital-displays/${client.slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        {client.name}
      </Link>

      {/* Hero */}
      <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
            Display
          </p>
          <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            {draft.name}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
            <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[12px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {draft.slug}
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span>
              {draft.playlist.length} slide{draft.playlist.length === 1 ? '' : 's'}
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span>{draft.settings.targetResolution}</span>
          </p>
        </div>
        <SaveStatusBadge
          dirty={dirty}
          saving={saving}
          lastSavedAt={lastSavedAt}
          error={error}
        />
      </section>

      {/* Layout 2-col: sidebar + preview */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        <div className="flex flex-col gap-4">
          <DisplaySettingsPanel />
          <PlaylistPanel />
        </div>
        <PreviewFrame
          clientSlug={client.slug}
          displaySlug={draft.slug}
          displayName={draft.name}
          iframeRef={bridge.iframeRef}
          onIframeLoad={bridge.onIframeLoad}
          bridgeStatus={bridge.bridgeStatus}
        />
      </section>

      <footer className="mt-24 flex items-center justify-between border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-900 dark:text-zinc-600">
        <span>© 2026 TrueOmni · Digital Displays · Studio v0.1</span>
        <span>Local · main</span>
      </footer>
    </main>
  );
}

function SaveStatusBadge({
  dirty,
  saving,
  lastSavedAt,
  error,
}: {
  dirty: boolean;
  saving: boolean;
  lastSavedAt: number | null;
  error: string | null;
}) {
  if (error) {
    return (
      <span
        title={error}
        className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Save error
      </span>
    );
  }
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />
        Saving…
      </span>
    );
  }
  if (dirty) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Unsaved changes
      </span>
    );
  }
  if (lastSavedAt !== null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Saved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-[12px] font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
      Synced
    </span>
  );
}
