'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { SignageClientFile, SignageDisplayConfig } from '@/lib/signage/schema';

/**
 * `useSignageBridge` — Hook del editor signage para comunicarse con el iframe
 * del runtime (DSS3).
 *
 * Mismo patrón que `usePreviewBridge` del kiosk pero con shape simplificada
 * (signage solo tiene 2 entidades: client + display, vs 18+ del kiosk).
 *
 * Responsabilidades:
 *  - Mantener `iframeRef` para asignar al `<iframe>`.
 *  - Recibir handshake `signage:ready` del runtime y resendear pushes
 *    pendientes (race condition: el host puede pushear antes de que el
 *    listener del iframe esté montado).
 *  - Heartbeat tracking: `lastAckAt` se actualiza con cada `signage:ready`
 *    (handshake inicial + heartbeat 5s del bridge runtime).
 *  - `bridgeStatus` derivado: `connecting` | `connected` | `stale` | `lost`.
 *  - `pushClient(client)` / `pushDisplay(display)`: postMessage al iframe con
 *    debounce 120ms.
 *
 * **DSS3** entrega la infraestructura. Los pushes reales (cuando DSS4-5
 * habilite formularios editables) usarán pushClient/pushDisplay desde el
 * sidebar.
 */
type ReadyAck = { type: 'signage:ready'; clientSlug?: string; displaySlug?: string };

export type SignageBridgeStatus = 'connecting' | 'connected' | 'stale' | 'lost';

export function useSignageBridge() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastClientRef = useRef<Partial<SignageClientFile> | null>(null);
  const lastDisplayRef = useRef<Partial<SignageDisplayConfig> | null>(null);
  const clientDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const displayDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [lastAckAt, setLastAckAt] = useState<number | null>(null);
  const [mountAt, setMountAt] = useState(() => Date.now());
  const [, setNowTick] = useState(0);

  // Ticker 1s para que el bridgeStatus refleje el paso del tiempo.
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const sendClientNow = useCallback((client: Partial<SignageClientFile>) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'signage:client-update', client }, '*');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[signage:bridge:editor] postMessage failed', e);
    }
  }, []);

  const sendDisplayNow = useCallback((display: Partial<SignageDisplayConfig>) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'signage:display-update', display }, '*');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[signage:bridge:editor] postMessage failed', e);
    }
  }, []);

  // Listener del handshake/heartbeat del runtime.
  useEffect(() => {
    function handler(event: MessageEvent) {
      const data = event.data as ReadyAck | null;
      if (!data || data.type !== 'signage:ready') return;
      setIsReady(true);
      setLastAckAt(Date.now());
      // Resendear pushes pendientes (race).
      if (lastClientRef.current) sendClientNow(lastClientRef.current);
      if (lastDisplayRef.current) sendDisplayNow(lastDisplayRef.current);
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sendClientNow, sendDisplayNow]);

  const pushClient = useCallback(
    (client: Partial<SignageClientFile>) => {
      lastClientRef.current = client;
      if (clientDebounceRef.current) clearTimeout(clientDebounceRef.current);
      clientDebounceRef.current = setTimeout(() => sendClientNow(client), 120);
    },
    [sendClientNow],
  );

  const pushDisplay = useCallback(
    (display: Partial<SignageDisplayConfig>) => {
      lastDisplayRef.current = display;
      if (displayDebounceRef.current) clearTimeout(displayDebounceRef.current);
      displayDebounceRef.current = setTimeout(() => sendDisplayNow(display), 120);
    },
    [sendDisplayNow],
  );

  /** Salta a un slide específico en el preview iframe. Sin debounce — la
   *  acción es discreta y el operator espera feedback inmediato. */
  const jumpToSlide = useCallback((slideId: string) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'signage:jump-slide', slideId }, '*');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[signage:bridge:editor] jump postMessage failed', e);
    }
  }, []);

  const onIframeLoad = useCallback(() => {
    setIsReady(false);
    setLastAckAt(null);
    setMountAt(Date.now());
  }, []);

  const bridgeStatus: SignageBridgeStatus = (() => {
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
    pushDisplay,
    jumpToSlide,
    onIframeLoad,
    isReady,
    bridgeStatus,
  };
}
