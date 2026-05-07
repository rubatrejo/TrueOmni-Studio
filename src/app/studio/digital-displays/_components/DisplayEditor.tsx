'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import type {
  SignageClientResolved,
  SignageDisplayConfig,
} from '@/lib/signage/schema';

import { StudioPageHeader } from '../../_components/PageHeader';
import { useSignageBridge } from '../_lib/use-signage-bridge';

import { DisplaySettingsPanel } from './display/DisplaySettingsPanel';
import { PlaylistPanel } from './display/PlaylistPanel';
import { PreviewFrame } from './display/PreviewFrame';

/**
 * `<DisplayEditor>` — Editor del signage display (DSS2).
 *
 * Layout 2-col `[420px_1fr]` (mobile: stack):
 *  - Sidebar izquierda: settings + playlist read-only.
 *  - Derecha: preview iframe live del runtime.
 *
 * Read-only en DSS2. Edición de settings + drag-to-reorder de playlist
 * aterriza en DSS4. Bridge bidireccional editor↔iframe vía postMessage + KV
 * en DSS3.
 */
export interface DisplayEditorProps {
  client: SignageClientResolved;
  display: SignageDisplayConfig;
}

export function DisplayEditor({ client, display }: DisplayEditorProps) {
  const bridge = useSignageBridge();
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
      <section className="mb-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
          Display
        </p>
        <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
          {display.name}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
          <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[12px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {display.slug}
          </span>
          <span className="text-zinc-400 dark:text-zinc-600">·</span>
          <span>
            {display.playlist.length} slide{display.playlist.length === 1 ? '' : 's'}
          </span>
          <span className="text-zinc-400 dark:text-zinc-600">·</span>
          <span>{display.settings.targetResolution}</span>
        </p>
      </section>

      {/* Read-only banner */}
      <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <p className="font-semibold">Editor read-only en DSS2</p>
        <p className="mt-1 text-amber-800 dark:text-amber-300/90">
          El sidebar muestra settings y playlist tal como viven en{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[12px] dark:bg-amber-500/20">
            displays/{display.slug}/display.json
          </code>
          . Edición + drag-to-reorder llegan en DSS4. Bridge bidireccional
          editor↔preview en DSS3.
        </p>
      </section>

      {/* Layout 2-col: sidebar + preview */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        <div className="flex flex-col gap-4">
          <DisplaySettingsPanel settings={display.settings} />
          <PlaylistPanel
            playlist={display.playlist}
            defaultTransition={display.settings.defaultTransition}
          />
        </div>
        <PreviewFrame
          clientSlug={client.slug}
          displaySlug={display.slug}
          displayName={display.name}
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
