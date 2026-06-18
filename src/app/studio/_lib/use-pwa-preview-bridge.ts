'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { PwaConfig } from '@/lib/config';
import { resolvePwaForLocale } from '@/lib/pwa-i18n';
import { hexToHsl } from '@/lib/studio/hex-to-hsl';
import type { SystemModules } from '@/lib/studio/schema';

/**
 * Bridge editor PWA → iframe `/pwa`.
 *
 * Versión simplificada de `usePreviewBridge` (kiosk): en lugar de 18 push
 * granulares, empuja el slice `features.pwa` completo en un único mensaje
 * (`studio:pwa-update`) más el branding (reutiliza `studio:branding-update`,
 * que el `StudioBridge` de la PWA ya entiende) y el locale. El payload PWA es
 * mucho más pequeño que el del kiosk, así que un push completo debounced es
 * suficiente y mantiene el código manejable.
 */

const IFRAME_TARGET_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '/';
const DEBOUNCE_MS = 120;

export type PwaBrandingPatch = {
  primary: string;
  secondary: string;
  tertiary: string;
  logo?: string;
  idleLogo?: string;
  footerLogo?: string;
  favicon?: string;
  fonts?: { display?: string; body?: string };
  clientName?: string;
};

export function usePwaPreviewBridge() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastPwaRef = useRef<PwaConfig | null>(null);
  const lastKioskSystemModulesRef = useRef<SystemModules | null>(null);
  const lastBrandingRef = useRef<PwaBrandingPatch | null>(null);
  const lastLocaleRef = useRef<string | null>(null);
  const lastSectionRef = useRef<string | null>(null);
  const pwaDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const brandingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [lastAckAt, setLastAckAt] = useState<number | null>(null);
  const [mountAt, setMountAt] = useState<number>(() => Date.now());
  const [, setNowTick] = useState(0);

  // Ticker para refrescar `bridgeStatus` derivado con el paso del tiempo.
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const post = useCallback((message: Record<string, unknown>) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(message, IFRAME_TARGET_ORIGIN);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[pwa-bridge:postMessage]', e);
    }
  }, []);

  const sendPwaNow = useCallback(
    (pwa: PwaConfig, kioskSystemModules?: SystemModules | null) => {
      // F-PWA-1: resolver el slice para el locale activo del preview antes de
      // enviarlo. Si no se resuelve, el handshake re-empuja el slice base y pisa
      // la traducción que el layout resolvió server-side (la sección Languages
      // quedaba inverificable en vivo). resolvePwaForLocale es no-op en el base.
      const resolved = resolvePwaForLocale(pwa, lastLocaleRef.current ?? undefined) ?? pwa;
      // `kioskSystemModules` viaja junto al slice para que el runtime PWA resuelva
      // la herencia de visibilidad de módulos (el preview carga el cliente
      // `default`, así que el systemModules real del cliente debe llegar por aquí).
      post({
        type: 'studio:pwa-update',
        pwa: resolved,
        kioskSystemModules: kioskSystemModules ?? undefined,
      });
    },
    [post],
  );

  const sendBrandingNow = useCallback(
    (branding: PwaBrandingPatch) =>
      post({
        type: 'studio:branding-update',
        branding: {
          primary: hexToHsl(branding.primary),
          secondary: hexToHsl(branding.secondary),
          tertiary: hexToHsl(branding.tertiary),
          logo: branding.logo,
          // El Login y el Welcome de la PWA usan el slot `idle` del logo (igual que
          // el Billboard del kiosk); el Dashboard usa el `default`. Enviamos los tres
          // para que el override del logo del cliente aplique en todas las pantallas.
          idleLogo: branding.idleLogo,
          footerLogo: branding.footerLogo,
          favicon: branding.favicon,
          fonts: branding.fonts,
          clientName: branding.clientName,
        },
      }),
    [post],
  );

  // Handshake: cuando el iframe anuncia `studio:ready`, reenviamos el estado
  // actual (el host pudo intentar enviar antes de que el listener montara).
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // F-CORE-2: solo aceptamos el handshake del iframe del mismo origin.
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string } | null;
      if (!data) return;
      // F-CORE-9: el heartbeat (cada 5s) solo refresca el liveness — no
      // re-empuja el slice completo al iframe.
      if (data.type === 'studio:heartbeat') {
        setLastAckAt(Date.now());
        return;
      }
      if (data.type !== 'studio:ready') return;
      setIsReady(true);
      setLastAckAt(Date.now());
      if (lastBrandingRef.current) sendBrandingNow(lastBrandingRef.current);
      if (lastPwaRef.current) sendPwaNow(lastPwaRef.current, lastKioskSystemModulesRef.current);
      // F-PWA-2: re-sincroniza la sección activa del editor para que el preview
      // sepa cuándo congelar comportamientos de runtime que estorban al editar
      // (p. ej. el auto-advance del Welcome splash).
      if (lastSectionRef.current)
        post({ type: 'studio:pwa-active-section', section: lastSectionRef.current });
      // Re-sincroniza el locale tras un reload del iframe (el cambio de idioma
      // recarga la PWA para re-resolver el slice server-side). El guard de la
      // cookie en `StudioBridge` evita un segundo reload en cadena.
      if (lastLocaleRef.current)
        post({ type: 'studio:locale-update', locale: lastLocaleRef.current });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sendBrandingNow, sendPwaNow, post]);

  const pushPwa = useCallback(
    (pwa: PwaConfig, kioskSystemModules?: SystemModules | null) => {
      lastPwaRef.current = pwa;
      lastKioskSystemModulesRef.current = kioskSystemModules ?? null;
      if (pwaDebounceRef.current) clearTimeout(pwaDebounceRef.current);
      pwaDebounceRef.current = setTimeout(() => sendPwaNow(pwa, kioskSystemModules), DEBOUNCE_MS);
    },
    [sendPwaNow],
  );

  const pushBranding = useCallback(
    (branding: PwaBrandingPatch) => {
      lastBrandingRef.current = branding;
      if (brandingDebounceRef.current) clearTimeout(brandingDebounceRef.current);
      brandingDebounceRef.current = setTimeout(() => sendBrandingNow(branding), DEBOUNCE_MS);
    },
    [sendBrandingNow],
  );

  const pushLocale = useCallback(
    (locale: string) => {
      lastLocaleRef.current = locale;
      post({ type: 'studio:locale-update', locale });
    },
    [post],
  );

  /**
   * Informa al preview qué sección del editor está activa (F-PWA-2). Lo usa el
   * runtime PWA para congelar comportamientos que estorban al editar SOLO en su
   * sección (no por "estar en el Studio"): el preview sigue comportándose como
   * el runtime en el resto de pantallas.
   */
  const pushActiveSection = useCallback(
    (section: string) => {
      lastSectionRef.current = section;
      post({ type: 'studio:pwa-active-section', section });
    },
    [post],
  );

  /** Navega el preview a una ruta `/pwa/...` para previsualizar una sección. */
  const navTo = useCallback((route: string) => post({ type: 'studio:pwa-nav', route }), [post]);

  const onIframeLoad = useCallback(() => {
    setIsReady(false);
    setLastAckAt(null);
    setMountAt(Date.now());
  }, []);

  const bridgeStatus: 'connecting' | 'connected' | 'stale' | 'lost' = (() => {
    const now = Date.now();
    if (lastAckAt === null) return now - mountAt < 5000 ? 'connecting' : 'lost';
    const elapsed = now - lastAckAt;
    if (elapsed < 5000) return 'connected';
    if (elapsed < 30000) return 'stale';
    return 'lost';
  })();

  return {
    iframeRef,
    pushPwa,
    pushBranding,
    pushLocale,
    pushActiveSection,
    navTo,
    isReady,
    bridgeStatus,
    onIframeLoad,
  };
}
