import { notFound } from 'next/navigation';

import { loadSignageClient, loadSignageTokensCss } from '@/lib/signage/config';
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
  const [manifest, vwClient, signageClient, wall, tokensCss] = await Promise.all([
    loadClientManifest(slug),
    loadVideoWallClient(slug),
    // Cliente signage: branding/header/events/social/news son compartidos
    // entre Digital Displays y Video Walls vía KV `signage:client:{slug}`.
    // Si el cliente no tiene displays signage, caemos al VW client (mismo shape).
    loadSignageClient(slug).catch(() => null),
    loadVideoWall(slug, wallSlug),
    loadSignageTokensCss(slug).catch(() => ''),
  ]);
  if (!manifest || !vwClient || !wall) notFound();

  // Si no hay cliente signage, sintetizar uno desde el VW client (branding/
  // header/events/social/news vienen igual del KV unificado).
  const client = signageClient ?? {
    ...vwClient,
    displays: [],
  };

  return (
    <WallEditorShell
      clientSlug={slug}
      clientName={manifest.name}
      client={client}
      tokensCss={tokensCss}
      wallSlug={wall.slug}
      wallName={wall.name}
      grid={wall.grid}
      initialWall={wall}
    />
  );
}
