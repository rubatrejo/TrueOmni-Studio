'use client';

import { ExternalLink, Send } from 'lucide-react';
import { useState } from 'react';

/**
 * `<PublishToolbar>` — Botón Publish para el wall + status del PR.
 *
 * POST a `/api/studio/video-walls/walls/[client]/[wall]/publish`. Si la API
 * tiene STUDIO_GITHUB_TOKEN/OWNER/REPO setados, crea PR con auto-merge y
 * devuelve `prUrl + prNumber + branch`. Si falta, opera en modo `kv-only`
 * (re-persiste el KV) y muestra el aviso.
 *
 * Paridad con `digital-displays/_components/display/PublishToolbar` pero sin
 * Export/Import (no implementados aún para Video Walls — VW10+).
 */
export interface PublishToolbarProps {
  clientSlug: string;
  wallSlug: string;
}

interface PublishResult {
  ok?: boolean;
  mode?: 'pr' | 'kv-only';
  prUrl?: string;
  prNumber?: number;
  branch?: string;
  runtimeUrl?: string;
  autoMergeEnabled?: boolean;
  note?: string;
  error?: string;
}

export function PublishToolbar({ clientSlug, wallSlug }: PublishToolbarProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PublishResult | null>(null);

  async function handlePublish() {
    if (!confirm('Publish current wall state? (Creates a GitHub PR if configured)')) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/studio/video-walls/walls/${encodeURIComponent(clientSlug)}/${encodeURIComponent(wallSlug)}/publish`,
        { method: 'POST' },
      );
      const json = (await res.json().catch(() => ({}))) as PublishResult;
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setResult(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-4">
        <h3 className="font-display text-[14px] font-semibold text-zinc-900 dark:text-white">
          Publish
        </h3>
        <p className="mt-0.5 text-[11.5px] text-zinc-500">
          Confirms wall in KV and opens a GitHub PR with{' '}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10.5px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            clients-walls/{clientSlug}/walls/{wallSlug}/wall.json
          </code>{' '}
          (auto-merge when CI is green).
        </p>
      </header>

      <button
        type="button"
        onClick={() => void handlePublish()}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <Send className="h-3 w-3" strokeWidth={2.5} />
        {busy ? 'Publishing…' : 'Publish wall'}
      </button>

      {error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-[11.5px] text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {result?.ok ? (
        <div className="mt-3 space-y-2">
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            {result.mode === 'pr'
              ? `PR opened${result.autoMergeEnabled ? ' (auto-merge enabled)' : ''}.`
              : (result.note ?? 'Published to KV.')}
          </p>
          {result.prUrl ? (
            <a
              href={result.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-sky-600 transition hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
            >
              PR #{result.prNumber} ↗
              <ExternalLink className="h-3 w-3" strokeWidth={2} />
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
