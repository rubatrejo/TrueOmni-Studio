import { notFound } from 'next/navigation';

import { VideoWallRuntime } from '@/components/video-walls/runtime/VideoWallRuntime';
import { VideoWallStage } from '@/components/video-walls/stage/VideoWallStage';
import { loadVideoWall, loadVideoWallClient } from '@/lib/video-walls/config';
import { parseCellParam } from '@/lib/video-walls/dimensions';

interface PageProps {
  params: Promise<{ client: string; wall: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = 'force-dynamic';

/**
 * `/video-walls/[client]/[wall]` — runtime del producto Video Walls.
 *
 * Modos:
 *   - URL plain → canvas completo (preview editor).
 *   - `?cell=row,col` → crop a esa celda 1920×1080. Cada TV físico
 *     instala la URL con su param.
 *   - `?bezels=0` → suprime el overlay de bezels (default visible).
 *   - `?debug=1` → overlay top-right con scale + cell info.
 *
 * VW2: solo placeholder render. VW3 cablea VideoWallPlayer con
 * rotación de slides, schedule, transitions, bridge.
 */
export default async function VideoWallPage({ params, searchParams }: PageProps) {
  const { client: clientSlug, wall: wallSlug } = await params;
  const search = await searchParams;

  const [clientCfg, wallCfg] = await Promise.all([
    loadVideoWallClient(clientSlug),
    loadVideoWall(clientSlug, wallSlug),
  ]);
  if (!clientCfg || !wallCfg) notFound();

  const cell = parseCellParam(search?.cell, wallCfg.grid);
  const bezelParam = Array.isArray(search?.bezels) ? search.bezels[0] : search?.bezels;
  const showBezels = bezelParam !== '0';
  const debug = search?.debug === '1';

  return (
    <VideoWallStage grid={wallCfg.grid} cell={cell ?? undefined} debug={debug}>
      <VideoWallRuntime client={clientCfg} wall={wallCfg} showBezels={showBezels && !cell} />
    </VideoWallStage>
  );
}
