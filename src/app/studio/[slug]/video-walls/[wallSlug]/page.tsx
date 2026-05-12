import { notFound } from 'next/navigation';

import { loadClientManifest } from '@/lib/studio/client-manifest';
import { loadVideoWall, loadVideoWallClient } from '@/lib/video-walls/config';

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
 * El topbar + breadcrumb + theme toggle viven dentro de `<WallEditorShell>`
 * via `<WallTopBar>`, igual que el editor de Digital Displays. Sin doble
 * header.
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
    <WallEditorShell
      clientSlug={slug}
      clientName={manifest.name}
      wallSlug={wall.slug}
      wallName={wall.name}
      grid={wall.grid}
      initialWall={wall}
    />
  );
}
