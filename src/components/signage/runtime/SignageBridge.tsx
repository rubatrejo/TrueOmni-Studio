'use client';

import { useEffect } from 'react';

import type { SignageClientFile, SignageDisplayConfig } from '@/lib/signage/schema';

import { useSignageBridgeStore } from './signage-bridge-store';

/**
 * `<SignageBridge>` — Comunicación bidireccional editor ↔ iframe (DSS3).
 *
 * Responsabilidades:
 *  1. Emitir handshake `signage:ready` al `window.parent` al montar (informa
 *     al editor que el iframe está listo).
 *  2. Heartbeat cada 5s con el mismo type para que el editor detecte si el
 *     iframe se cuelga (status `stale`/`lost`).
 *  3. Escuchar postMessage del editor:
 *     - `signage:client-update { client: Partial<SignageClientFile> }`
 *     - `signage:display-update { display: Partial<SignageDisplayConfig> }`
 *  4. Popular `useSignageBridgeStore` con los patches. DSS4-5 conectará los
 *     componentes del runtime para leer overrides desde el store con
 *     fallback a la prop server.
 *
 * **DSS3 NO aplica los patches visualmente.** El bridge solo valida que el
 * flow funciona end-to-end. La aplicación real aterriza en DSS4-DSS5 cuando
 * existan los formularios editables.
 *
 * Si el runtime no está embebido (`window.parent === window`), el handshake
 * se emite igual pero nadie escucha. No es un error — simplemente la página
 * funciona standalone.
 */
export interface SignageBridgeProps {
  clientSlug: string;
  displaySlug: string;
}

export function SignageBridge({ clientSlug, displaySlug }: SignageBridgeProps) {
  const setClientPatch = useSignageBridgeStore((s) => s.setClientPatch);
  const setDisplayPatch = useSignageBridgeStore((s) => s.setDisplayPatch);

  useEffect(() => {
    const target = window.parent;
    if (!target) return;

    function emitReady() {
      try {
        target.postMessage({ type: 'signage:ready', clientSlug, displaySlug, ts: Date.now() }, '*');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[signage:bridge] postMessage failed', e);
      }
    }

    // Handshake inicial.
    emitReady();
    // Heartbeat cada 5s (mismo patrón que el bridge del kiosk).
    const heartbeat = window.setInterval(emitReady, 5000);

    function onMessage(event: MessageEvent) {
      const data = event.data as {
        type?: string;
        client?: Partial<SignageClientFile>;
        display?: Partial<SignageDisplayConfig>;
      } | null;
      if (!data || typeof data.type !== 'string') return;

      if (data.type === 'signage:client-update' && data.client) {
        setClientPatch(data.client);
      } else if (data.type === 'signage:display-update' && data.display) {
        setDisplayPatch(data.display);
      }
    }

    window.addEventListener('message', onMessage);
    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener('message', onMessage);
    };
  }, [clientSlug, displaySlug, setClientPatch, setDisplayPatch]);

  return null;
}
