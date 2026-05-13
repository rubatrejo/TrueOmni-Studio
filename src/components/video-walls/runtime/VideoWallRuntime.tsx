'use client';

import { useMemo } from 'react';

import type { SignageHeaderWeather } from '@/lib/signage/weather-adapter';
import { HEADER_H } from '@/lib/video-walls/dimensions';
import type { VideoWallClientResolved, VideoWallConfig } from '@/lib/video-walls/schema';

import { PLACEHOLDER_WEATHER, VideoWallHeader } from '../header/VideoWallHeader';
import '../templates/load-templates';
import { getTemplate } from '../templates/registry';

import { BezelOverlay } from './BezelOverlay';
import { useVideoWallBridgeStore } from './video-wall-bridge-store';

/**
 * <VideoWallRuntime>
 *
 * Pinta header + slide activo + bezel overlay. Si la playlist está
 * vacía, NO renderea un placeholder colorido — pinta solo el header
 * sobre fondo negro liso, igual que el runtime signage cuando el
 * display no tiene slides activos.
 *
 * Lectura híbrida cuando está embebido en el editor:
 *  - `wallPatch` del bridge store overridea fields del `wall` server
 *    (playlist/settings/grid). Permite preview reactivo sin reload del
 *    iframe (autosave → postMessage → re-render).
 *  - `clientPatch.branding` se aplica via `VideoWallBridgeStyleApplier`
 *    sobre los tokens CSS; aquí mergeamos el resto del client (header
 *    config, events, social, news) sobre la prop server.
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
  const clientPatch = useVideoWallBridgeStore((s) => s.clientPatch);
  const wallPatch = useVideoWallBridgeStore((s) => s.wallPatch);

  // Merge no-destructivo: el patch tiene precedencia sobre la prop server.
  // El styling (tokens CSS / fonts) lo aplica el StyleApplier; aquí solo
  // mergeamos data estructural usada por el header + templates.
  const effectiveClient = useMemo<VideoWallClientResolved>(() => {
    if (!clientPatch) return client;
    return {
      ...client,
      ...clientPatch,
      // Para subcampos críticos del runtime hacemos merge shallow controlado
      // — evitamos que un patch parcial (e.g. solo branding) borre header,
      // events, social, news.
      branding: { ...client.branding, ...(clientPatch.branding ?? {}) },
      header: { ...client.header, ...(clientPatch.header ?? {}) },
      location: { ...client.location, ...(clientPatch.location ?? {}) },
    };
  }, [client, clientPatch]);

  const effectiveWall = useMemo<VideoWallConfig>(() => {
    if (!wallPatch) return wall;
    return {
      ...wall,
      ...wallPatch,
      settings: { ...wall.settings, ...(wallPatch.settings ?? {}) },
      playlist: wallPatch.playlist ?? wall.playlist,
    };
  }, [wall, wallPatch]);

  const slide = useMemo(() => {
    if (effectiveWall.playlist.length === 0) return null;
    const i = Math.max(0, Math.min(slideIndex, effectiveWall.playlist.length - 1));
    return effectiveWall.playlist[i] ?? null;
  }, [effectiveWall.playlist, slideIndex]);
  const template = slide ? getTemplate(slide.templateId, effectiveWall.grid) : null;

  return (
    <>
      <VideoWallHeader
        client={effectiveClient}
        weather={weather ?? PLACEHOLDER_WEATHER}
        grid={effectiveWall.grid}
      />
      {slide && template ? (
        <template.Render client={effectiveClient} wall={effectiveWall} slots={slide.slots} />
      ) : (
        <EmptyState headerH={HEADER_H} />
      )}
      <BezelOverlay grid={effectiveWall.grid} visible={showBezels} />
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
