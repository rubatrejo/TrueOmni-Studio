'use client';

import { useEffect } from 'react';

import type { VideoWallClientFile, VideoWallConfig } from '@/lib/video-walls/schema';

import { useVideoWallBridgeStore } from './video-wall-bridge-store';

/**
 * `<VideoWallBridge>` — Comunicación bidireccional editor ↔ iframe (runtime).
 *
 * Responsabilidades:
 *  1. Emitir handshake `videowall:ready` al `window.parent` al montar.
 *  2. Heartbeat cada 5s con el mismo type para que el editor detecte si el
 *     iframe se cuelga (status `stale`/`lost`).
 *  3. Escuchar postMessage del editor:
 *     - `videowall:client-update { client: Partial<VideoWallClientFile> }`
 *     - `videowall:wall-update   { wall:   Partial<VideoWallConfig>     }`
 *  4. Popular `useVideoWallBridgeStore` con los patches. El runtime
 *     (VideoWallRuntime + style applier) los consume con fallback a las
 *     props del server.
 *
 * Si el runtime no está embebido (`window.parent === window`), el handshake se
 * emite igual pero nadie escucha — la página funciona standalone sin
 * problemas.
 */
export interface VideoWallBridgeProps {
  clientSlug: string;
  wallSlug: string;
}

export function VideoWallBridge({ clientSlug, wallSlug }: VideoWallBridgeProps) {
  const setClientPatch = useVideoWallBridgeStore((s) => s.setClientPatch);
  const setWallPatch = useVideoWallBridgeStore((s) => s.setWallPatch);

  useEffect(() => {
    const target = window.parent;
    if (!target) return;

    function emitReady() {
      try {
        target.postMessage({ type: 'videowall:ready', clientSlug, wallSlug, ts: Date.now() }, '*');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[videowall:bridge] postMessage failed', e);
      }
    }

    // Handshake inicial.
    emitReady();
    // Heartbeat cada 5s.
    const heartbeat = window.setInterval(emitReady, 5000);

    function onMessage(event: MessageEvent) {
      const data = event.data as {
        type?: string;
        client?: Partial<VideoWallClientFile>;
        wall?: Partial<VideoWallConfig>;
      } | null;
      if (!data || typeof data.type !== 'string') return;

      if (data.type === 'videowall:client-update' && data.client) {
        setClientPatch(data.client);
      } else if (data.type === 'videowall:wall-update' && data.wall) {
        setWallPatch(data.wall);
      }
    }

    window.addEventListener('message', onMessage);
    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener('message', onMessage);
    };
  }, [clientSlug, wallSlug, setClientPatch, setWallPatch]);

  return null;
}
