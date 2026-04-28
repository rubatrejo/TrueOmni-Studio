'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { hexToHsl } from '@/lib/studio/hex-to-hsl';

/**
 * Hook que coordina el bridge Studio → kiosk-iframe.
 *
 * Responsabilidades:
 *   - Mantener una `iframeRef` que el `<PreviewPanel>` asigna al iframe.
 *   - Recibir el handshake `studio:ready` del kiosk y resendear el state
 *     actual al iframe inmediatamente (race condition: el host puede
 *     intentar enviar mensajes antes de que el listener del iframe esté
 *     montado).
 *   - Debounce 120 ms en cada cambio para no saturar postMessage durante
 *     drag de un color picker.
 *
 * Devuelve:
 *   - `iframeRef` para asignar al `<iframe>`.
 *   - `pushBranding(branding)` que el editor llama en cada change.
 *   - `isReady` que el host puede usar para mostrar un loader si conviene.
 */
export type BrandHex = {
  primary: string;
  secondary: string;
  tertiary: string;
};

export type BrandingPatch = {
  primary: string;
  secondary: string;
  tertiary: string;
  logo?: string;
  favicon?: string;
  fonts?: { display?: string; body?: string };
};

export function usePreviewBridge() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastBrandingRef = useRef<BrandingPatch | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isReady, setIsReady] = useState(false);

  const sendNow = useCallback((branding: BrandingPatch) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(
        {
          type: 'studio:branding-update',
          branding: {
            primary: hexToHsl(branding.primary),
            secondary: hexToHsl(branding.secondary),
            tertiary: hexToHsl(branding.tertiary),
            logo: branding.logo,
            favicon: branding.favicon,
            fonts: branding.fonts,
          },
        },
        '*',
      );
    } catch {}
  }, []);

  // Listener del handshake studio:ready desde el iframe.
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data as { type?: string } | null;
      if (!data || data.type !== 'studio:ready') return;
      setIsReady(true);
      if (lastBrandingRef.current) sendNow(lastBrandingRef.current);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sendNow]);

  const pushBranding = useCallback(
    (branding: BrandingPatch) => {
      lastBrandingRef.current = branding;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => sendNow(branding), 120);
    },
    [sendNow],
  );

  // Cuando el iframe re-monta, resetea ready para forzar un nuevo handshake.
  const onIframeLoad = useCallback(() => {
    setIsReady(false);
  }, []);

  return { iframeRef, pushBranding, isReady, onIframeLoad };
}
