'use client';

import { Database } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * `<KvSizeAdvisor>` — Bar de uso KV por display (DSS7).
 *
 * Refresca tras cada save (`refreshTrigger=lastSavedAt`). Color del bar:
 *  - verde <60%
 *  - amber 60-85%
 *  - red >85%
 */
export interface KvSizeAdvisorProps {
  clientSlug: string;
  displaySlug: string;
  refreshTrigger?: number | null;
}

interface SizeData {
  display: number;
  snapshots: number;
  total: number;
  cap: number;
}

export function KvSizeAdvisor({
  clientSlug,
  displaySlug,
  refreshTrigger,
}: KvSizeAdvisorProps) {
  const [size, setSize] = useState<SizeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/studio/signage/displays/${encodeURIComponent(clientSlug)}/${encodeURIComponent(displaySlug)}/size`,
          { cache: 'no-store' },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as SizeData;
        if (!cancelled) {
          setSize(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [clientSlug, displaySlug, refreshTrigger]);

  if (error) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-[11.5px] text-red-600 dark:text-red-400">
          KV size error: {error}
        </p>
      </section>
    );
  }

  if (!size) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-[11.5px] italic text-zinc-400">Loading KV usage…</p>
      </section>
    );
  }

  const pct = size.cap > 0 ? Math.min(100, (size.total / size.cap) * 100) : 0;
  const barColor =
    pct < 60 ? 'bg-emerald-500' : pct < 85 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.75} />
          <h3 className="font-display text-[13px] font-semibold text-zinc-900 dark:text-white">
            KV usage
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          {fmtBytes(size.total)} / {fmtBytes(size.cap)}
        </span>
      </header>

      <div
        className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-[10.5px] font-mono text-zinc-500">
        display: {fmtBytes(size.display)} · snapshots: {fmtBytes(size.snapshots)}
      </p>
    </section>
  );
}

function fmtBytes(n: number): string {
  if (n < 1000) return `${n}B`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}KB`;
  return `${(n / 1_000_000).toFixed(2)}MB`;
}
