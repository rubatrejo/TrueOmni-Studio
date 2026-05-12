'use client';

import { useMemo } from 'react';

import type { SignageHeaderWeather } from '@/lib/signage/weather-adapter';
import type { VideoWallClientResolved, VideoWallConfig } from '@/lib/video-walls/schema';

import { PLACEHOLDER_WEATHER, VideoWallHeader } from '../header/VideoWallHeader';
import '../templates/load-templates';
import { getTemplate } from '../templates/registry';

import { BezelOverlay } from './BezelOverlay';

/**
 * <VideoWallRuntime>
 *
 * Pinta el header continuo top + el slide activo del wall + bezel overlay.
 *
 * Si la playlist está vacía, monta el template `00-placeholder` solo
 * en grid 3×2 (que es donde está registrado). Para otros grids, monta
 * el primer template registrado.
 *
 * VW6+ cableará el VideoWallPlayer con rotación y transitions. Por
 * ahora solo se muestra el primer slide.
 */
export interface VideoWallRuntimeProps {
  client: VideoWallClientResolved;
  wall: VideoWallConfig;
  weather?: SignageHeaderWeather;
  showBezels?: boolean;
}

export function VideoWallRuntime({
  client,
  wall,
  weather,
  showBezels = true,
}: VideoWallRuntimeProps) {
  const slide = useMemo(() => wall.playlist[0] ?? null, [wall.playlist]);
  const fallbackId = wall.grid === '3x2' ? '00-placeholder' : '01-video-image-full';
  const templateId = slide?.templateId ?? fallbackId;
  const template = getTemplate(templateId, wall.grid);

  return (
    <>
      <VideoWallHeader client={client} weather={weather ?? PLACEHOLDER_WEATHER} grid={wall.grid} />
      {template ? (
        <template.Render client={client} wall={wall} slots={slide?.slots ?? []} />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-white"
          style={{ backgroundColor: '#1a1a1a', fontFamily: 'system-ui', fontSize: 80 }}
        >
          Template &quot;{templateId}&quot; not found for grid {wall.grid}
        </div>
      )}
      <BezelOverlay grid={wall.grid} visible={showBezels} />
    </>
  );
}
