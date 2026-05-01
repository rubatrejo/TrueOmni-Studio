'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import type { ConfigMeta, KioskConfig } from '@/lib/studio/schema';

import { NewClientModal } from './_components/NewClientModal';
import { StudioPageHeader } from './_components/PageHeader';
import {
  type ConfigEntry,
  createConfig,
  deleteConfig,
  listConfigs,
  seedDefault,
} from './_lib/api-client';

export default function StudioHome() {
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const list = await listConfigs();
      setConfigs(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  // Bootstrap: cargar lista; si está vacía, seedear `default` y recargar.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listConfigs();
        if (cancelled) return;
        if (list.length === 0) {
          await seedDefault();
          const seeded = await listConfigs();
          if (cancelled) return;
          setConfigs(seeded);
        } else {
          setConfigs(list);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async (input: { slug: string; nombre: string }) => {
    await createConfig(input);
    setShowNewModal(false);
    await refresh();
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Delete kiosk "${slug}"? This action cannot be undone.`)) return;
    await deleteConfig(slug);
    await refresh();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 pb-24 pt-12 sm:px-8">
      <StudioPageHeader />

      {/* Hero */}
      <section className="mb-12">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
          White-label studio
        </p>
        <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-zinc-900 dark:text-white">
          Build a kiosk in minutes,<br />
          not in commits.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Configure branding, modules, content, ads and integrations from a single canvas
          with the kiosk rendering live next to you. No JSON, no terminals — just decisions.
        </p>
      </section>

      {/* Clients section */}
      <section className="flex-1">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
              Your kiosks
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {loading
                ? 'Loading…'
                : `${configs.length} active configuration${configs.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <NewClientButton onClick={() => setShowNewModal(true)} />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {!loading &&
            configs.map((config) => (
              <ClientCard key={config.slug} config={config} onDelete={handleDelete} />
            ))}
          {!loading && <NewClientCard onClick={() => setShowNewModal(true)} />}
          {loading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}
        </div>
      </section>

      <footer className="mt-24 flex items-center justify-between border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-900 dark:text-zinc-600">
        <span>© 2026 TrueOmni · Kiosk Studio v0.1</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </span>
          <span>Local · main</span>
        </div>
      </footer>

      <NewClientModal
        open={showNewModal}
        existingSlugs={configs.map((c) => c.slug)}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreate}
      />
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Client card                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function ClientCard({
  config,
  onDelete,
}: {
  config: KioskConfig & { meta?: ConfigMeta | null };
  onDelete: (slug: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/studio/${config.slug}`}
        className="relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
      >
        {/* Brand gradient hero with centered client logo */}
        <div
          className="relative grid h-40 w-full place-items-center overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${config.branding.primary} 0%, ${config.branding.secondary} 100%)`,
          }}
        >
          <div
            className="absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-30 blur-2xl"
            style={{ background: config.branding.tertiary }}
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full opacity-20 blur-2xl"
            style={{ background: config.branding.tertiary }}
            aria-hidden="true"
          />

          <div className="relative flex items-center justify-center">
            {config.slug === 'default' ? (
              <TrueOmniLogo className="h-7 w-auto text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]" />
            ) : (
              <span className="font-display text-base font-semibold uppercase tracking-[0.18em] text-white/90 drop-shadow">
                {config.nombre}
              </span>
            )}
          </div>

          <div className="absolute left-3 top-3">
            <PublishBadge currentVersion={config.currentVersion} />
          </div>

          {config.branding.favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveFaviconPreview(config.branding.favicon, config.slug)}
              alt=""
              className="absolute right-3 top-3 h-7 w-7 rounded-md bg-white/90 object-cover p-0.5 shadow-sm ring-1 ring-white/40 backdrop-blur"
              aria-hidden="true"
            />
          ) : (
            <div
              className="absolute right-3 top-3 h-3 w-3 rounded-full ring-2 ring-white/30"
              style={{ background: config.branding.tertiary }}
              aria-hidden="true"
            />
          )}

          <div className="absolute bottom-3 left-3 rounded-full bg-black/30 px-2.5 py-1 font-mono text-[10.5px] text-white/85 backdrop-blur">
            {config.slug}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-display text-[16px] font-semibold leading-tight text-zinc-900 dark:text-white">
              {config.nombre}
            </h3>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10.5px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              v{config.currentVersion}
            </span>
          </div>

          <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-zinc-500">
            <span>
              Edited{' '}
              {config.meta?.lastEditedAt ? (
                <time dateTime={config.meta.lastEditedAt}>
                  {relativeTime(config.meta.lastEditedAt)}
                </time>
              ) : (
                'just now'
              )}
            </span>
            <span className="font-mono">
              {(config.meta?.lastEditor ?? 'ruben@trueomni.com').split('@')[0]}
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent opacity-0 transition group-hover:opacity-100" />
      </Link>

      {/* Floating delete button (only for non-default + on hover) */}
      {hovered && config.slug !== 'default' && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onDelete(config.slug);
          }}
          aria-label={`Delete ${config.nombre}`}
          className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-md bg-red-500/90 text-white shadow-lg transition hover:bg-red-600"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          </svg>
        </button>
      )}
    </div>
  );
}

function NewClientCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-br from-zinc-50 to-zinc-100 text-left transition hover:border-zinc-400 hover:from-white hover:to-zinc-100 hover:shadow-md dark:border-zinc-800 dark:from-zinc-900/40 dark:to-zinc-900/80 dark:hover:border-zinc-700 dark:hover:from-zinc-900/60 dark:hover:to-zinc-900"
    >
      {/* Hero area — same height as ClientCard (h-40) with grid pattern + plus icon */}
      <div className="relative grid h-40 w-full place-items-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgb(212_212_216_/_0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgb(212_212_216_/_0.5)_1px,transparent_1px)] [background-size:20px_20px] dark:opacity-20 dark:[background-image:linear-gradient(to_right,rgb(63_63_70)_1px,transparent_1px),linear-gradient(to_bottom,rgb(63_63_70)_1px,transparent_1px)]"
          aria-hidden="true"
        />
        <div className="relative grid h-12 w-12 place-items-center rounded-xl border border-zinc-300 bg-white text-zinc-500 shadow-sm transition group-hover:border-zinc-400 group-hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:border-zinc-600 dark:group-hover:text-zinc-200">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
      </div>

      {/* Footer — same padding/structure as ClientCard */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-[16px] font-semibold leading-tight text-zinc-700 transition group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-white">
            New kiosk
          </h3>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-zinc-500">
          <span>Clone from template</span>
          <span className="font-mono">⌘N</span>
        </div>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="h-40 w-full animate-pulse bg-zinc-100 dark:bg-zinc-900" />
      <div className="p-5">
        <div className="mb-2 h-4 w-32 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-3 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

function NewClientButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      New kiosk
    </button>
  );
}

function PublishBadge({ currentVersion }: { currentVersion: number }) {
  if (currentVersion > 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/40 backdrop-blur">
        Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-500/30 px-2 py-0.5 text-[11px] font-medium text-zinc-100 ring-1 ring-inset ring-zinc-400/40 backdrop-blur">
      Draft
    </span>
  );
}

/**
 * Resuelve el src del favicon para preview en /studio. Data URLs y http(s)
 * pasan tal cual; paths relativos los servimos vía
 * `/api/studio/clients/<slug>/...` para no depender de KIOSK_CLIENT global.
 */
function resolveFaviconPreview(favicon: string, slug: string): string {
  if (favicon.startsWith('data:') || favicon.startsWith('http')) return favicon;
  const trimmed = favicon.startsWith('/') ? favicon.slice(1) : favicon;
  return `/api/studio/clients/${slug}/${trimmed}`;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
