'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { BridgeStatus } from '@/lib/bridge/types';
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

type SlideActiveEvent = {
  type: 'signage:slide-active';
  slideId: string;
  index: number;
  total: number;
  templateId?: string;
};

export interface SignageActiveSlide {
  slideId: string;
  index: number;
  total: number;
  templateId?: string;
}

/**
 * Re-export del type compartido para retro-compat con cualquier consumidor
 * que importe `SignageBridgeStatus` directamente desde este módulo. Bajo el
 * capó es el mismo `BridgeStatus` que usa el bridge de Video Walls — así el
 * `<SignageSidebarTabs>` puede reusarse en ambos editores sin cast.
 */
export type SignageBridgeStatus = BridgeStatus;

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
  const [activeSlide, setActiveSlide] = useState<SignageActiveSlide | null>(null);

  // Ticker 1s para que el bridgeStatus refleje el paso del tiempo.
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const sendClientNow = useCallback((client: Partial<SignageClientFile>) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'signage:client-update', client }, window.location.origin);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[signage:bridge:editor] postMessage failed', e);
    }
  }, []);

  const sendDisplayNow = useCallback((display: Partial<SignageDisplayConfig>) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'signage:display-update', display }, window.location.origin);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[signage:bridge:editor] postMessage failed', e);
    }
  }, []);

  // Listener del handshake/heartbeat del runtime + slide-active events.
  useEffect(() => {
    function handler(event: MessageEvent) {
      // F-SIGNAGE-6: solo aceptamos eventos del runtime del mismo origin.
      if (event.origin !== window.location.origin) return;
      const data = event.data as ReadyAck | SlideActiveEvent | null;
      if (!data) return;
      if (data.type === 'signage:ready') {
        setIsReady(true);
        setLastAckAt(Date.now());
        // Resendear pushes pendientes (race).
        if (lastClientRef.current) sendClientNow(lastClientRef.current);
        if (lastDisplayRef.current) sendDisplayNow(lastDisplayRef.current);
      } else if (data.type === 'signage:slide-active') {
        setActiveSlide({
          slideId: data.slideId,
          index: data.index,
          total: data.total,
          templateId: data.templateId,
        });
      }
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sendClientNow, sendDisplayNow]);

  const pushClient = useCallback(
    (client: Partial<SignageClientFile>) => {
      const wasFirstPush = lastClientRef.current === null;
      lastClientRef.current = client;
      if (clientDebounceRef.current) clearTimeout(clientDebounceRef.current);
      // Primer push: inmediato (sin debounce) para que el iframe reciba el
      // estado inicial sin delay perceptible. Subsecuentes: debounce 120ms.
      if (wasFirstPush) {
        sendClientNow(client);
      } else {
        clientDebounceRef.current = setTimeout(() => sendClientNow(client), 120);
      }
    },
    [sendClientNow],
  );

  const pushDisplay = useCallback(
    (display: Partial<SignageDisplayConfig>) => {
      const wasFirstPush = lastDisplayRef.current === null;
      lastDisplayRef.current = display;
      if (displayDebounceRef.current) clearTimeout(displayDebounceRef.current);
      if (wasFirstPush) {
        sendDisplayNow(display);
      } else {
        displayDebounceRef.current = setTimeout(() => sendDisplayNow(display), 120);
      }
    },
    [sendDisplayNow],
  );

  /** Salta a un slide específico en el preview iframe. Sin debounce — la
   *  acción es discreta y el operator espera feedback inmediato. */
  const jumpToSlide = useCallback((slideId: string) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'signage:jump-slide', slideId }, window.location.origin);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[signage:bridge:editor] jump postMessage failed', e);
    }
  }, []);

  /** Avanza al siguiente / anterior slide del preview iframe. */
  const navSlide = useCallback((direction: 'prev' | 'next') => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'signage:nav-slide', direction }, window.location.origin);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[signage:bridge:editor] nav postMessage failed', e);
    }
  }, []);

  const onIframeLoad = useCallback(() => {
    setIsReady(false);
    setLastAckAt(null);
    setMountAt(Date.now());
    // Re-enviar los últimos pushes después del load. El SignageBridge del
    // iframe se monta como Client Component que necesita hidratación; entre
    // que el iframe dispatcha `load` y que React hidrata el listener pueden
    // pasar varios cientos de ms. Reenviamos en una secuencia escalonada
    // (50ms, 300ms, 800ms, 1500ms) para asegurar que al menos uno llega
    // post-hidratación. El SignageBridge guarda el último patch en zustand,
    // así que repeticiones son idempotentes.
    const winRef = () => iframeRef.current?.contentWindow;
    [50, 300, 800, 1500].forEach((delay) => {
      setTimeout(() => {
        const win = winRef();
        if (!win) return;
        if (lastClientRef.current) {
          try {
            win.postMessage(
              { type: 'signage:client-update', client: lastClientRef.current },
              window.location.origin,
            );
          } catch {
            // ignored
          }
        }
        if (lastDisplayRef.current) {
          try {
            win.postMessage(
              { type: 'signage:display-update', display: lastDisplayRef.current },
              window.location.origin,
            );
          } catch {
            // ignored
          }
        }
      }, delay);
    });
  }, []);

  const bridgeStatus: BridgeStatus = (() => {
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
    navSlide,
    activeSlide,
    onIframeLoad,
    isReady,
    bridgeStatus,
  };
}
