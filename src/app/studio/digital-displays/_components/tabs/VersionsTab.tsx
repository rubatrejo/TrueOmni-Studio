'use client';

import { History, Loader2, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SnapshotMeta {
  ts: number;
  savedBy?: string;
  note?: string;
}

interface SnapshotEntry {
  id: string;
  meta: SnapshotMeta;
}

/**
 * Tab `Versions` — snapshots theme-level del client signage.
 *
 * Cada save del client crea snapshot del previo (FIFO cap 10). Restaurar
 * sobrescribe el current y crea snapshot del current pre-restore (patrón
 * git-like, reversible).
 */
export interface VersionsTabProps {
  clientSlug: string;
}

export function VersionsTab({ clientSlug }: VersionsTabProps) {
  const [snapshots, setSnapshots] = useState<SnapshotEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/studio/signage/clients/${encodeURIComponent(clientSlug)}/snapshots`,
        { cache: 'no-store' },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { snapshots: SnapshotEntry[] };
      setSnapshots(data.snapshots ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [clientSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRestore = useCallback(
    async (id: string) => {
      setRestoringId(id);
      setError(null);
      try {
        const res = await fetch(
          `/api/studio/signage/clients/${encodeURIComponent(clientSlug)}/snapshots/${encodeURIComponent(id)}/restore`,
          { method: 'POST' },
        );
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `HTTP ${res.status}`);
        }
        // Reload para que el SSR re-popule el draft con el snapshot restaurado.
        window.location.reload();
      } catch (e) {
        setError((e as Error).message);
        setRestoringId(null);
      }
    },
    [clientSlug],
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
            Versions
          </h2>
          <p className="mt-1 text-[13px] text-zinc-500">
            Cada save crea snapshot del estado previo. Cap 10. Restore es
            reversible.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
        >
          <RotateCcw
            className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`}
            strokeWidth={2}
          />
          Refresh
        </button>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-[12px] text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {loading && !snapshots ? (
        <div className="flex items-center gap-2 text-[12.5px] text-zinc-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading snapshots…
        </div>
      ) : snapshots && snapshots.length === 0 ? (
        <EmptyState />
      ) : snapshots ? (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-900">
          {snapshots.map((entry) => {
            const date = new Date(entry.meta.ts);
            const isRestoring = restoringId === entry.id;
            const isConfirming = confirmId === entry.id;
            return (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 py-3 text-[12.5px]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">
                      {date.toLocaleString()}
                    </span>
                    {entry.meta.savedBy ? (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10.5px] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500">
                        {entry.meta.savedBy}
                      </span>
                    ) : null}
                  </div>
                  {entry.meta.note ? (
                    <p className="mt-0.5 truncate text-[11.5px] text-zinc-500">
                      {entry.meta.note}
                    </p>
                  ) : null}
                </div>
                {isConfirming ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={() => void handleRestore(entry.id)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-2.5 py-1 text-[11.5px] font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
                    >
                      {isRestoring ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Restoring…
                        </>
                      ) : (
                        <>
                          <History className="h-3 w-3" />
                          Confirm restore
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(entry.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <RotateCcw className="h-3 w-3" strokeWidth={2} />
                    Restore
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-zinc-500 shadow-sm dark:bg-zinc-900 dark:text-zinc-400">
        <History className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <p className="max-w-xs text-[12.5px] text-zinc-500">
        Sin snapshots todavía. Cada save genera uno automáticamente.
      </p>
    </div>
  );
}
