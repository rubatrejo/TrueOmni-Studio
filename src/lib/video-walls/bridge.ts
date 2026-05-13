'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { VideoWallClientFile, VideoWallConfig } from './schema';

/**
 * `useVideoWallBridge` — Hook del editor de Video Walls para comunicarse con el
 * iframe del runtime (paridad con `useSignageBridge` del Digital Displays).
 *
 * Responsabilidades:
 *  - Mantener `iframeRef` para asignar al `<iframe>` del WallPreviewPanel.
 *  - Recibir handshake `videowall:ready` del runtime y resendear los pushes
 *    pendientes (race condition: el host puede pushear antes de que el
 *    listener del iframe esté montado/hidratado).
 *  - Heartbeat tracking: `lastAckAt` se actualiza con cada `videowall:ready`
 *    (handshake inicial + heartbeat 5s del bridge runtime).
 *  - `bridgeStatus` derivado: `connecting` | `connected` | `stale` | `lost`.
 *  - `pushClient(client)` / `pushWall(wall)`: postMessage al iframe con
 *    debounce 120ms y primer push inmediato.
 *
 * Mismo protocolo que el bridge signage pero con namespace `videowall:*` para
 * que ambos productos puedan coexistir en la misma pestaña sin colisión.
 */
type ReadyAck = { type: 'videowall:ready'; clientSlug?: string; wallSlug?: string };

export type VideoWallBridgeStatus = 'connecting' | 'connected' | 'stale' | 'lost';

export function useVideoWallBridge() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastClientRef = useRef<Partial<VideoWallClientFile> | null>(null);
  const lastWallRef = useRef<Partial<VideoWallConfig> | null>(null);
  const clientDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wallDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [lastAckAt, setLastAckAt] = useState<number | null>(null);
  const [mountAt, setMountAt] = useState(() => Date.now());
  const [, setNowTick] = useState(0);

  // Ticker 1s para que el bridgeStatus refleje el paso del tiempo.
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const sendClientNow = useCallback((client: Partial<VideoWallClientFile>) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'videowall:client-update', client }, '*');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[videowall:bridge:editor] postMessage failed', e);
    }
  }, []);

  const sendWallNow = useCallback((wall: Partial<VideoWallConfig>) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'videowall:wall-update', wall }, '*');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[videowall:bridge:editor] postMessage failed', e);
    }
  }, []);

  // Listener del handshake/heartbeat del runtime.
  useEffect(() => {
    function handler(event: MessageEvent) {
      const data = event.data as ReadyAck | null;
      if (!data) return;
      if (data.type === 'videowall:ready') {
        setIsReady(true);
        setLastAckAt(Date.now());
        // Resendear pushes pendientes (race).
        if (lastClientRef.current) sendClientNow(lastClientRef.current);
        if (lastWallRef.current) sendWallNow(lastWallRef.current);
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sendClientNow, sendWallNow]);

  const pushClient = useCallback(
    (client: Partial<VideoWallClientFile>) => {
      const wasFirstPush = lastClientRef.current === null;
      lastClientRef.current = client;
      if (clientDebounceRef.current) clearTimeout(clientDebounceRef.current);
      // Primer push: inmediato; subsiguientes: debounce 120ms (mismo patrón
      // que el bridge signage).
      if (wasFirstPush) {
        sendClientNow(client);
      } else {
        clientDebounceRef.current = setTimeout(() => sendClientNow(client), 120);
      }
    },
    [sendClientNow],
  );

  const pushWall = useCallback(
    (wall: Partial<VideoWallConfig>) => {
      const wasFirstPush = lastWallRef.current === null;
      lastWallRef.current = wall;
      if (wallDebounceRef.current) clearTimeout(wallDebounceRef.current);
      if (wasFirstPush) {
        sendWallNow(wall);
      } else {
        wallDebounceRef.current = setTimeout(() => sendWallNow(wall), 120);
      }
    },
    [sendWallNow],
  );

  const onIframeLoad = useCallback(() => {
    setIsReady(false);
    setLastAckAt(null);
    setMountAt(Date.now());
    // Re-enviar los últimos pushes después del load. El VideoWallBridge del
    // iframe se monta como Client Component que necesita hidratación; entre
    // que el iframe dispatcha `load` y que React hidrata el listener pueden
    // pasar varios cientos de ms. Reenviamos en una secuencia escalonada
    // para asegurar que al menos uno llega post-hidratación. El bridge guarda
    // el último patch en zustand, así que repeticiones son idempotentes.
    const winRef = () => iframeRef.current?.contentWindow;
    [50, 300, 800, 1500].forEach((delay) => {
      setTimeout(() => {
        const win = winRef();
        if (!win) return;
        if (lastClientRef.current) {
          try {
            win.postMessage(
              { type: 'videowall:client-update', client: lastClientRef.current },
              '*',
            );
          } catch {
            // ignored
          }
        }
        if (lastWallRef.current) {
          try {
            win.postMessage({ type: 'videowall:wall-update', wall: lastWallRef.current }, '*');
          } catch {
            // ignored
          }
        }
      }, delay);
    });
  }, []);

  const bridgeStatus: VideoWallBridgeStatus = (() => {
    const now = Date.now();
    if (lastAckAt === null) {
      return now - mountAt < 5000 ? 'connecting' : 'lost';
    }
    const elapsed = now - lastAckAt;
    if (elapsed < 7000) return 'connected';
    if (elapsed < 30000) return 'stale';
    return 'lost';
  })();

  return {
    iframeRef,
    pushClient,
    pushWall,
    onIframeLoad,
    isReady,
    bridgeStatus,
  };
}
