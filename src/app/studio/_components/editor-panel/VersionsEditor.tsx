'use client';

import { CheckCircle2, History, Loader2, Rocket, RotateCcw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  listSnapshots as fetchSnapshots,
  revertSnapshot,
  type SnapshotEntry,
} from '../../_lib/api-client';
import { getHistory, type LocalVersionEntry } from '../../_lib/local-version-history';
import { useStudioSlug } from '../../_lib/slug-context';

/* ────────────────────────────────────────────────────────────────────────── */
/* Versions section — F-QA-1: extraído de EditorPanel.                         */
/* VersionsEditor + RoadmapStep + LocalVersionTimeline + SnapshotsTimeline.    */
/* ────────────────────────────────────────────────────────────────────────── */

export function VersionsEditor({
  currentVersion,
  lastPublishedAt,
  lastEditor,
  onPublish,
}: {
  currentVersion: number;
  lastPublishedAt?: string;
  lastEditor?: string;
  onPublish: () => void;
}) {
  const hasPublished = currentVersion > 0;
  return (
    <div className="space-y-6">
      {/* Current version pill */}
      <section className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-4 dark:border-zinc-900 dark:from-zinc-900/40 dark:to-zinc-900/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Current version
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
                v{currentVersion}
              </span>
              {!hasPublished && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  Draft
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-500">
              {hasPublished ? (
                <>
                  Last published{' '}
                  {lastPublishedAt ? (
                    <time dateTime={lastPublishedAt}>{relativeTime(lastPublishedAt)}</time>
                  ) : (
                    'recently'
                  )}
                  {lastEditor ? <> by {lastEditor.split('@')[0]}</> : null}.
                </>
              ) : (
                <>This kiosk has not been published yet. Hit Publish to ship v1.</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onPublish}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-[12px] font-medium text-sky-700 transition hover:bg-sky-500/20 dark:border-sky-400/30 dark:text-sky-300"
          >
            <Rocket className="h-3.5 w-3.5" />
            Publish
          </button>
        </div>
      </section>

      {/* Local timeline (audit F-10) — placeholder hasta S7.2 con git real. */}
      <LocalVersionTimeline />

      {/* Snapshots reales en KV — botón Revert (#9 audit). */}
      <SnapshotsTimeline />

      {/* Roadmap del versioning real (S7.2) */}
      <section className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/40 px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900/20">
        <header className="mb-2 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
            <History className="h-3.5 w-3.5" />
          </span>
          <h3 className="font-display text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200">
            Coming with GitHub-backed versioning
          </h3>
        </header>
        <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          The local timeline above is a transient placeholder. Once GitHub PR-publish ships (S7.2),
          each release will be an immutable git commit you can review, diff and roll back to.
        </p>
        {/* Timeline visual del roadmap (audit F-46). Done = local timeline,
           In progress = S7.2 publish flow, Upcoming = features post-S7. */}
        <ol className="mt-4 space-y-2.5">
          <RoadmapStep
            status="done"
            title="Local activity timeline"
            description="Saves and publishes recorded in this browser. Visible in the section above."
          />
          <RoadmapStep
            status="active"
            title="GitHub PR-publish (S7.2)"
            description="Each Publish opens a PR on the kiosks repo with the diff for review."
          />
          <RoadmapStep
            status="upcoming"
            title="Side-by-side diff"
            description="Compare any two versions of a kiosk's branding, modules and content."
          />
          <RoadmapStep
            status="upcoming"
            title="One-click rollback"
            description="Pin a kiosk to a specific version or revert to the previous release."
          />
          <RoadmapStep
            status="upcoming"
            title="Auto-generated release notes"
            description="Human-readable summary of what changed — generated from commit metadata."
          />
        </ol>
      </section>
    </div>
  );
}

/**
 * Step del timeline horizontal/vertical del roadmap de versioning (audit F-46).
 * Estados:
 *   - done:     ya entregado, dot emerald + texto destacado.
 *   - active:   en progreso, dot azul pulsante.
 *   - upcoming: futuro, dot gris.
 */
function RoadmapStep({
  status,
  title,
  description,
}: {
  status: 'done' | 'active' | 'upcoming';
  title: string;
  description: string;
}) {
  const dotClass =
    status === 'done'
      ? 'bg-emerald-500'
      : status === 'active'
        ? 'bg-sky-500 animate-pulse ring-4 ring-sky-500/20'
        : 'bg-zinc-300 dark:bg-zinc-700';
  const titleClass =
    status === 'upcoming' ? 'text-zinc-500 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200';
  const tagLabel = status === 'done' ? 'Live' : status === 'active' ? 'In progress' : 'Upcoming';
  const tagClass =
    status === 'done'
      ? 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300'
      : status === 'active'
        ? 'bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300'
        : 'bg-zinc-100 text-zinc-500 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-500 dark:ring-zinc-800';

  return (
    <li className="flex gap-3">
      {/* Dot + linea conectora */}
      <div className="relative flex flex-col items-center">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
        <span
          className="mt-1 w-px flex-1 bg-zinc-200 last:bg-transparent dark:bg-zinc-800"
          aria-hidden
        />
      </div>
      <div className="min-w-0 flex-1 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[12.5px] font-semibold ${titleClass}`}>{title}</span>
          <span
            className={`rounded-full px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider ring-1 ring-inset ${tagClass}`}
          >
            {tagLabel}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          {description}
        </p>
      </div>
    </li>
  );
}

/**
 * Timeline local persistido en localStorage. Lee del slug activo cada vez que
 * la sección Versions se muestra (no recibe pushes en vivo — el operador puede
 * recargar la sección clickando otra tab y volviendo).
 */
function LocalVersionTimeline() {
  const slug = useStudioSlug();
  const [entries, setEntries] = useState<LocalVersionEntry[]>([]);

  useEffect(() => {
    if (!slug) return;
    setEntries(getHistory(slug));
    // Storage event: si otra tab del Studio escribe, refrescamos.
    const onStorage = (e: StorageEvent) => {
      if (e.key === `studio:versions:${slug}`) setEntries(getHistory(slug));
    };
    window.addEventListener('storage', onStorage);
    // Polling ligero cada 2s para captar saves del propio tab (storage event
    // no se dispara en el tab que escribe).
    const id = setInterval(() => setEntries(getHistory(slug)), 2_000);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(id);
    };
  }, [slug]);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-950">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Recent activity
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Local timeline · last {entries.length || 0} {entries.length === 1 ? 'event' : 'events'}{' '}
            · stored in this browser only
          </p>
        </div>
        <span className="rounded-full border border-amber-300/40 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Placeholder
        </span>
      </header>
      {entries.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/60 px-3 py-6 text-center text-[11.5px] italic text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30">
          No edits or publishes yet — make a change and Save to see it here.
        </div>
      ) : (
        <ol className="space-y-1.5">
          {entries.map((e, i) => (
            <li
              key={`${e.ts}-${i}`}
              className="flex items-center gap-3 rounded-md border border-zinc-200/70 bg-zinc-50/50 px-3 py-2 dark:border-zinc-900 dark:bg-zinc-900/40"
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ring-1 ${
                  e.type === 'publish'
                    ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-300'
                    : 'bg-sky-500/10 text-sky-600 ring-sky-500/30 dark:text-sky-300'
                }`}
                aria-hidden
              >
                {e.type === 'publish' ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
                  {e.type === 'publish' ? (
                    <>
                      Published <span className="font-mono">v{e.version ?? '?'}</span>
                    </>
                  ) : (
                    'Saved draft'
                  )}
                  {e.summary ? (
                    <span className="ml-1 font-normal text-zinc-500">— {e.summary}</span>
                  ) : null}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-zinc-500 dark:text-zinc-500">
                  <time dateTime={e.ts}>{relativeTime(e.ts)}</time>
                  <span>·</span>
                  <span className="font-mono">{e.editor.split('@')[0]}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/**
 * Snapshots reales del config en KV (#9 audit). Cada PATCH/import deja un
 * snapshot del estado anterior con TTL 30d (cap 10 por kiosk). Esta lista
 * permite al operador revertir a cualquiera con un click.
 */
function SnapshotsTimeline() {
  const slug = useStudioSlug();
  const [entries, setEntries] = useState<SnapshotEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmTs, setConfirmTs] = useState<string | null>(null);
  const [reverting, setReverting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    fetchSnapshots(slug)
      .then((list) => {
        if (!cancelled) {
          setEntries(list);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleRevert = async (ts: string) => {
    if (!slug) return;
    setReverting(true);
    try {
      await revertSnapshot(slug, ts);
      // Reload para re-bootstrappear el editor con el config restaurado.
      // Podríamos hacer un swap in-place pero el editor tiene 19 piezas de
      // state que reconciliar — el reload es más seguro.
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revert failed');
      setReverting(false);
      setConfirmTs(null);
    }
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-950">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Restore from snapshot
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Server-side snapshots taken before each Save / Import · TTL 30 days · last 10 kept
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/40 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          Real
        </span>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 px-3 py-4 text-[11.5px] text-zinc-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading snapshots…
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50/70 px-3 py-2 text-[11.5px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/60 px-3 py-6 text-center text-[11.5px] italic text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30">
          No snapshots yet — they appear after the next Save.
        </div>
      ) : (
        <ol className="space-y-1.5">
          {entries.map((e) => {
            const sizeKb = Math.round(e.sizeBytes / 1024);
            const reasonColor =
              e.reason === 'patch'
                ? 'bg-sky-500/10 text-sky-600 ring-sky-500/30 dark:text-sky-300'
                : e.reason === 'import'
                  ? 'bg-violet-500/10 text-violet-600 ring-violet-500/30 dark:text-violet-300'
                  : 'bg-amber-500/10 text-amber-600 ring-amber-500/30 dark:text-amber-300';
            return (
              <li
                key={e.ts}
                className="flex items-center gap-3 rounded-md border border-zinc-200/70 bg-zinc-50/50 px-3 py-2 dark:border-zinc-900 dark:bg-zinc-900/40"
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ring-1 ${reasonColor}`}
                  aria-hidden
                  title={`Source: ${e.reason}`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
                    Snapshot before {e.reason}
                    <span className="ml-2 font-mono text-[10.5px] text-zinc-500">{sizeKb}KB</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-zinc-500 dark:text-zinc-500">
                    <time dateTime={e.ts}>{relativeTime(e.ts)}</time>
                    <span>·</span>
                    <span className="font-mono">{e.ts.slice(0, 16).replace('T', ' ')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmTs(e.ts)}
                  className="shrink-0 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Revert
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {/* Confirm modal — inline para evitar otro componente. */}
      {confirmTs ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-zinc-950/70 p-4 backdrop-blur-md">
          <div className="w-[480px] max-w-[94vw] rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
              Revert to {confirmTs.slice(0, 16).replace('T', ' ')}?
            </h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              The current config will be saved as a new snapshot first (so this is undoable). The
              kiosk will reload with the restored state.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmTs(null)}
                disabled={reverting}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleRevert(confirmTs)}
                disabled={reverting}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
              >
                {reverting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                {reverting ? 'Reverting…' : 'Revert'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** Devuelve "2 days ago" / "just now" para un ISO string. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'recently';
  const diff = Date.now() - then;
  if (diff < 60_000) return 'just now';
  const min = Math.round(diff / 60_000);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} ${day === 1 ? 'day' : 'days'} ago`;
  const month = Math.round(day / 30);
  if (month < 12) return `${month} mo ago`;
  return `${Math.round(month / 12)} yr ago`;
}
