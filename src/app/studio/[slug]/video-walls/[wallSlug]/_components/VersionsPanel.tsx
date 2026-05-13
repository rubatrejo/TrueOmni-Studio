'use client';

import { Camera, History, RotateCcw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  createWallSnapshot,
  deleteWallSnapshot,
  listWallSnapshots,
  restoreWallSnapshot,
  type VideoWallSnapshotListEntry,
} from './snapshots-api';

/**
 * `<VersionsPanel>` — Lista de snapshots del wall + crear / restaurar /
 * eliminar. Paridad con `digital-displays/_components/display/VersionsPanel`.
 *
 * Crear snapshot: POST a /snapshots con `note` opcional (input inline).
 * Restore: confirma inline → POST y reload (el editor relee el wall del KV).
 * Delete: confirma inline → DELETE y refresca la lista.
 */
export interface VersionsPanelProps {
  clientSlug: string;
  wallSlug: string;
  /** Cuando cambia, refresca la lista (cada save de wall debería bumpearlo). */
  refreshTrigger?: number | null;
}

export function VersionsPanel({ clientSlug, wallSlug, refreshTrigger }: VersionsPanelProps) {
  const [snapshots, setSnapshots] = useState<VideoWallSnapshotListEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: 'restore' | 'delete' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listWallSnapshots(clientSlug, wallSlug);
      setSnapshots(list);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [clientSlug, wallSlug]);

  useEffect(() => {
    void load();
  }, [load, refreshTrigger]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    const result = await createWallSnapshot(clientSlug, wallSlug, note.trim() || undefined);
    setCreating(false);
    if (!result.ok) {
      setError(result.error ?? 'Snapshot failed');
      return;
    }
    setNote('');
    void load();
  }

  async function handleRestore(id: string) {
    setBusy(true);
    const result = await restoreWallSnapshot(clientSlug, wallSlug, id);
    setBusy(false);
    setConfirm(null);
    if (!result.ok) {
      setError(result.error ?? 'Restore failed');
      return;
    }
    window.location.reload();
  }

  async function handleDelete(id: string) {
    setBusy(true);
    const result = await deleteWallSnapshot(clientSlug, wallSlug, id);
    setBusy(false);
    setConfirm(null);
    if (!result.ok) {
      setError(result.error ?? 'Delete failed');
      return;
    }
    void load();
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-zinc-500" strokeWidth={1.75} />
        <h3 className="font-display text-[14px] font-semibold text-zinc-900 dark:text-white">
          Versions
        </h3>
        <span className="text-[11.5px] text-zinc-500">
          {loading ? '…' : `${snapshots.length}/10`}
        </span>
      </header>

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
          No versions yet — create a snapshot above before risky changes.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {snapshots.map((s) => (
            <SnapshotRow
              key={s.id}
              snapshot={s}
              confirm={confirm?.id === s.id ? confirm.action : null}
              busy={busy && confirm?.id === s.id}
              onRequestRestore={() => setConfirm({ id: s.id, action: 'restore' })}
              onRequestDelete={() => setConfirm({ id: s.id, action: 'delete' })}
              onCancel={() => setConfirm(null)}
              onConfirmRestore={() => void handleRestore(s.id)}
              onConfirmDelete={() => void handleDelete(s.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function SnapshotRow({
  snapshot,
  confirm,
  busy,
  onRequestRestore,
  onRequestDelete,
  onCancel,
  onConfirmRestore,
  onConfirmDelete,
}: {
  snapshot: VideoWallSnapshotListEntry;
  confirm: 'restore' | 'delete' | null;
  busy: boolean;
  onRequestRestore: () => void;
  onRequestDelete: () => void;
  onCancel: () => void;
  onConfirmRestore: () => void;
  onConfirmDelete: () => void;
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

        {confirm === null ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRequestRestore}
              title="Restore this version"
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10.5px] font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={2} />
              Restore
            </button>
            <button
              type="button"
              onClick={onRequestDelete}
              title="Delete this snapshot"
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10.5px] font-medium text-zinc-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-red-900/40 dark:hover:bg-red-950/30 dark:hover:text-red-300"
            >
              <Trash2 className="h-3 w-3" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10.5px] font-medium text-zinc-600 transition hover:border-zinc-300 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm === 'restore' ? onConfirmRestore : onConfirmDelete}
              disabled={busy}
              className={`rounded-md px-2 py-1 text-[10.5px] font-semibold text-white transition disabled:opacity-50 ${
                confirm === 'restore'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {busy ? '…' : confirm === 'restore' ? 'Confirm restore' : 'Confirm delete'}
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
