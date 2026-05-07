'use client';

import { Monitor, Tv } from 'lucide-react';
import Link from 'next/link';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

import { StudioPageHeader } from '../../_components/PageHeader';
import type { SignageClientWithDisplays } from '../page';

/**
 * `<ClientsDashboard>` — UI única del editor signage (DSS0).
 *
 * Sin sub-URLs: cada signage theme se muestra como una card consistente con
 * el ClientCard del kiosk dashboard (mismo `rounded-2xl`, hero `h-40`,
 * body `p-5`, hover lift + shadow). Click en la card abre el primer display
 * del cliente en nueva pestaña para preview rápido.
 *
 * Reusa el `<StudioPageHeader>` del shell.
 */
export interface ClientsDashboardProps {
  clients: SignageClientWithDisplays[];
}

export function ClientsDashboard({ clients }: ClientsDashboardProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 pb-24 pt-12 sm:px-8">
      <StudioPageHeader />

      {/* Hero */}
      <section className="mb-12">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
          Digital Displays
        </p>
        <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance text-zinc-900 sm:text-5xl sm:leading-[1.05] dark:text-white">
          Run scheduled content on lobby TVs.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-zinc-600 dark:text-zinc-400">
          Pixel-perfect 1920×1080 templates with playlist rotation, dayparting,
          weather header, and multi-locale support. Configure once, deploy to any HDMI
          display.
        </p>
      </section>

      {/* DSS1 banner */}
      <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <p className="font-semibold">Editor read-only en DSS1</p>
        <p className="mt-1 text-amber-800 dark:text-amber-300/90">
          La estructura del editor con tabs (Branding · Header · Displays · Versions ·
          Publish) ya está aquí. Los formularios editables, playlist drag-to-reorder
          y publish workflow aterrizan en DSS5..DSS7. Click en una card abre el editor
          del theme.
        </p>
      </section>

      {/* Themes section */}
      <section className="flex-1">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
              Your signage themes
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {clients.length} theme{clients.length === 1 ? '' : 's'} on disk
            </p>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <Tv
              className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-600"
              strokeWidth={1.5}
            />
            <p className="mt-4 text-base font-medium text-zinc-700 dark:text-zinc-300">
              No signage themes yet
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Drop a theme folder under{' '}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[12px] dark:bg-zinc-800">
                clients-signage/&lt;slug&gt;/
              </code>{' '}
              to bootstrap one. The editor will create them in DSS1+.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => (
              <ThemeCard key={c.slug} client={c} />
            ))}
          </div>
        )}
      </section>

      <footer className="mt-24 flex items-center justify-between border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-900 dark:text-zinc-600">
        <span>© 2026 TrueOmni · Digital Displays · Studio v0.1</span>
        <span>Local · main</span>
      </footer>
    </main>
  );
}

/**
 * Card de un signage theme. Replica el ClientCard del kiosk dashboard
 * (`src/app/studio/page.tsx`) en estructura visual y dimensiones:
 *
 *   - rounded-2xl border + shadow-sm
 *   - hero h-40 con gradient (signage tokens en lugar de brand del kiosk)
 *   - body p-5 con title + slug pill + footer info
 *   - hover lift `-translate-y-0.5` + border + shadow-md
 *
 * Click → abre el primer display del theme en nueva pestaña para preview.
 * En DSS1+ el click llevará al editor real del signage theme.
 */
function ThemeCard({ client }: { client: SignageClientWithDisplays }) {
  const editorHref = `/studio/digital-displays/${client.slug}`;
  const firstDisplay = client.displays[0];

  const cardClasses =
    'group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md motion-reduce:hover:translate-y-0 dark:border-zinc-800 dark:bg-zinc-900/40 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 dark:hover:shadow-[0_8px_24px_-12px_rgba(56,189,248,0.25)]';

  const inner = (
    <>
      {/* Hero — gradient signage (tokens propios). Mismo h-40 que kiosk. */}
      <div
        className="relative grid h-40 w-full place-items-center overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--signage-header-bg)) 0%, hsl(var(--signage-brand-primary)) 100%)',
        }}
      >
        <div
          className="absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-30 blur-2xl"
          style={{ background: 'hsl(var(--signage-brand-primary))' }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full opacity-20 blur-2xl"
          style={{ background: 'hsl(var(--signage-events-accent))' }}
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-center">
          {client.slug === 'default' ? (
            <TrueOmniLogo className="h-7 w-auto text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]" />
          ) : (
            <span className="font-display text-base font-semibold uppercase tracking-[0.18em] text-white/90 drop-shadow">
              {client.name}
            </span>
          )}
        </div>

        {/* Top-right: displays count badge (en kiosk era PublishBadge top-left) */}
        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-[10.5px] font-medium text-zinc-700 shadow-sm ring-1 ring-white/40 backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-200 dark:ring-zinc-700">
          <Monitor className="h-3 w-3" strokeWidth={2} />
          <span>
            {client.displaysCount} display{client.displaysCount === 1 ? '' : 's'}
          </span>
        </div>

        {/* Slug pill bottom-left, idéntico al kiosk */}
        <div className="absolute bottom-3 left-3 rounded-full bg-black/30 px-2.5 py-1 font-mono text-[10.5px] text-white/85 backdrop-blur">
          {client.slug}
        </div>
      </div>

      {/* Body — mismo p-5 + structure que kiosk */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-[16px] font-semibold leading-tight text-zinc-900 dark:text-white">
            {client.name}
          </h3>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10.5px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            signage
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-zinc-500">
          <span>Open editor</span>
          <span className="font-mono text-zinc-400 dark:text-zinc-600">→</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent opacity-0 transition group-hover:opacity-100" />
    </>
  );

  return (
    <Link
      href={editorHref}
      title={
        firstDisplay
          ? `Open ${client.name} editor (preview ${firstDisplay.slug} from inside)`
          : `Open ${client.name} editor`
      }
      className={cardClasses}
    >
      {inner}
    </Link>
  );
}
