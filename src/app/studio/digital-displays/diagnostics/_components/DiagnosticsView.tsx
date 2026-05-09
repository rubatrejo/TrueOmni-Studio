'use client';

import { Check, ChevronLeft, X } from 'lucide-react';
import Link from 'next/link';

import type { SignageDiagnostics } from '@/lib/signage/diagnostics';

import { StudioPageHeader } from '../../../_components/PageHeader';

/**
 * `<DiagnosticsView>` — DSS8. Vista read-only del system info para QA y
 * troubleshooting.
 */
export interface DiagnosticsViewProps {
  data: SignageDiagnostics;
}

export function DiagnosticsView({ data }: DiagnosticsViewProps) {
  const usagePct =
    data.storage.capBytes > 0
      ? Math.min(100, (data.storage.totalBytes / data.storage.capBytes) * 100)
      : 0;
  const barColor = usagePct < 60 ? 'bg-emerald-500' : usagePct < 85 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 pb-24 pt-12 sm:px-8">
      <StudioPageHeader />

      <Link
        href="/studio/digital-displays"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        All signage themes
      </Link>

      <section className="mb-10">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">System</p>
        <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
          Signage diagnostics
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Read-only system status. Útil para QA y troubleshooting.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Storage">
          <Row label="KV cloud" value={<Toggle on={data.storage.kvCloud} />} />
          <Row
            label="Total usage"
            value={
              <span className="font-mono text-[12px]">
                {fmtBytes(data.storage.totalBytes)} / {fmtBytes(data.storage.capBytes)}
              </span>
            }
          />
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
            <div
              className={`h-full ${barColor} transition-all duration-300`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          {data.storage.perDisplay.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1 text-[11px]">
              {data.storage.perDisplay.map((d) => (
                <li
                  key={`${d.client}/${d.display}`}
                  className="flex items-center justify-between border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-900"
                >
                  <span className="text-zinc-500">
                    <code className="font-mono">
                      {d.client}/{d.display}
                    </code>
                  </span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {fmtBytes(d.bytes)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card title="Clients">
          <Row label="Total" value={data.clients.count} />
          {data.clients.slugs.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {data.clients.slugs.map((s) => (
                <li
                  key={s}
                  className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {s}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card title="Displays">
          <Row label="Total" value={data.displays.totalCount} />
          {data.displays.perClient.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1 text-[11px]">
              {data.displays.perClient.map((c) => (
                <li
                  key={c.client}
                  className="flex items-center justify-between border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-900"
                >
                  <code className="font-mono text-zinc-700 dark:text-zinc-300">{c.client}</code>
                  <span className="text-zinc-500">{c.count}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card title="Publish">
          <Row label="GitHub configured" value={<Toggle on={data.publish.githubConfigured} />} />
          {data.publish.githubConfigured ? (
            <>
              <Row
                label="Repository"
                value={
                  <code className="font-mono text-[11.5px]">
                    {data.publish.owner}/{data.publish.repo}
                  </code>
                }
              />
              <Row
                label="Base branch"
                value={<code className="font-mono text-[11.5px]">{data.publish.baseBranch}</code>}
              />
            </>
          ) : (
            <p className="mt-2 text-[11.5px] text-zinc-500">
              Set <code className="font-mono">STUDIO_GITHUB_TOKEN</code>,{' '}
              <code className="font-mono">STUDIO_GITHUB_OWNER</code>,{' '}
              <code className="font-mono">STUDIO_GITHUB_REPO</code> in env to enable the per-display
              publish flow.
            </p>
          )}
        </Card>
      </div>

      <footer className="mt-24 flex items-center justify-between border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-900 dark:text-zinc-600">
        <span>© 2026 TrueOmni · Digital Displays · Studio v0.1</span>
        <span>Local · main</span>
      </footer>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 font-display text-[14px] font-semibold text-zinc-900 dark:text-white">
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2 text-[12.5px] last:border-0 last:pb-0 dark:border-zinc-900">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-800 dark:text-zinc-200">{value}</span>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
      <Check className="h-3 w-3" strokeWidth={2.5} />
      yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500">
      <X className="h-3 w-3" strokeWidth={2.5} />
      no
    </span>
  );
}

function fmtBytes(n: number): string {
  if (n < 1000) return `${n}B`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}KB`;
  return `${(n / 1_000_000).toFixed(2)}MB`;
}
