import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { loadClientManifest } from '@/lib/studio/client-manifest';
import { loadVideoWall, loadVideoWallClient } from '@/lib/video-walls/config';

import { StudioBrand } from '../../../_components/StudioBrand';
import { ThemeToggle } from '../../../_components/ThemeToggle';

import { WallEditorShell } from './_components/WallEditorShell';

interface PageProps {
  params: Promise<{ slug: string; wallSlug: string }>;
}

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Wall editor · TrueOmni Studio',
};

/**
 * `/studio/[slug]/video-walls/[wallSlug]` — editor de un video wall.
 *
 * VW5 minimal: TopBar + sidebar de tabs (stubs) + PreviewFrame. La
 * funcionalidad real (playlist editing, branding, settings, publish)
 * llega en VW6..VW9.
 */
export default async function VideoWallEditorPage({ params }: PageProps) {
  const { slug, wallSlug } = await params;
  const [manifest, client, wall] = await Promise.all([
    loadClientManifest(slug),
    loadVideoWallClient(slug),
    loadVideoWall(slug, wallSlug),
  ]);
  if (!manifest || !client || !wall) notFound();

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
            <Link
              href={`/studio/${slug}/video-walls`}
              className="transition hover:text-zinc-800 dark:hover:text-zinc-300"
            >
              Video Walls
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-700" aria-hidden />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{wall.name}</span>
          </nav>
        </div>
        <ThemeToggle />
      </header>

      <WallEditorShell
        clientSlug={slug}
        clientName={manifest.name}
        wallSlug={wall.slug}
        wallName={wall.name}
        grid={wall.grid}
      />
    </div>
  );
}
