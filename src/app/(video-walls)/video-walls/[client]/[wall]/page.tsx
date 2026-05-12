import { notFound } from 'next/navigation';

import { VideoWallRuntime } from '@/components/video-walls/runtime/VideoWallRuntime';
import { VideoWallStage } from '@/components/video-walls/stage/VideoWallStage';
import { mapWeatherToHeader } from '@/lib/signage/weather-adapter';
import { loadVideoWall, loadVideoWallClient } from '@/lib/video-walls/config';
import { parseCellParam } from '@/lib/video-walls/dimensions';
import { fetchWeather } from '@/lib/weather';

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

  const sourceParam = Array.isArray(search?.source) ? search.source[0] : search?.source;
  const preferFs = sourceParam === 'fs';

  const [clientCfg, wallCfg] = await Promise.all([
    loadVideoWallClient(clientSlug),
    loadVideoWall(clientSlug, wallSlug, { preferFs }),
  ]);
  if (!clientCfg || !wallCfg) notFound();

  // Weather real (server-side, cached): mismo adapter que signage. Si el
  // fetch falla, `mapWeatherToHeader` retorna placeholder con "--°".
  const weatherData = await fetchWeather(clientCfg.location.lat, clientCfg.location.lon).catch(
    (err: unknown) => {
      // eslint-disable-next-line no-console
      console.warn(`[video-walls] weather fetch falló para ${clientSlug}:`, (err as Error).message);
      return null;
    },
  );
  const weather = mapWeatherToHeader(weatherData, clientCfg.locale, clientCfg.timezone, 3);

  const cell = parseCellParam(search?.cell, wallCfg.grid);
  const bezelParam = Array.isArray(search?.bezels) ? search.bezels[0] : search?.bezels;
  const showBezels = bezelParam !== '0';
  const debug = search?.debug === '1';
  const slideParam = Array.isArray(search?.slide) ? search.slide[0] : search?.slide;
  const slideIndex = slideParam ? Math.max(0, Number.parseInt(slideParam, 10) || 0) : 0;

  return (
    <VideoWallStage grid={wallCfg.grid} cell={cell ?? undefined} debug={debug}>
      <VideoWallRuntime
        client={clientCfg}
        wall={wallCfg}
        weather={weather}
        showBezels={showBezels && !cell}
        slideIndex={slideIndex}
      />
    </VideoWallStage>
  );
}
