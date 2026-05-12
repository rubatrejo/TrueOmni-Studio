'use client';

import { useMemo } from 'react';

import type { SignageHeaderWeather } from '@/lib/signage/weather-adapter';
import { HEADER_H } from '@/lib/video-walls/dimensions';
import type { VideoWallClientResolved, VideoWallConfig } from '@/lib/video-walls/schema';

import { PLACEHOLDER_WEATHER, VideoWallHeader } from '../header/VideoWallHeader';
import '../templates/load-templates';
import { getTemplate } from '../templates/registry';

import { BezelOverlay } from './BezelOverlay';

/**
 * <VideoWallRuntime>
 *
 * Pinta header + slide activo + bezel overlay. Si la playlist está
 * vacía, NO renderea un placeholder colorido — pinta solo el header
 * sobre fondo negro liso, igual que el runtime signage cuando el
 * display no tiene slides activos.
 *
 * VW6+ cableará el VideoWallPlayer con rotación y transitions. Por
 * ahora solo se muestra el primer slide.
 */
export interface VideoWallRuntimeProps {
  client: VideoWallClientResolved;
  wall: VideoWallConfig;
  weather?: SignageHeaderWeather;
  showBezels?: boolean;
  /** Índice del slide a renderizar (clamp a playlist length). Default 0. */
  slideIndex?: number;
}

export function VideoWallRuntime({
  client,
  wall,
  weather,
  showBezels = true,
  slideIndex = 0,
}: VideoWallRuntimeProps) {
  const slide = useMemo(() => {
    if (wall.playlist.length === 0) return null;
    const i = Math.max(0, Math.min(slideIndex, wall.playlist.length - 1));
    return wall.playlist[i] ?? null;
  }, [wall.playlist, slideIndex]);
  const template = slide ? getTemplate(slide.templateId, wall.grid) : null;

  return (
    <>
      <VideoWallHeader client={client} weather={weather ?? PLACEHOLDER_WEATHER} grid={wall.grid} />
      {slide && template ? (
        <template.Render client={client} wall={wall} slots={slide.slots} />
      ) : (
        <EmptyState headerH={HEADER_H} />
      )}
      <BezelOverlay grid={wall.grid} visible={showBezels} />
    </>
  );
}

/** Estado vacío — wall sin slides. Fondo negro liso bajo el header.
 *  Sin contenido visual (no inventar placeholders). */
function EmptyState({ headerH }: { headerH: number }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        top: headerH,
        backgroundColor: '#000',
      }}
    />
  );
}
