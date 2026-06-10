'use client';

import { useEffect, useMemo, useState } from 'react';

import { getNowFromSearch, isSlideActive, msUntilNextMinute } from '@/lib/signage/schedule';
import type { SignageHeaderWeather } from '@/lib/signage/weather-adapter';
import { HEADER_H } from '@/lib/video-walls/dimensions';
import { msUntilNextSlide, slideIndexAtTime } from '@/lib/video-walls/rotation';
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
function readSearchParams(): URLSearchParams | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search);
}

export interface VideoWallRuntimeProps {
  client: VideoWallClientResolved;
  wall: VideoWallConfig;
  weather?: SignageHeaderWeather;
  showBezels?: boolean;
  /**
   * Índice de slide para el QA freeze (`?slide=N`): el runtime lo pinta fijo,
   * sin rotar ni filtrar por dayparting (diffs pixel-perfect del revisor-visual).
   * Sin `?slide`, el wall ROTA su playlist por reloj (default 0 solo para el
   * primer paint antes de que el cliente tome el control).
   */
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
  const eventsPatch = useVideoWallBridgeStore((s) => s.eventsPatch);
  const socialPatch = useVideoWallBridgeStore((s) => s.socialPatch);
  const newsPatch = useVideoWallBridgeStore((s) => s.newsPatch);

  // Merge no-destructivo: el patch tiene precedencia sobre la prop server.
  // El styling (tokens CSS / fonts) lo aplica el StyleApplier; aquí solo
  // mergeamos data estructural usada por el header + templates.
  //
  // Eventos/social/news llegan por canales independientes (los Tabs DD
  // guardan vía endpoints `/content?kind=...`) pero se mergean aquí sobre
  // el client resolved para que los templates VW (events / social / news
  // slots) reciban la versión más fresca sin reload del iframe.
  const effectiveClient = useMemo<VideoWallClientResolved>(() => {
    const base: VideoWallClientResolved = clientPatch
      ? {
          ...client,
          ...clientPatch,
          branding: { ...client.branding, ...(clientPatch.branding ?? {}) },
          header: { ...client.header, ...(clientPatch.header ?? {}) },
          location: { ...client.location, ...(clientPatch.location ?? {}) },
        }
      : client;
    return {
      ...base,
      events: eventsPatch ?? base.events,
      social: socialPatch ?? base.social,
      news: newsPatch ?? base.news,
    };
  }, [client, clientPatch, eventsPatch, socialPatch, newsPatch]);

  const effectiveWall = useMemo<VideoWallConfig>(() => {
    if (!wallPatch) return wall;
    return {
      ...wall,
      ...wallPatch,
      settings: { ...wall.settings, ...(wallPatch.settings ?? {}) },
      playlist: wallPatch.playlist ?? wall.playlist,
    };
  }, [wall, wallPatch]);

  // Reloj reactivo para el dayparting. Dev override `?clock=HH:MM&day=...` (QA).
  const [now, setNow] = useState<Date>(() => new Date());
  const [clockOverride, setClockOverride] = useState(false);
  // QA freeze (`?slide=N`): el wall se queda en ese slide sin rotar.
  const [qaFreeze, setQaFreeze] = useState(false);
  // Índice DENTRO de `effectivePlaylist` (arranca en el prop para un primer
  // paint estable; el cliente lo recalcula por reloj tras montar).
  const [currentIdx, setCurrentIdx] = useState(slideIndex);

  // Mount client-only: leer los overrides de la URL.
  useEffect(() => {
    const sp = readSearchParams();
    if (sp?.get('slide')) {
      setQaFreeze(true);
      return;
    }
    if (sp && (sp.get('clock') || sp.get('day'))) {
      setNow(getNowFromSearch(sp, client.timezone));
      setClockOverride(true);
    }
  }, [client.timezone]);

  // Re-evaluación del wall-clock cada minuto (dayparting). Congelada si hay dev
  // override de reloj (QA del gate).
  useEffect(() => {
    if (clockOverride) return;
    let cancelled = false;
    let timer = 0;
    const tick = () => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        setNow(new Date());
        tick();
      }, msUntilNextMinute(new Date()));
    };
    tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [clockOverride]);

  // Playlist efectiva tras el dayparting por slide (F-SIGNAGE-3).
  const effectivePlaylist = useMemo(
    () => effectiveWall.playlist.filter((s) => isSlideActive(s.schedule, now, client.timezone)),
    [effectiveWall.playlist, now, client.timezone],
  );

  // Rotación determinista por reloj (F-SIGNAGE-1/2). El índice sale de
  // `slideIndexAtTime(epoch)` → todas las celdas del wall convergen al mismo
  // slide sin coordinación. `setTimeout` al borde exacto del slide actual.
  useEffect(() => {
    if (qaFreeze) return;
    if (effectivePlaylist.length === 0) {
      setCurrentIdx(0);
      return;
    }
    let cancelled = false;
    let timer = 0;
    const schedule = () => {
      const epoch = Date.now();
      setCurrentIdx(slideIndexAtTime(effectivePlaylist, epoch));
      const wait = msUntilNextSlide(effectivePlaylist, epoch);
      if (!Number.isFinite(wait)) return;
      timer = window.setTimeout(
        () => {
          if (!cancelled) schedule();
        },
        Math.max(250, wait),
      );
    };
    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [qaFreeze, effectivePlaylist]);

  const slide = useMemo(() => {
    // QA freeze: render exacto del slide pedido, sin filtrar por dayparting.
    if (qaFreeze) {
      if (effectiveWall.playlist.length === 0) return null;
      const i = Math.max(0, Math.min(slideIndex, effectiveWall.playlist.length - 1));
      return effectiveWall.playlist[i] ?? null;
    }
    if (effectivePlaylist.length === 0) return null;
    const i = Math.max(0, Math.min(currentIdx, effectivePlaylist.length - 1));
    return effectivePlaylist[i] ?? null;
  }, [qaFreeze, effectiveWall.playlist, effectivePlaylist, currentIdx, slideIndex]);
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
