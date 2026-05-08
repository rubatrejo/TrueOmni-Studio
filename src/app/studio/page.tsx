'use client';

import { Loader2, Monitor, Smartphone, Tablet, Tv, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

import { DeleteKioskModal } from './_components/DeleteKioskModal';
import { DuplicateKioskModal } from './_components/DuplicateKioskModal';
import { NewClientModal } from './_components/NewClientModal';
import { OnboardingTour, replayOnboardingTour } from './_components/OnboardingTour';
import { StudioPageHeader } from './_components/PageHeader';
import { SystemStatusBadge } from './_components/SystemStatusBadge';
import {
  cloneConfig,
  createConfig,
  deleteConfig,
} from './_lib/api-client';

/**
 * `/studio` — Dashboard de Clientes (post Fase 3).
 *
 * Reemplaza el viejo dashboard de kiosks. Cada card representa un Cliente
 * unificado que puede tener uno o más productos activos (Kiosks, Digital
 * Displays, Mobile PWA, Video Walls, Tablets). Click en una card → vista
 * del cliente `/studio/{slug}` con branding + product cards.
 *
 * Los modales legacy (NewClient, Delete, Duplicate) se mantienen y siguen
 * cableados al endpoint kiosk-only por ahora; la auto-migración convierte
 * el resultado en un cliente unificado en la siguiente carga.
 *
 * Plan: `~/.claude/plans/ok-listo-ahora-quiero-wondrous-sphinx.md`.
 */

interface ClientSummary {
  slug: string;
  name: string;
  products: {
    kiosks: boolean;
    digitalDisplays: boolean;
    mobilePwa: boolean;
    videoWalls: boolean;
    tablets: boolean;
  };
  brandPrimaryHex: string;
  brandSecondaryHex: string;
  brandAccentHex: string;
  logoUrl: string;
  lastEditedAt: string;
  lastEditor?: string;
}

async function fetchClients(): Promise<ClientSummary[]> {
  const res = await fetch('/api/studio/clients', { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetch clients: ${res.status}`);
  const json = (await res.json()) as { clients: ClientSummary[] };
  return json.clients;
}

export default function StudioHome() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setClients(await fetchClients());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchClients();
        if (!cancelled) setClients(list);
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

  const router = useRouter();
  const [creatingClient, setCreatingClient] = useState<string | null>(null);

  const handleCreate = async (input: {
    slug: string;
    nombre: string;
    orientation?: string;
    website?: string;
    location?: string;
    emptyMode?: boolean;
  }) => {
    setCreatingClient(input.nombre);
    try {
      // Por ahora reusamos el endpoint kiosk-only. La auto-migración convierte
      // el resultado en un cliente unificado al regresar al dashboard. El
      // endpoint /api/studio/clients POST llega en Fase 4.
      await createConfig(input);
      setShowNewModal(false);
      router.push(`/studio/${input.slug}`);
    } catch (err) {
      setCreatingClient(null);
      throw err;
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{ slug: string; nombre: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const handleDelete = (slug: string) => {
    const target = clients.find((c) => c.slug === slug);
    if (!target) return;
    setDeleteTarget({ slug, nombre: target.name });
  };

  const [cloningSource, setCloningSource] = useState<{ slug: string; nombre: string } | null>(null);
  const [cloneInProgress, setCloneInProgress] = useState(false);
  const handleClone = (slug: string) => {
    const target = clients.find((c) => c.slug === slug);
    if (!target) return;
    setCloningSource({ slug, nombre: target.name });
  };
  const submitClone = async (newNombre: string) => {
    if (!cloningSource) return;
    const trimmed = newNombre.trim();
    if (!trimmed) return;
    const newSlug = trimmed
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);
    if (!newSlug) return;
    setCloneInProgress(true);
    try {
      await cloneConfig(cloningSource.slug, { newSlug, newNombre: trimmed });
      setCloningSource(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone');
    } finally {
      setCloneInProgress(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteConfig(deleteTarget.slug);
      setDeleteTarget(null);
      await refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 pb-24 pt-12 sm:px-8">
      <StudioPageHeader />

      <section className="mb-12">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
          White-label studio
        </p>
        <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance text-zinc-900 sm:text-5xl sm:leading-[1.05] dark:text-white">
          One client. Every product.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-zinc-600 dark:text-zinc-400">
          Upload the branding once and feed it to every product the client uses —
          kiosks, digital displays, and the upcoming PWA, video walls and tablets.
        </p>
      </section>

      <section className="flex-1">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
              Your clients
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {loading
                ? 'Loading…'
                : `${clients.length} client${clients.length === 1 ? '' : 's'}`}
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
            clients.map((client) => (
              <ClientCard
                key={client.slug}
                client={client}
                onDelete={handleDelete}
                onClone={handleClone}
              />
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
          <button
            type="button"
            onClick={replayOnboardingTour}
            className="text-xs text-zinc-500 underline-offset-2 transition hover:text-zinc-800 hover:underline dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Replay tour
          </button>
          <SystemStatusBadge />
          <span>Local · main</span>
        </div>
      </footer>

      <NewClientModal
        open={showNewModal}
        existingSlugs={clients.map((c) => c.slug)}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreate}
      />

      {creatingClient ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-zinc-950/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 px-10 py-8 text-center shadow-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
            <div>
              <p className="font-display text-[15px] font-semibold text-white">
                Creating &quot;{creatingClient}&quot;
              </p>
              <p className="mt-1 text-[12px] text-zinc-400">
                Cloning template content and opening the editor…
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <DeleteKioskModal
        open={deleteTarget !== null}
        kioskName={deleteTarget?.nombre ?? ''}
        kioskSlug={deleteTarget?.slug ?? ''}
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      <DuplicateKioskModal
        open={cloningSource !== null}
        sourceNombre={cloningSource?.nombre ?? ''}
        existingSlugs={clients.map((c) => c.slug)}
        cloning={cloneInProgress}
        onCancel={() => setCloningSource(null)}
        onConfirm={(name) => void submitClone(name)}
      />

      <OnboardingTour />
    </main>
  );
}

// ---------------------------------------------------------------------------
//  Cards
// ---------------------------------------------------------------------------

const PRODUCT_BADGES: Array<{ key: keyof ClientSummary['products']; label: string; Icon: typeof Monitor }> = [
  { key: 'kiosks', label: 'Kiosks', Icon: Monitor },
  { key: 'digitalDisplays', label: 'Displays', Icon: Tv },
  { key: 'mobilePwa', label: 'PWA', Icon: Smartphone },
  { key: 'videoWalls', label: 'Walls', Icon: LayoutGrid },
  { key: 'tablets', label: 'Tablets', Icon: Tablet },
];

function ClientCard({
  client,
  onDelete,
  onClone,
}: {
  client: ClientSummary;
  onDelete: (slug: string) => void;
  onClone: (slug: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const activeProducts = PRODUCT_BADGES.filter((p) => client.products[p.key]);

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/studio/${client.slug}`}
        className="relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md motion-reduce:hover:translate-y-0 dark:border-zinc-800 dark:bg-zinc-900/40 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 dark:hover:shadow-[0_8px_24px_-12px_rgba(56,189,248,0.25)]"
      >
        <div
          className="relative grid h-40 w-full place-items-center overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${client.brandPrimaryHex} 0%, ${client.brandSecondaryHex} 100%)`,
          }}
        >
          <div
            className="absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-30 blur-2xl"
            style={{ background: client.brandAccentHex }}
            aria-hidden
          />
          <div
            className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full opacity-20 blur-2xl"
            style={{ background: client.brandAccentHex }}
            aria-hidden
          />

          <div className="relative flex items-center justify-center">
            {client.slug === 'default' ? (
              <TrueOmniLogo className="h-7 w-auto text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]" />
            ) : client.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.logoUrl}
                alt={`${client.name} logo`}
                className="h-10 w-auto max-w-[60%] object-contain drop-shadow"
              />
            ) : (
              <span className="font-display text-base font-semibold uppercase tracking-[0.18em] text-white/90 drop-shadow">
                {client.name}
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-3 rounded-full bg-black/30 px-2.5 py-1 font-mono text-[10.5px] text-white/85 backdrop-blur">
            {client.slug}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-[16px] font-semibold leading-tight text-zinc-900 dark:text-white">
            {client.name}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {activeProducts.length === 0 ? (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10.5px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
                No products active
              </span>
            ) : (
              activeProducts.map(({ key, label, Icon }) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10.5px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <Icon className="h-3 w-3" strokeWidth={2} />
                  {label}
                </span>
              ))
            )}
          </div>

          <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-zinc-500">
            <span>
              Edited <time dateTime={client.lastEditedAt}>{relativeTime(client.lastEditedAt)}</time>
            </span>
            <span className="font-mono">
              {(client.lastEditor ?? 'ruben@trueomni.com').split('@')[0]}
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent opacity-0 transition group-hover:opacity-100" />
      </Link>

      {hovered && client.slug !== 'default' && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClone(client.slug);
            }}
            title="Duplicate"
            className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-zinc-700 shadow-sm ring-1 ring-zinc-200 backdrop-blur transition hover:bg-white hover:text-zinc-900 dark:bg-zinc-900/90 dark:text-zinc-300 dark:ring-zinc-800 dark:hover:bg-zinc-900"
            aria-label={`Duplicate ${client.name}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onDelete(client.slug);
            }}
            title="Delete"
            className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-red-600 shadow-sm ring-1 ring-red-200 backdrop-blur transition hover:bg-red-50 hover:text-red-700 dark:bg-zinc-900/90 dark:text-red-400 dark:ring-red-900/40 dark:hover:bg-red-950/40"
            aria-label={`Delete ${client.name}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function NewClientCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/40 px-6 py-12 text-zinc-500 transition hover:border-sky-400 hover:bg-sky-50/40 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-500 dark:hover:border-sky-500/60 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-2xl font-light dark:bg-zinc-800">
        +
      </span>
      <span className="text-sm font-medium">New client</span>
    </button>
  );
}

function NewClientButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
    >
      <span className="text-base leading-none">+</span> New client
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="h-40 w-full animate-pulse bg-zinc-100 dark:bg-zinc-800/60" />
      <div className="space-y-2 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/60" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
    </div>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
