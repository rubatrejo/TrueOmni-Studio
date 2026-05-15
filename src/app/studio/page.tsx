'use client';

import { LayoutGrid, Loader2, Monitor, Search, Smartphone, Tablet, Tv, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';

import { DeleteKioskModal } from './_components/DeleteKioskModal';
import { DuplicateKioskModal } from './_components/DuplicateKioskModal';
import { NewClientModal } from './_components/NewClientModal';
import { OnboardingTour, replayOnboardingTour } from './_components/OnboardingTour';
import { StudioPageHeader } from './_components/PageHeader';
import { SystemStatusBadge } from './_components/SystemStatusBadge';
import { cloneConfig, createClient, deleteConfig } from './_lib/api-client';

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
  pinned: boolean;
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
  // S-07: search filter local. No round-trip — el dataset es pequeño y el
  // filtro corre sobre `clients` ya en memoria. Match contra slug + name +
  // products activos (e.g. "kiosks", "displays").
  const [search, setSearch] = useState('');

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

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      if (c.slug.toLowerCase().includes(q)) return true;
      if (c.name.toLowerCase().includes(q)) return true;
      // Match contra "kiosks", "displays", "pwa", etc.
      const productLabels: string[] = [];
      if (c.products.kiosks) productLabels.push('kiosks');
      if (c.products.digitalDisplays) productLabels.push('displays');
      if (c.products.mobilePwa) productLabels.push('pwa');
      if (c.products.videoWalls) productLabels.push('walls');
      if (c.products.tablets) productLabels.push('tablets');
      return productLabels.some((p) => p.includes(q));
    });
  }, [clients, search]);

  const handleCreate = async (input: {
    slug: string;
    nombre: string;
    website?: string;
    location?: string;
    emptyMode?: boolean;
    products: {
      kiosks: boolean;
      digitalDisplays: boolean;
      mobilePwa: boolean;
      videoWalls: boolean;
      tablets: boolean;
    };
  }) => {
    setCreatingClient(input.nombre);
    try {
      const locationFull = input.location?.trim() || undefined;
      const cityFromFull = locationFull?.split(',')[0]?.trim();
      await createClient({
        slug: input.slug,
        name: input.nombre,
        website: input.website || undefined,
        location: cityFromFull ? { city: cityFromFull } : undefined,
        locationFull,
        emptyMode: input.emptyMode || undefined,
        products: input.products,
      });
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

  // S-13: toggle pin del cliente. Optimistic UI: actualiza la lista local
  // inmediatamente y refetch en background para reflejar el orden nuevo.
  const handlePinToggle = useCallback(
    async (slug: string) => {
      try {
        const res = await fetch(`/api/studio/clients/${slug}/pin`, { method: 'POST' });
        if (!res.ok) throw new Error(`pin failed: ${res.status}`);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Pin failed');
      }
    },
    [refresh],
  );
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
        <h1 className="text-balance font-display text-4xl font-bold leading-[1.08] tracking-tight text-zinc-900 dark:text-white sm:text-5xl sm:leading-[1.05]">
          One client. Every product.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Upload the branding once and feed it to every product the client uses — kiosks, digital
          displays, and the upcoming PWA, video walls and tablets.
        </p>
      </section>

      <section className="flex-1">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
              Your clients
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {loading
                ? 'Loading…'
                : search
                  ? `${filteredClients.length} of ${clients.length} client${clients.length === 1 ? '' : 's'}`
                  : `${clients.length} client${clients.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* S-07: search local con clear button. */}
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients…"
                aria-label="Search clients by name, slug or product"
                className="h-9 w-56 rounded-lg border border-zinc-200 bg-white pl-8 pr-8 text-[13px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <NewClientButton onClick={() => setShowNewModal(true)} />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {!loading &&
            filteredClients.map((client) => (
              <ClientCard
                key={client.slug}
                client={client}
                onDelete={handleDelete}
                onClone={handleClone}
                onPinToggle={handlePinToggle}
              />
            ))}
          {!loading && !search && <NewClientCard onClick={() => setShowNewModal(true)} />}
          {!loading && search && filteredClients.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-zinc-300 bg-zinc-50/40 px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/20">
              <p className="text-[13px] text-zinc-500">No clients match &quot;{search}&quot;.</p>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-3 text-[12px] font-medium text-sky-600 underline-offset-2 hover:underline dark:text-sky-400"
              >
                Clear search
              </button>
            </div>
          )}
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
          <EnvironmentBadge />
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

const PRODUCT_BADGES: Array<{
  key: keyof ClientSummary['products'];
  label: string;
  Icon: typeof Monitor;
}> = [
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
  onPinToggle,
}: {
  client: ClientSummary;
  onDelete: (slug: string) => void;
  onClone: (slug: string) => void;
  onPinToggle: (slug: string) => void;
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
        // Hallazgo S-25: aria-label conciso reemplaza la concatenación de
        // logo alt + slug + heading + product badges + timestamp + editor.
        // El subcontenido decorativo lleva aria-hidden para evitar duplicar.
        aria-label={
          activeProducts.length === 0
            ? `Open client ${client.name}, no products active`
            : `Open client ${client.name}, ${activeProducts.length} product${activeProducts.length === 1 ? '' : 's'} active`
        }
        className="relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md motion-reduce:hover:translate-y-0 dark:border-zinc-800 dark:bg-zinc-900/40 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 dark:hover:shadow-[0_8px_24px_-12px_rgba(56,189,248,0.25)]"
      >
        <div
          aria-hidden
          className="relative grid h-40 w-full place-items-center overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${client.brandPrimaryHex} 0%, ${client.brandSecondaryHex} 100%)`,
          }}
        >
          <div
            className="absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-30 blur-2xl"
            style={{ background: client.brandAccentHex }}
          />
          <div
            className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full opacity-20 blur-2xl"
            style={{ background: client.brandAccentHex }}
          />

          <div className="relative flex items-center justify-center">
            {client.slug === 'default' ? (
              <TrueOmniLogo className="h-7 w-auto text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]" />
            ) : client.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.logoUrl}
                alt=""
                loading="lazy"
                decoding="async"
                width={200}
                height={48}
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

        <div aria-hidden className="flex flex-1 flex-col p-5">
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

      {/* Pin badge siempre visible si está pinned (sin hover). S-13. */}
      {client.pinned && (
        <span
          className="pointer-events-none absolute left-3 top-3 z-10 grid h-6 w-6 place-items-center rounded-full bg-amber-400/95 text-zinc-900 shadow-sm"
          title="Pinned"
          aria-label="Pinned"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M16 4l4 4-5 5 1 5-2 2-5-5-5 1-2-2 5-5-1-5 2-2 5 1 3-3z" />
          </svg>
        </span>
      )}

      {hovered && client.slug !== 'default' && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onPinToggle(client.slug);
            }}
            title={client.pinned ? 'Unpin' : 'Pin to top'}
            className={`grid h-7 w-7 place-items-center rounded-md shadow-sm ring-1 backdrop-blur transition ${
              client.pinned
                ? 'bg-amber-100 text-amber-700 ring-amber-300 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/50'
                : 'bg-white/90 text-zinc-700 ring-zinc-200 hover:bg-white hover:text-zinc-900 dark:bg-zinc-900/90 dark:text-zinc-300 dark:ring-zinc-800 dark:hover:bg-zinc-900'
            }`}
            aria-label={client.pinned ? `Unpin ${client.name}` : `Pin ${client.name} to top`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill={client.pinned ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M16 4l4 4-5 5 1 5-2 2-5-5-5 1-2-2 5-5-1-5 2-2 5 1 3-3z" />
            </svg>
          </button>
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
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
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
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
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
  // Hallazgo S-24: aria-label distinto del botón header — el screen reader
  // anunciaba "+ New client, button" dos veces seguidas. Aquí distinguimos
  // el card-CTA inline al final del grid del botón pill del header.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Create a new client (inline shortcut)"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/40 px-6 py-12 text-zinc-500 transition hover:border-sky-400 hover:bg-sky-50/40 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-500 dark:hover:border-sky-500/60 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
    >
      <span
        aria-hidden
        className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-2xl font-light dark:bg-zinc-800"
      >
        +
      </span>
      <span className="text-sm font-medium">New client</span>
    </button>
  );
}

function NewClientButton({ onClick }: { onClick: () => void }) {
  // Hallazgo S-24: aria-label específico del botón pill del header.
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Create a new client"
      className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
    >
      <span aria-hidden className="text-base leading-none">
        +
      </span>{' '}
      New client
    </button>
  );
}

/**
 * Footer badge con el environment + branch dinámico. Reemplaza el "Local ·
 * main" hardcoded — hallazgo S-16 del audit panorámico v2. Vercel inyecta
 * `NEXT_PUBLIC_VERCEL_ENV` (production/preview/development) y
 * `NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF` (branch) en build time. En local
 * ambos son undefined → fallback "Local · main".
 */
function EnvironmentBadge() {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV;
  const branch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ?? 'main';
  const label = (() => {
    if (env === 'production') return `Production · ${branch}`;
    if (env === 'preview') return `Preview · ${branch}`;
    if (env === 'development') return `Vercel dev · ${branch}`;
    return `Local · ${branch}`;
  })();
  return <span title={`Studio environment · ${label}`}>{label}</span>;
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
