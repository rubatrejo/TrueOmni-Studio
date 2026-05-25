import Link from 'next/link';
import { notFound } from 'next/navigation';

import { loadUnifiedBranding, unifiedToSignageBranding } from '@/lib/studio/client-branding-sync';
import { loadClientManifest } from '@/lib/studio/client-manifest';
import { kv } from '@/lib/studio/kv';
import { listVideoWalls, loadVideoWallClient } from '@/lib/video-walls/config';
import { GRID_CONFIGS } from '@/lib/video-walls/dimensions';
import { kVideoWallClient, kVideoWallClientList } from '@/lib/video-walls/kv-keys';
import { VideoWallClientFileSchema, type VideoWallClientFile } from '@/lib/video-walls/schema';

import { Breadcrumb } from '../../_components/Breadcrumb';
import { StudioBrand } from '../../_components/StudioBrand';
import { ThemeToggle } from '../../_components/ThemeToggle';

import { GridGlyph, NewWallCard } from './_components/NewWallCard';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Video Walls · TrueOmni Studio',
};

/**
 * `/studio/[slug]/video-walls` — dashboard de walls del cliente.
 *
 * Reemplaza el stub ComingSoon de VW1. Patrón idéntico al dashboard de
 * Digital Displays con dos diferencias:
 *   1. Cada card muestra un GridGlyph (no Tv icon).
 *   2. NewWallCard tiene picker de 5 grids (no orientation picker).
 *
 * Drift recovery: si manifest.products.videoWalls=true pero el KV está
 * vacío (auto-migrate de un cliente legacy o reset del KV), clona desde
 * el template `default` aplicando branding unificado.
 */
export default async function ClientVideoWallsPage({ params }: PageProps) {
  const { slug } = await params;
  const [manifest, videoWallClientInitial] = await Promise.all([
    loadClientManifest(slug),
    loadVideoWallClient(slug),
  ]);
  if (!manifest) notFound();

  // Drift recovery: manifest activo pero el videowall client se perdió.
  let videoWallClient = videoWallClientInitial;
  if (!videoWallClient && manifest.products.videoWalls) {
    const template = await loadVideoWallClient('default');
    const branding = await loadUnifiedBranding(slug);
    if (template) {
      const fileShape: VideoWallClientFile = {
        slug,
        name: manifest.name,
        locale: template.locale,
        timezone: template.timezone,
        location: {
          ...template.location,
          ...(branding?.location?.city ? { city: branding.location.city } : null),
          ...(branding?.location?.lat != null ? { lat: branding.location.lat } : null),
          ...(branding?.location?.lon != null ? { lon: branding.location.lon } : null),
        },
        website:
          (branding?.website && branding.website.trim().length > 0
            ? branding.website.trim()
            : undefined) ??
          (template.website && template.website.trim().length > 0
            ? template.website.trim()
            : undefined),
        branding: {
          ...structuredClone(template.branding),
          ...(branding ? unifiedToSignageBranding(branding) : {}),
        },
        header: structuredClone(template.header),
        walls: [],
      };
      const validated = VideoWallClientFileSchema.safeParse(fileShape);
      if (validated.success) {
        await kv.set(kVideoWallClient(slug), validated.data);
        await kv.sadd(kVideoWallClientList, slug);
        videoWallClient = await loadVideoWallClient(slug);
      }
    }
  }
  if (!videoWallClient) {
    // El producto no está activo o no se pudo recoverar.
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-zinc-200 bg-white/95 px-5 dark:border-zinc-900 dark:bg-zinc-950/95">
          <StudioBrand />
        </header>
        <main className="mx-auto max-w-[680px] px-4 py-16">
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
            Video Walls not activated for this client
          </h1>
          <p className="mt-2 text-[13px] text-zinc-500">
            Go to the client view and click <span className="font-semibold">Activate</span> on the
            Video Walls product card.
          </p>
          <Link
            href={`/studio/${slug}`}
            className="mt-6 inline-flex items-center gap-1 text-[13px] font-medium text-sky-600 dark:text-sky-400"
          >
            ← Back to {manifest.name}
          </Link>
        </main>
      </div>
    );
  }

  const walls = await listVideoWalls(slug);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white/95 px-5 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/95">
        <div className="flex items-center gap-4">
          <StudioBrand />
          <span className="block h-5 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden />
          <Breadcrumb
            items={[
              { label: 'Clients', href: '/studio' },
              { label: manifest.name, href: `/studio/${slug}` },
              { label: 'Video Walls' },
            ]}
          />
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
              Video Walls
            </h1>
            <p className="mt-1 text-[13px] text-zinc-500">
              {walls.length} wall{walls.length === 1 ? '' : 's'} configured for {manifest.name}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {walls.map((w) => {
            const { cols, rows } = GRID_CONFIGS[w.grid];
            return (
              <Link
                key={w.slug}
                href={`/studio/${slug}/video-walls/${w.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
              >
                <div
                  className="grid h-32 place-items-center text-white/90"
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--signage-brand-primary, 211 100% 25%)) 0%, hsl(var(--signage-brand-secondary, 200 100% 50%)) 100%)`,
                  }}
                >
                  <GridGlyph grid={w.grid} size={50} />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-[15px] font-semibold leading-tight text-zinc-900 dark:text-white">
                      {w.name ?? w.slug}
                    </h3>
                    <span
                      className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      title={`${cols * 1920}×${rows * 1080} px canvas`}
                    >
                      {w.grid}
                    </span>
                  </div>
                  <span className="mt-1 font-mono text-[11px] text-zinc-500">{w.slug}</span>
                  <div className="mt-3 flex items-center justify-between text-[12px] text-zinc-500">
                    <span>
                      {w.slidesCount} slide{w.slidesCount === 1 ? '' : 's'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                      Open editor →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          <NewWallCard clientSlug={slug} existingSlugs={walls.map((w) => w.slug)} />
        </div>
      </main>
    </div>
  );
}
