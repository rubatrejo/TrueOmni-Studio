'use client';

import {
  ChevronRight,
  CircleAlert,
  FileEdit,
  LayoutGrid,
  Loader2,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  Tv,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { UnifiedClientBranding } from '@/lib/studio/client-branding-sync';
import type { ClientManifest } from '@/lib/studio/client-manifest';

import { StudioBrand } from '../../_components/StudioBrand';
import { ThemeToggle } from '../../_components/ThemeToggle';

import { BrandingForm } from './BrandingForm';
import { ProductCard } from './ProductCard';

/**
 * `<ClientView>` — vista del cliente unificado.
 *
 * Sticky top bar con breadcrumb + estado de save. Body en 2 secciones:
 *  1. Branding & Info — formulario unificado con autosave 1s al endpoint
 *     `PATCH /api/studio/clients/[slug]/branding`. Sync bidireccional al
 *     kiosk + signage configs activos via la sync layer.
 *  2. Productos — 5 cards (Kiosks, Digital Displays, Mobile PWA, Video
 *     Walls, Tablets). Activos lleván al editor; coming soon están
 *     deshabilitados.
 *
 * Plan: `~/.claude/plans/ok-listo-ahora-quiero-wondrous-sphinx.md`.
 */
export interface ClientViewProps {
  slug: string;
  initialManifest: ClientManifest;
  initialBranding: UnifiedClientBranding;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function ClientView({ slug, initialManifest, initialBranding }: ClientViewProps) {
  const [branding, setBranding] = useState<UnifiedClientBranding>(initialBranding);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);
  // S-08: snapshot del último branding persistido en KV. Permite "Restore"
  // (revertir cambios pendientes) y mostrar el botón solo cuando hay
  // diff con `branding`. Se actualiza tras cada save exitoso.
  const [persisted, setPersisted] = useState<UnifiedClientBranding>(initialBranding);
  const isDirty = useMemo(
    () => JSON.stringify(branding) !== JSON.stringify(persisted),
    [branding, persisted],
  );

  // Autosave 1s después del último cambio.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  const persist = useCallback(
    async (next: UnifiedClientBranding) => {
      setSaveState('saving');
      setError(null);
      try {
        const res = await fetch(`/api/studio/clients/${slug}/branding`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(next),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `save failed: ${res.status}`);
        }
        setSaveState('saved');
        dirtyRef.current = false;
        setPersisted(next); // S-08: snapshot tras save exitoso
      } catch (e) {
        setSaveState('error');
        setError(e instanceof Error ? e.message : 'Save failed');
      }
    },
    [slug],
  );

  const handleChange = useCallback(
    (next: UnifiedClientBranding) => {
      setBranding(next);
      dirtyRef.current = true;
      setSaveState('idle');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (dirtyRef.current) void persist(next);
      }, 1000);
    },
    [persist],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Warn antes de cerrar si hay cambios sin guardar.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Hallazgo S-23: warn también al hacer navegación interna (click en
  // <Link> de Next). beforeunload solo cubre cierre de tab; navegación
  // App Router cambia URL sin recargar y se pierde el debounce de save.
  // Capture en `true` (capturing phase) para interceptar antes que el
  // handler del Link.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current) return;
      // Solo botón izquierdo, sin modifiers (Cmd+click, etc. abre tab nueva).
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (!anchor.href) return;
      try {
        const dest = new URL(anchor.href);
        if (dest.origin !== window.location.origin) return;
        if (dest.pathname === window.location.pathname) return;
      } catch {
        return;
      }
      const ok = window.confirm('You have unsaved branding changes. Leave anyway?');
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

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
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{branding.name}</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <button
              type="button"
              onClick={() => {
                if (!window.confirm('Discard pending branding changes?')) return;
                setBranding(persisted);
                dirtyRef.current = false;
                setSaveState('saved');
                if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
              }}
              className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              title="Discard pending changes and restore last saved branding"
            >
              Discard changes
            </button>
          )}
          <SaveStatusPill state={saveState} error={error} />
          <ThemeToggle />
        </div>
      </header>

      <main
        className="mx-auto flex max-w-[1280px] flex-col gap-10 px-4 pb-10 pt-6 sm:px-8 sm:pt-10"
        style={{ scrollMarginTop: '3.5rem' }}
      >
        <section>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">
            {branding.name}
          </h1>
          <p className="mt-2 text-[13.5px] text-zinc-500">
            Set the branding once — every product the client uses inherits it automatically.
          </p>
        </section>

        <section>
          <SectionHeading
            title="Branding & info"
            subtitle="Name, location, colors, logos, fonts and media. Changes autosave after ~1s."
          />
          <BrandingForm value={branding} onChange={handleChange} />
        </section>

        {/* Hallazgo S-11: diff pre-publish unificado. Lista los cambios
            pendientes de cada producto activo del cliente sin que el
            operador tenga que abrir cada editor por separado. */}
        <section>
          <PendingChangesPanel slug={slug} manifest={initialManifest} />
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6 shadow-sm dark:border-zinc-800 dark:from-zinc-900/60 dark:to-zinc-950">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
                Products
              </h2>
              <p className="mt-1 text-[13px] text-zinc-500">
                Open the editor of each active product or activate a new one. The client&apos;s
                branding is applied automatically.
              </p>
            </div>
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white dark:bg-white dark:text-zinc-950">
              {activeCount(initialManifest.products)} active
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProductCard
              slug={slug}
              segment="kiosk"
              productSegment="kiosks"
              label="Kiosks"
              description="Vertical touch screens with interactive modules."
              icon={Monitor}
              status="live"
              active={initialManifest.products.kiosks}
            />
            <ProductCard
              slug={slug}
              segment="digital-displays"
              productSegment="digital-displays"
              label="Digital Displays"
              description="Landscape no-touch signage rotating playlists."
              icon={Tv}
              status="live"
              active={initialManifest.products.digitalDisplays}
            />
            <ProductCard
              slug={slug}
              segment="mobile-pwa"
              productSegment="mobile-pwa"
              label="Mobile PWA"
              description="Progressive Web App that inherits the client's branding. Inicia sesión, guarda favoritos, navega offline."
              icon={Smartphone}
              status="soon"
              soonTimeline="In design · Q3 2026"
              active={initialManifest.products.mobilePwa}
            />
            <ProductCard
              slug={slug}
              segment="video-walls"
              productSegment="video-walls"
              label="Video Walls"
              description="Multi-screen synchronized compositions. Hasta 8 displays sincronizados con un compositor único."
              icon={LayoutGrid}
              status="soon"
              soonTimeline="On roadmap · Q4 2026"
              active={initialManifest.products.videoWalls}
            />
            <ProductCard
              slug={slug}
              segment="tablets"
              productSegment="tablets"
              label="Tablets"
              description="Touch-first tablet experiences for the floor. Variante portátil del kiosk para staff."
              icon={Tablet}
              status="soon"
              soonTimeline="Exploring · 2027"
              active={initialManifest.products.tablets}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function activeCount(products: ClientManifest['products']): number {
  return Object.values(products).filter(Boolean).length;
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-[12.5px] text-zinc-500">{subtitle}</p>
    </div>
  );
}

function SaveStatusPill({ state, error }: { state: SaveState; error: string | null }) {
  const label = (() => {
    if (state === 'saving')
      return {
        text: 'Saving…',
        dot: 'bg-amber-400 animate-pulse',
        color: 'text-amber-600 dark:text-amber-300',
      };
    if (state === 'error')
      return {
        text: error ?? 'Save failed',
        dot: 'bg-red-500',
        color: 'text-red-600 dark:text-red-400',
      };
    if (state === 'saved')
      return {
        text: 'All changes saved',
        dot: 'bg-emerald-500',
        color: 'text-emerald-600 dark:text-emerald-400',
      };
    // Hallazgo S-22: "Idle" era ambiguo. En reposo no hay estado que comunicar
    // — el branding ya está persistido en KV (cargado del manifest unified).
    return { text: 'Up to date', dot: 'bg-zinc-400 dark:bg-zinc-600', color: 'text-zinc-500' };
  })();
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-1.5 text-[11.5px] ${label.color}`}
      role="status"
      aria-live="polite"
      title={label.text}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${label.dot}`} aria-hidden />
      <span className="hidden sm:inline">{label.text}</span>
    </span>
  );
}

interface PendingProduct {
  changed?: number;
  files?: ReadonlyArray<{ path: string; action: 'create' | 'update' | 'unchanged' }>;
  unsupported?: boolean;
  error?: string;
}

interface PendingResponse {
  fsAvailable: boolean;
  totalChanged: number;
  products: {
    kiosks?: PendingProduct;
    digitalDisplays?: PendingProduct;
  };
}

/**
 * `<PendingChangesPanel>` — sección "Pending changes" en la Vista de
 * Cliente. Hallazgo S-11 del audit panorámico v2. Llama a
 * `GET /api/studio/clients/[slug]/pending` que orquesta el dry-run del
 * publish kiosk + comparación lightweight del signage.
 */
function PendingChangesPanel({ slug, manifest }: { slug: string; manifest: ClientManifest }) {
  const [data, setData] = useState<PendingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/studio/clients/${slug}/pending`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`pending check ${res.status}`);
      setData((await res.json()) as PendingResponse);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Pending check failed');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Si el cliente no tiene productos publicables activos, ocultar.
  if (!manifest.products.kiosks && !manifest.products.digitalDisplays) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionHeading
          title="Pending publish"
          subtitle="Files where the live config (KV) differs from the published filesystem. JSON whitespace is ignored — only real semantic differences are counted."
        />
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-3 w-3" aria-hidden />
          )}
          Refresh
        </button>
      </div>

      {err && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {err}
        </p>
      )}

      {!err && data && data.totalChanged === 0 && data.fsAvailable && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          ✓ All products are in sync with the published filesystem.
        </p>
      )}

      {!err && data && !data.fsAvailable && (
        <p className="rounded-md bg-sky-50 px-3 py-2 text-[12.5px] text-sky-800 dark:bg-sky-950/30 dark:text-sky-300">
          Filesystem read-only in this environment — diff is computed by GitHub when you click{' '}
          <strong>Publish</strong> in each product editor.
        </p>
      )}

      {!err && data && (
        <div className="grid gap-3 sm:grid-cols-2">
          {manifest.products.kiosks && (
            <PendingProductRow
              label="Kiosks"
              icon={Monitor}
              href={`/studio/${slug}/kiosk`}
              detail={data.products.kiosks}
            />
          )}
          {manifest.products.digitalDisplays && (
            <PendingProductRow
              label="Digital Displays"
              icon={Tv}
              href={`/studio/${slug}/digital-displays`}
              detail={data.products.digitalDisplays}
            />
          )}
        </div>
      )}
    </div>
  );
}

function PendingProductRow({
  label,
  icon: Icon,
  href,
  detail,
}: {
  label: string;
  icon: typeof Monitor;
  href: string;
  detail: PendingProduct | undefined;
}) {
  const changed = detail?.changed ?? 0;
  const isUnsupported = detail?.unsupported;
  const hasError = detail?.error != null;

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/40 px-4 py-3 transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800">
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-zinc-900 dark:text-white">{label}</span>
          {hasError ? (
            <span className="inline-flex items-center gap-1 text-[11.5px] text-red-600 dark:text-red-400">
              <CircleAlert className="h-3 w-3" aria-hidden />
              {detail?.error?.slice(0, 60)}
            </span>
          ) : isUnsupported ? (
            <span className="text-[11.5px] text-zinc-500">Diff via GitHub on publish</span>
          ) : changed === 0 ? (
            <span className="text-[11.5px] text-emerald-600 dark:text-emerald-400">In sync</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11.5px] text-amber-700 dark:text-amber-400">
              <FileEdit className="h-3 w-3" aria-hidden />
              {changed} file{changed === 1 ? '' : 's'} pending
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
    </Link>
  );
}
