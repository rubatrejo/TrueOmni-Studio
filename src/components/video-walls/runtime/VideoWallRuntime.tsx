'use client';

import { useMemo } from 'react';

import type { VideoWallClientResolved, VideoWallConfig } from '@/lib/video-walls/schema';

import '../templates/load-templates';
import { getTemplate } from '../templates/registry';

import { BezelOverlay } from './BezelOverlay';

/**
 * <VideoWallRuntime>
 *
 * Pinta el slide activo del wall (VW2: solo el placeholder; VW3 cablea
 * el player con rotación y transiciones). Resuelve el template por
 * `(templateId, grid)` y delega el render.
 *
 * Si la playlist está vacía, pinta el template `00-placeholder` para
 * que la URL siempre tenga algo útil que mostrar (debug + verificación
 * de que el canvas + crop funcionan end-to-end).
 *
 * Bezels: `showBezels` controla el overlay. Default `true` para que el
 * editor preview lo vea siempre; el runtime real con `?cell=r,c` puede
 * suprimirlo pasando `?bezels=0`.
 */
export interface VideoWallRuntimeProps {
  client: VideoWallClientResolved;
  wall: VideoWallConfig;
  showBezels?: boolean;
}

export function VideoWallRuntime({ client, wall, showBezels = true }: VideoWallRuntimeProps) {
  const slide = useMemo(() => wall.playlist[0] ?? null, [wall.playlist]);
  const templateId = slide?.templateId ?? '00-placeholder';
  const template = getTemplate(templateId, wall.grid);

  return (
    <>
      {template ? (
        <template.Render client={client} wall={wall} slots={slide?.slots ?? []} />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 120,
            backgroundColor: '#1a1a1a',
          }}
        >
          Template &quot;{templateId}&quot; not found for grid {wall.grid}
        </div>
      )}
      <BezelOverlay grid={wall.grid} visible={showBezels} />
    </>
  );
}
