'use client';

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Folder,
  HardDrive,
  Plug,
  Repeat,
  RotateCcw,
  Save,
  Send,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import type { HealthResponse } from '@/app/api/health/route';

import { StudioPageHeader } from '../_components/PageHeader';
import { SystemStatusBadge } from '../_components/SystemStatusBadge';
import { listConfigs, type ConfigEntry } from '../_lib/api-client';
import { getHistory, type LocalVersionEntry } from '../_lib/local-version-history';

/**
 * Diagnostics page (audit F-48).
 *
 * Vista de troubleshooting que el operador puede abrir desde:
 *   - El dot del SystemStatusBadge (`/api/health` consumer)
 *   - Cmd+K → "Open Diagnostics"
 *   - Sidebar footer del editor cuando el bridge está rojo (Reload + link
 *     a esta página)
 *
 * Muestra:
 *   1. Health probes en vivo (KV + filesystem) — re-fetch on demand.
 *   2. Lista de kiosks con su estado (current version, último editor).
 *   3. Timeline local consolidado: últimos saves+publishes de TODOS los
 *      kiosks, leyendo localStorage del browser actual.
 *
 * No requiere backend nuevo — los probes los provee F-29 (`/api/health`).
 */
export default function DiagnosticsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 pb-24 pt-12 sm:px-8">
      <StudioPageHeader />

      <header className="mb-10">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
          Diagnostics
        </p>
        <h1 className="text-balance font-display text-4xl font-bold leading-[1.08] tracking-tight text-zinc-900 dark:text-white sm:text-5xl sm:leading-[1.05]">
          What&rsquo;s going on under the hood.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Probes, recent activity and a quick view of every kiosk in the workspace. Use this page
          when something feels stuck — bridge disconnected, save failing, slow publish.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <HealthSection />
        <RecentActivitySection />
      </div>

      <div className="mt-6">
        <MigrationReportSection />
      </div>

      <div className="mt-6">
        <IntegrationsSmokeSection />
      </div>

      <div className="mt-6">
        <KiosksSection />
      </div>

      <footer className="mt-24 flex items-center justify-between border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-900 dark:text-zinc-600">
        <span>© 2026 TrueOmni · Kiosk Studio v0.1</span>
        <div className="flex items-center gap-4">
          <SystemStatusBadge />
          <span>Local · main</span>
        </div>
      </footer>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Health probes                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function HealthSection() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as HealthResponse;
      setHealth(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-900 dark:bg-zinc-950">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
            <Activity className="h-4 w-4 text-sky-500" />
            Health probes
          </h2>
          <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-500">
            Live ping of the storage layer and the filesystem.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <RotateCcw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Re-run
        </button>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50/60 p-3 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <strong>Probe failed:</strong> {error}
        </div>
      ) : health ? (
        <div className="space-y-2.5">
          <ProbeCard
            icon={<Database className="h-3.5 w-3.5" />}
            label="Key-value store"
            status={health.probes.kv.status}
            latencyMs={health.probes.kv.latencyMs}
            detail={
              health.probes.kv.detail ??
              `Mode: ${health.probes.kv.mode === 'cloud' ? 'Vercel KV (Upstash)' : 'In-memory fallback'}`
            }
          />
          <ProbeCard
            icon={<HardDrive className="h-3.5 w-3.5" />}
            label="Filesystem"
            status={health.probes.filesystem.status}
            latencyMs={health.probes.filesystem.latencyMs}
            detail={health.probes.filesystem.detail ?? 'clients/_template/config.json reachable.'}
          />
          <p className="pt-1 text-[10.5px] text-zinc-400 dark:text-zinc-600">
            Last checked {new Date(health.timestamp).toLocaleTimeString()} ·{' '}
            <span className="font-mono uppercase tracking-wide">{health.status}</span>
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center text-[12px] italic text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30">
          Probing…
        </div>
      )}
    </section>
  );
}

function ProbeCard({
  icon,
  label,
  status,
  latencyMs,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  status: 'ok' | 'degraded' | 'down';
  latencyMs: number;
  detail: string;
}) {
  const statusInfo = {
    ok: {
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />,
      label: 'OK',
      tone: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20',
    },
    degraded: {
      icon: <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />,
      label: 'Degraded',
      tone: 'border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20',
    },
    down: {
      icon: <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />,
      label: 'Down',
      tone: 'border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20',
    },
  }[status];

  return (
    <div className={`flex items-start gap-3 rounded-md border p-2.5 ${statusInfo.tone}`}>
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/70 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900/70 dark:text-zinc-300 dark:ring-zinc-800">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-200">
            {label}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white px-1.5 py-0 font-mono text-[10px] uppercase tracking-wider text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800">
            {statusInfo.icon}
            {statusInfo.label}
          </span>
          <span className="font-mono text-[10.5px] text-zinc-500">{latencyMs}ms</span>
        </div>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          {detail}
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Recent activity (consolidated)                                           */
/* ────────────────────────────────────────────────────────────────────────── */

function RecentActivitySection() {
  const [entries, setEntries] = useState<Array<LocalVersionEntry & { slug: string }>>([]);
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await listConfigs();
        if (cancelled) return;
        setConfigs(list);
        const all: Array<LocalVersionEntry & { slug: string }> = [];
        for (const cfg of list) {
          const history = getHistory(cfg.slug);
          for (const e of history) all.push({ ...e, slug: cfg.slug });
        }
        all.sort((a, b) => b.ts.localeCompare(a.ts));
        if (!cancelled) setEntries(all.slice(0, 30));
      } catch {
        // Silenciamos — la página sigue siendo útil aunque /api/configs falle.
      }
    })();
    return () => {
      cancelled = true;
    };
    // listConfigs dispara una sola vez al mount.
  }, []);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-900 dark:bg-zinc-950">
      <header className="mb-4">
        <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
          <Clock className="h-4 w-4 text-sky-500" />
          Recent activity
        </h2>
        <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-500">
          Saves and publishes recorded in this browser. Cross-kiosk view of the local timeline.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/60 px-3 py-8 text-center text-[12px] italic text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30">
          {configs.length === 0
            ? 'No kiosks loaded — visit /studio to bootstrap the workspace.'
            : 'No edits or publishes recorded yet in this browser.'}
        </div>
      ) : (
        <ol className="max-h-[400px] space-y-1.5 overflow-y-auto pr-1">
          {entries.map((e, i) => (
            <li
              key={`${e.slug}-${e.ts}-${i}`}
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
                  <Send className="h-3.5 w-3.5" />
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
                  <span className="ml-2 rounded bg-zinc-100 px-1 py-0 font-mono text-[10px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                    {e.slug}
                  </span>
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

/* ────────────────────────────────────────────────────────────────────────── */
/*  Migration report                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

interface MigrationReportPayload {
  scanned: number;
  migrated: number;
  alreadyMigrated: number;
  failed: number;
  details: Array<{
    slug: string;
    status: 'migrated' | 'already-migrated' | 'failed';
    products: string[];
    source: string;
    error?: string;
  }>;
}

interface LastMigrationResponse {
  report: MigrationReportPayload | null;
  computedAt: string | null;
  ageMs: number | null;
}

/**
 * Hallazgo S-43 del audit panorámico v2: el `MigrationReport` se calculaba
 * al primer GET /api/studio/clients pero solo se logueaba server-side.
 * Aquí lo exponemos al operador con counts y desglose por slug.
 */
function MigrationReportSection() {
  const [data, setData] = useState<LastMigrationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/studio/migration/last-report', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as LastMigrationResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-900 dark:bg-zinc-950">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
            <Repeat className="h-4 w-4 text-emerald-500" />
            Auto-migration
          </h2>
          <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-500">
            Lazy migrator that converts legacy clients (kiosk-only or signage-only) to the unified
            manifest model. Runs on first dashboard load.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <RotateCcw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Re-fetch
        </button>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50/60 p-3 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <strong>Failed to load:</strong> {error}
        </div>
      ) : !data ? (
        <p className="text-[12px] text-zinc-500">Loading…</p>
      ) : !data.report ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50/40 p-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400">
          No migration has run yet in this server instance. Visit{' '}
          <code className="font-mono">/studio</code> to trigger the lazy migrator.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ReportStat label="Scanned" value={data.report.scanned} tone="neutral" />
            <ReportStat label="Migrated" value={data.report.migrated} tone="success" />
            <ReportStat
              label="Already migrated"
              value={data.report.alreadyMigrated}
              tone="neutral"
            />
            <ReportStat label="Failed" value={data.report.failed} tone="danger" />
          </div>
          <p className="mt-3 text-[11.5px] text-zinc-500">
            Last computed {data.computedAt ? relativeTime(data.computedAt) : '—'}{' '}
            {data.ageMs != null && data.ageMs < 60_000 ? '(cache fresh)' : '(cache may be stale)'}
          </p>
          {data.report.details.length > 0 && (
            <details className="mt-4 rounded-md border border-zinc-200 dark:border-zinc-800">
              <summary className="cursor-pointer px-3 py-2 text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
                Detail by client ({data.report.details.length})
              </summary>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {data.report.details.map((d) => (
                  <li
                    key={d.slug}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-[12px]"
                  >
                    <span className="flex items-center gap-2">
                      <code className="font-mono text-zinc-800 dark:text-zinc-200">{d.slug}</code>
                      <span className="text-zinc-500">{d.products.join(', ') || '—'}</span>
                    </span>
                    <span
                      className={
                        d.status === 'migrated'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : d.status === 'failed'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-zinc-500'
                      }
                    >
                      {d.status === 'migrated'
                        ? `migrated (source: ${d.source})`
                        : d.status === 'failed'
                          ? `failed: ${d.error?.slice(0, 60) ?? 'unknown'}`
                          : 'already migrated'}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}

function ReportStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'neutral' | 'success' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'danger'
        ? 'text-red-600 dark:text-red-400'
        : 'text-zinc-700 dark:text-zinc-300';
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50/60 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/20">
      <p className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-0.5 font-display text-2xl font-bold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Integrations smoke check                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

interface IntegrationsSmokePayload {
  computedAt: string;
  totals: { clients: number; ok: number; failed: number; skipped: number };
  clients: Array<{
    slug: string;
    name?: string;
    error?: string;
    integrations: Array<{
      kind: string;
      status: 'ok' | 'failed' | 'skipped';
      message?: string;
    }>;
  }>;
}

/**
 * Hallazgo S-45 del audit panorámico v2: el Integrations tab del editor
 * tenía un botón "Check" por integración pero no había vista batch para
 * monitorear que TODAS las llaves de TODOS los clientes seguían vivas.
 * Esta sección dispara el smoke check al request del operador.
 */
function IntegrationsSmokeSection() {
  const [data, setData] = useState<IntegrationsSmokePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/studio/integrations/smoke', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as IntegrationsSmokePayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Smoke check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-900 dark:bg-zinc-950">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
            <Plug className="h-4 w-4 text-violet-500" />
            Integrations smoke check
          </h2>
          <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-500">
            Pings every configured integration (Mapbox, OpenWeather, Tavus, Satisfi, etc.) of every
            kiosk and reports OK/failed/skipped. Skipped means no credentials are stored.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1 text-[11.5px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {loading ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Plug className="h-3 w-3" />}
          Run smoke check
        </button>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50/60 p-3 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <strong>Smoke failed:</strong> {error}
        </div>
      )}

      {!error && !data && !loading && (
        <p className="rounded-md border border-zinc-200 bg-zinc-50/40 p-3 text-[12px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400">
          Click <strong>Run smoke check</strong> to fan out probes against every integration of
          every kiosk. Takes a few seconds for large workspaces.
        </p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ReportStat label="Clients" value={data.totals.clients} tone="neutral" />
            <ReportStat label="OK" value={data.totals.ok} tone="success" />
            <ReportStat label="Failed" value={data.totals.failed} tone="danger" />
            <ReportStat label="Skipped" value={data.totals.skipped} tone="neutral" />
          </div>
          <p className="mt-3 text-[11.5px] text-zinc-500">
            Last run {relativeTime(data.computedAt)}
          </p>
          <div className="mt-4 space-y-2">
            {data.clients.map((c) => (
              <div
                key={c.slug}
                className="rounded-md border border-zinc-200 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-900/20"
              >
                <div className="mb-2 flex items-center gap-2 text-[12.5px]">
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">{c.slug}</span>
                  {c.name && <span className="text-zinc-500">{c.name}</span>}
                  {c.error && <span className="text-red-600 dark:text-red-400">({c.error})</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.integrations.map((i) => (
                    <span
                      key={i.kind}
                      title={i.message}
                      className={
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium ' +
                        (i.status === 'ok'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : i.status === 'failed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500')
                      }
                    >
                      {i.kind}
                      <span className="text-[9.5px] opacity-70">
                        {i.status === 'ok' ? '✓' : i.status === 'failed' ? '✕' : '—'}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Workspace kiosks                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

function KiosksSection() {
  const [configs, setConfigs] = useState<ConfigEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listConfigs()
      .then((list) => {
        if (!cancelled) setConfigs(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-900 dark:bg-zinc-950">
      <header className="mb-4">
        <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
          <Folder className="h-4 w-4 text-sky-500" />
          Kiosks in workspace
          {configs ? (
            <span className="ml-1 font-mono text-[11px] font-normal text-zinc-500">
              · {configs.length}
            </span>
          ) : null}
        </h2>
        <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-500">
          Snapshot of every kiosk slug in the KV store. Click a row to edit.
        </p>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50/60 p-3 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          Could not load kiosks: {error}
        </div>
      ) : !configs ? (
        <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center text-[12px] italic text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30">
          Loading…
        </div>
      ) : configs.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center text-[12px] italic text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30">
          No kiosks yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-zinc-50 text-[10.5px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/40 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2 font-semibold">Slug</th>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Version</th>
                <th className="px-3 py-2 font-semibold">Last editor</th>
                <th className="px-3 py-2 font-semibold">Edited</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {configs.map((cfg) => (
                <tr
                  key={cfg.slug}
                  className="text-zinc-700 transition hover:bg-zinc-50/60 dark:text-zinc-300 dark:hover:bg-zinc-900/40"
                >
                  <td className="px-3 py-2 font-mono">
                    <a href={`/studio/${cfg.slug}`} className="hover:underline">
                      {cfg.slug}
                    </a>
                  </td>
                  <td className="px-3 py-2">{cfg.nombre}</td>
                  <td className="px-3 py-2 font-mono">v{cfg.currentVersion}</td>
                  <td className="truncate px-3 py-2 font-mono text-[10.5px] text-zinc-500">
                    {cfg.meta?.lastEditor ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-[10.5px] text-zinc-500">
                    {cfg.meta?.lastEditedAt ? relativeTime(cfg.meta.lastEditedAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

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
  return new Date(iso).toLocaleDateString();
}
