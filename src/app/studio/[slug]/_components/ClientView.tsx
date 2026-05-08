'use client';

import {
  ChevronRight,
  LayoutGrid,
  Monitor,
  Smartphone,
  Tablet,
  Tv,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

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

export function ClientView({
  slug,
  initialManifest,
  initialBranding,
}: ClientViewProps) {
  const [branding, setBranding] = useState<UnifiedClientBranding>(initialBranding);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

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
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {branding.name}
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <SaveStatusPill state={saveState} error={error} />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-[1280px] flex-col gap-10 px-4 py-10 sm:px-8">
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

        <section className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6 shadow-sm dark:border-zinc-800 dark:from-zinc-900/60 dark:to-zinc-950">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
                Products
              </h2>
              <p className="mt-1 text-[13px] text-zinc-500">
                Open the editor of each active product or activate a new one. The client's branding is applied automatically.
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
              label="Kiosks"
              description="Vertical touch screens with interactive modules."
              icon={Monitor}
              status="live"
              active={initialManifest.products.kiosks}
            />
            <ProductCard
              slug={slug}
              segment="digital-displays"
              label="Digital Displays"
              description="Landscape no-touch signage rotating playlists."
              icon={Tv}
              status="live"
              active={initialManifest.products.digitalDisplays}
            />
            <ProductCard
              slug={slug}
              segment="mobile-pwa"
              label="Mobile PWA"
              description="Progressive Web App that inherits the client's branding."
              icon={Smartphone}
              status="soon"
              active={initialManifest.products.mobilePwa}
            />
            <ProductCard
              slug={slug}
              segment="video-walls"
              label="Video Walls"
              description="Multi-screen synchronized compositions."
              icon={LayoutGrid}
              status="soon"
              active={initialManifest.products.videoWalls}
            />
            <ProductCard
              slug={slug}
              segment="tablets"
              label="Tablets"
              description="Touch-first tablet experiences for the floor."
              icon={Tablet}
              status="soon"
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
      <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 text-[12.5px] text-zinc-500">{subtitle}</p>
    </div>
  );
}

function SaveStatusPill({ state, error }: { state: SaveState; error: string | null }) {
  const label = (() => {
    if (state === 'saving') return { text: 'Saving…', dot: 'bg-amber-400 animate-pulse', color: 'text-amber-600 dark:text-amber-300' };
    if (state === 'error') return { text: error ?? 'Save failed', dot: 'bg-red-500', color: 'text-red-600 dark:text-red-400' };
    if (state === 'saved') return { text: 'Saved', dot: 'bg-emerald-500', color: 'text-emerald-600 dark:text-emerald-400' };
    return { text: 'Idle', dot: 'bg-zinc-400 dark:bg-zinc-600', color: 'text-zinc-500' };
  })();
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-1.5 text-[11.5px] ${label.color}`}
      title={label.text}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${label.dot}`} />
      <span className="hidden sm:inline">{label.text}</span>
    </span>
  );
}
