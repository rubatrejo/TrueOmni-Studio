'use client';

import { Download, ExternalLink, Send, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

/**
 * `<PublishToolbar>` — DSS7. Botones para Export JSON / Import JSON / Publish
 * via PR.
 *
 * Export: simple `<a download>` apunta al endpoint GET.
 * Import: `<input type="file">` lee el JSON y POST al endpoint.
 * Publish: POST al endpoint que crea PR. Modal muestra el resultado (PR URL).
 */
export interface PublishToolbarProps {
  clientSlug: string;
  displaySlug: string;
}

interface PublishResult {
  prUrl?: string;
  prNumber?: number;
  branch?: string;
}

export function PublishToolbar({ clientSlug, displaySlug }: PublishToolbarProps) {
  const [busy, setBusy] = useState<'import' | 'publish' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportHref = `/api/studio/signage/displays/${encodeURIComponent(clientSlug)}/${encodeURIComponent(displaySlug)}/export`;

  async function handleImportFile(file: File) {
    setBusy('import');
    setError(null);
    setSuccess(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const res = await fetch(
        `/api/studio/signage/displays/${encodeURIComponent(clientSlug)}/${encodeURIComponent(displaySlug)}/import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display: parsed }),
        },
      );
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `HTTP ${res.status}`);
      }
      setSuccess('Imported · reloading…');
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handlePublish() {
    if (!confirm('Publish current display state to GitHub via PR?')) return;
    setBusy('publish');
    setError(null);
    setSuccess(null);
    setPublishResult(null);
    try {
      const res = await fetch(
        `/api/studio/signage/displays/${encodeURIComponent(clientSlug)}/${encodeURIComponent(displaySlug)}/publish`,
        { method: 'POST' },
      );
      const json = (await res.json().catch(() => ({}))) as PublishResult & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setPublishResult(json);
      setSuccess('Published');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-4">
        <h3 className="font-display text-[14px] font-semibold text-zinc-900 dark:text-white">
          Export · Import · Publish
        </h3>
        <p className="mt-0.5 text-[11.5px] text-zinc-500">
          Backup local o publica al repo via PR auto-merge
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <a
          href={exportHref}
          download
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
          title="Download display.json"
        >
          <Download className="h-3 w-3" strokeWidth={2} />
          Export JSON
        </a>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
          title="Upload display.json to KV"
        >
          <Upload className="h-3 w-3" strokeWidth={2} />
          {busy === 'import' ? 'Importing…' : 'Import JSON'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImportFile(f);
            e.target.value = ''; // permitir re-upload del mismo file
          }}
        />

        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          title="Publish current state via GitHub PR"
        >
          <Send className="h-3 w-3" strokeWidth={2.5} />
          {busy === 'publish' ? 'Publishing…' : 'Publish'}
        </button>
      </div>

      {error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-[11.5px] text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {success && !error ? (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          {success}
        </p>
      ) : null}

      {publishResult?.prUrl ? (
        <a
          href={publishResult.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-sky-600 transition hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          PR #{publishResult.prNumber} ↗
          <ExternalLink className="h-3 w-3" strokeWidth={2} />
        </a>
      ) : null}
    </section>
  );
}
