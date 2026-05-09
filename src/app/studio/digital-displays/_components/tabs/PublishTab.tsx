'use client';

import { ExternalLink, Send } from 'lucide-react';
import { useState } from 'react';

/**
 * Tab `Publish` — DSS7.5.
 *
 * Theme publish: convierte la working copy del KV en commit a
 * `clients-signage/<slug>/{client.json, i18n/<locale>.json}` vía GitHub PR
 * con auto-merge. Reusa el endpoint
 * `POST /api/studio/signage/clients/<slug>/publish` (DSS7.5 step A).
 *
 * El publish del display vive aparte (en `<PublishToolbar>` dentro del display
 * editor). Cuando el editor de paleta/tokens aterrice se incorporará
 * `tokens.css` en este flujo. Assets binarios se moverán al sub-fase de
 * Vercel Blob.
 */
export interface PublishTabProps {
  clientSlug: string;
}

interface PublishResult {
  prUrl?: string;
  prNumber?: number;
  branch?: string;
  filesPublished?: number;
}

export function PublishTab({ clientSlug }: PublishTabProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PublishResult | null>(null);

  async function handlePublish() {
    if (!confirm(`Publish theme "${clientSlug}" to GitHub via PR?`)) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/studio/signage/clients/${encodeURIComponent(clientSlug)}/publish`,
        { method: 'POST' },
      );
      const json = (await res.json().catch(() => ({}))) as PublishResult & {
        error?: string;
      };
      if (!res.ok) {
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
    <div className="flex flex-col gap-6">
      <header>
        <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
          Publish theme
        </h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-500">
          Convierte la working copy del KV en commit a{' '}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11.5px] dark:bg-zinc-800">
            clients-signage/{clientSlug}/
          </code>{' '}
          vía GitHub PR con auto-merge.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h4 className="text-[12.5px] font-semibold uppercase tracking-wider text-zinc-500">
          Qué se publica
        </h4>
        <ul className="mt-2 space-y-1.5 text-[12.5px] text-zinc-700 dark:text-zinc-300">
          <li className="flex gap-2">
            <span className="text-zinc-400">·</span>
            <code className="font-mono text-[11.5px]">client.json</code>
            <span className="text-zinc-500">— branding · header · displays · location</span>
          </li>
          <li className="flex gap-2">
            <span className="text-zinc-400">·</span>
            <code className="font-mono text-[11.5px]">i18n/&lt;locale&gt;.json</code>
            <span className="text-zinc-500">— bag mergeado fs+KV por cada locale</span>
          </li>
        </ul>
        <p className="mt-3 text-[11.5px] text-zinc-500">
          <code className="font-mono text-[10.5px]">tokens.css</code> y assets binarios quedan fuera
          por ahora (sin editor en el Studio aún).
        </p>
      </section>

      <div>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Send className="h-4 w-4" strokeWidth={2.25} />
          {busy ? 'Publishing…' : 'Publish theme'}
        </button>
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {result?.prUrl ? (
        <div className="flex flex-col gap-1.5 rounded-md bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <span className="font-semibold">
            Published {result.filesPublished ?? 0} file
            {result.filesPublished === 1 ? '' : 's'}.
          </span>
          <a
            href={result.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-sky-600 transition hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            PR #{result.prNumber} ↗
            <ExternalLink className="h-3 w-3" strokeWidth={2} />
          </a>
        </div>
      ) : null}
    </div>
  );
}
