'use client';

import { CheckCircle2, GitPullRequest, Rocket, ShieldCheck } from 'lucide-react';

/* ────────────────────────────────────────────────────────────────────────── */
/* Publish & Approvals section.                                                */
/* Surface real del publish dentro del editor (antes era un ComingSoon). El     */
/* botón dispara el mismo PublishModal que el TopBar (onPublish), que abre un    */
/* PR contra `main` con el diff de clients/<slug>/ para aprobación.             */
/* ────────────────────────────────────────────────────────────────────────── */

export function PublishEditor({
  currentVersion,
  lastPublishedAt,
  lastEditor,
  approver,
  onPublish,
}: {
  currentVersion: number;
  lastPublishedAt?: string;
  lastEditor?: string;
  /** Email que da la aprobación final (de la sección Publish). */
  approver: string;
  onPublish: () => void;
}) {
  const hasPublished = currentVersion > 0;
  return (
    <div className="space-y-5">
      {/* Estado actual + CTA de publish */}
      <section className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-5 dark:border-zinc-900 dark:from-zinc-900/40 dark:to-zinc-900/10">
        <div className="flex items-start justify-between gap-4">
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
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-sky-500"
          >
            <Rocket className="h-4 w-4" />
            Publish to production
          </button>
        </div>
      </section>

      {/* Cómo funciona la aprobación */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-900 dark:bg-zinc-950">
        <header className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-zinc-200 bg-white text-violet-500 dark:border-zinc-800 dark:bg-zinc-950">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <h3 className="font-display text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200">
            How publishing works
          </h3>
        </header>
        <ol className="space-y-3">
          <Step
            icon={<GitPullRequest className="h-3.5 w-3.5" />}
            title="Open a publish request"
            description="Publishing opens a Pull Request against main with the diff of this kiosk's config, tokens and content."
          />
          <Step
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            title="Final approval"
            description={`Final approval is given by ${approver}. Once the PR is merged, Vercel redeploys with the new version.`}
          />
          <Step
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            title="Live in production"
            description="The published version becomes the live kiosk. The full history lives in the Versions section."
          />
        </ol>
      </section>
    </div>
  );
}

function Step({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-3">
      <span
        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-200">
          {title}
        </span>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          {description}
        </p>
      </div>
    </li>
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
