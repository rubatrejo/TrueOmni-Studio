'use client';

import { Camera, ChevronDown, ChevronRight, History, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  createSnapshot,
  listSnapshots,
  restoreSnapshot,
  type SnapshotListEntry,
} from '../../_lib/snapshots-api';

/**
 * `<VersionsPanel>` — Lista de snapshots del display + restore (DSS6).
 *
 * Card collapsible debajo del PlaylistPanel. Carga la lista al mount + cada
 * vez que `lastSavedAt` cambie (nuevo save → nuevo snapshot del previo).
 * Click en "Restore" pide confirmación inline; on confirm llama API y
 * recarga la página para que el editor lea el nuevo current.
 */
export interface VersionsPanelProps {
  clientSlug: string;
  displaySlug: string;
  /** Cuando cambia, refresca la lista (cada save crea un snapshot del previo). */
  refreshTrigger?: number | null;
}

export function VersionsPanel({ clientSlug, displaySlug, refreshTrigger }: VersionsPanelProps) {
  const [open, setOpen] = useState(true);
  const [snapshots, setSnapshots] = useState<SnapshotListEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listSnapshots(clientSlug, displaySlug);
      setSnapshots(list);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [clientSlug, displaySlug]);

  useEffect(() => {
    void load();
  }, [load, refreshTrigger]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    const result = await createSnapshot(clientSlug, displaySlug, note.trim() || undefined);
    setCreating(false);
    if (!result.ok) {
      setError(result.error ?? 'Snapshot failed');
      return;
    }
    setNote('');
    void load();
  }

  async function handleRestore(id: string) {
    setRestoring(true);
    const result = await restoreSnapshot(clientSlug, displaySlug, id);
    setRestoring(false);
    setConfirmId(null);
    if (!result.ok) {
      setError(result.error ?? 'Restore failed');
      return;
    }
    // Recarga la página para que el editor lea el current restaurado del KV.
    window.location.reload();
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2} />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2} />
          )}
          <History className="h-4 w-4 text-zinc-500" strokeWidth={1.75} />
          <h3 className="font-display text-[14px] font-semibold text-zinc-900 dark:text-white">
            Versions
          </h3>
          <span className="text-[11.5px] text-zinc-500">
            {loading ? '…' : `${snapshots.length}/10`}
          </span>
        </button>
      </header>

      {open ? (
        <>
          {/* Checkpoint manual — input de nota + botón Snapshot */}
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[11.5px] text-zinc-800 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              maxLength={80}
              disabled={creating}
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Camera className="h-3 w-3" strokeWidth={2.5} />
              {creating ? 'Saving…' : 'Snapshot'}
            </button>
          </div>

          {error ? (
            <div className="mb-2 rounded-md bg-red-50 px-3 py-2 text-[11.5px] text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </div>
          ) : null}

          {snapshots.length === 0 && !loading ? (
            <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center text-[11.5px] italic text-zinc-400 dark:border-zinc-800">
              No versions yet — every save creates a snapshot of the previous state.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {snapshots.map((s) => (
                <SnapshotRow
                  key={s.id}
                  snapshot={s}
                  isConfirming={confirmId === s.id}
                  isRestoring={restoring && confirmId === s.id}
                  onRequestRestore={() => setConfirmId(s.id)}
                  onCancelRestore={() => setConfirmId(null)}
                  onConfirmRestore={() => void handleRestore(s.id)}
                />
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  );
}

function SnapshotRow({
  snapshot,
  isConfirming,
  isRestoring,
  onRequestRestore,
  onCancelRestore,
  onConfirmRestore,
}: {
  snapshot: SnapshotListEntry;
  isConfirming: boolean;
  isRestoring: boolean;
  onRequestRestore: () => void;
  onCancelRestore: () => void;
  onConfirmRestore: () => void;
}) {
  const dateLabel = formatTimestamp(snapshot.meta.ts);
  return (
    <li className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
            {dateLabel}
          </span>
          {snapshot.meta.note ? (
            <span className="text-[10.5px] italic text-zinc-500">{snapshot.meta.note}</span>
          ) : null}
        </div>
        {!isConfirming ? (
          <button
            type="button"
            onClick={onRequestRestore}
            title="Restore this version"
            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10.5px] font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2} />
            Restore
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onCancelRestore}
              disabled={isRestoring}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10.5px] font-medium text-zinc-600 transition hover:border-zinc-300 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmRestore}
              disabled={isRestoring}
              className="rounded-md bg-amber-600 px-2 py-1 text-[10.5px] font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
            >
              {isRestoring ? 'Restoring…' : 'Confirm'}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
