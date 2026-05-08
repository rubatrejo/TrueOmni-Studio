import { ChevronRight, Plus, Tv } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { listSignageDisplays, loadSignageClient } from '@/lib/signage/config';
import { loadClientManifest } from '@/lib/studio/client-manifest';

import { StudioBrand } from '../../_components/StudioBrand';
import { ThemeToggle } from '../../_components/ThemeToggle';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * `/studio/[slug]/digital-displays` — lista de displays del cliente (Fase 6).
 *
 * Equivalente al dashboard global de displays, pero filtrado al cliente
 * activo. La URL antigua `/studio/digital-displays` ahora es un redirect
 * a `/studio` (Clients dashboard); cada cliente tiene esta sub-vista.
 *
 * Plan: `~/.claude/plans/ok-listo-ahora-quiero-wondrous-sphinx.md`.
 */
export default async function ClientDisplaysPage({ params }: PageProps) {
  const { slug } = await params;
  const [manifest, signageClient, displays] = await Promise.all([
    loadClientManifest(slug),
    loadSignageClient(slug),
    listSignageDisplays(slug),
  ]);
  if (!manifest || !signageClient) notFound();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white/95 px-5 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/95">
        <div className="flex items-center gap-4">
          <StudioBrand />
          <span className="block h-5 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden />
          <nav className="flex items-center gap-1.5 text-[13px] text-zinc-500">
            <Link
              href="/studio"
              className="transition hover:text-zinc-800 dark:hover:text-zinc-300"
            >
              Clients
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-700" aria-hidden />
            <Link
              href={`/studio/${slug}`}
              className="transition hover:text-zinc-800 dark:hover:text-zinc-300"
            >
              {manifest.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-700" aria-hidden />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              Digital Displays
            </span>
          </nav>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
              Digital Displays
            </h1>
            <p className="mt-1 text-[13px] text-zinc-500">
              {displays.length} display{displays.length === 1 ? '' : 's'} configured for{' '}
              {manifest.name}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displays.map((d) => (
            <Link
              key={d.slug}
              href={`/studio/${slug}/digital-displays/${d.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
            >
              <div
                className="grid h-32 place-items-center"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--signage-brand-primary, 211 100% 25%)) 0%, hsl(var(--signage-brand-secondary, 200 100% 50%)) 100%)`,
                }}
              >
                <Tv className="h-10 w-10 text-white/90" strokeWidth={1.5} />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-[15px] font-semibold leading-tight text-zinc-900 dark:text-white">
                  {d.name ?? d.slug}
                </h3>
                <span className="mt-1 font-mono text-[11px] text-zinc-500">{d.slug}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
                  Open editor →
                </span>
              </div>
            </Link>
          ))}

          <NewDisplayCard slug={slug} />
        </div>
      </main>
    </div>
  );
}

function NewDisplayCard({ slug }: { slug: string }) {
  // Por ahora, "Add display" lleva al display editor con un slug placeholder
  // que el editor signage detecta como "new" (cuando aterrice ese flujo).
  // Mientras tanto, esto es un placeholder visual.
  return (
    <div
      title="Crear display nuevo (próximamente)"
      className="flex cursor-not-allowed flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/40 px-6 py-12 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-600"
      aria-label={`Add display to ${slug}`}
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Plus className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="text-sm font-medium">Add display</span>
      <span className="text-[10.5px] uppercase tracking-wider">Coming soon</span>
    </div>
  );
}
