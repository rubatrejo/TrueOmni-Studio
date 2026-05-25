'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { hexToHsl } from '@/lib/studio/hex-to-hsl';
import type {
  AdsModule,
  AiAvatarConfig,
  BillboardConfig,
  BrochuresModuleConfig,
  DealsModuleConfig,
  EventsModule,
  GuestbookConfig,
  IntegrationsConfig,
  ItineraryBuilderConfig,
  ListingsModule,
  MapConfig,
  ModulesConfig,
  PassesModule,
  PhotoBoothConfig,
  SocialWallConfig,
  SurveyConfig,
  TicketsModule,
  TrailsModule,
} from '@/lib/studio/schema';

/**
 * Origin específico del iframe del kiosk preview. El kiosk se carga desde
 * el mismo origin que el Studio (Next sirve `/k/<slug>` en el mismo dominio),
 * así que `window.location.origin` es el target correcto. Reemplaza el
 * uso anterior de `'*'`, que permitía a cualquier ventana receptora
 * (incluyendo posibles hijacks cross-origin) leer el branding/config.
 *
 * Hallazgo S-02 del audit panorámico v2 (2026-05-08).
 */
const IFRAME_TARGET_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '/';

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

export type CustomFontPatch = {
  name: string;
  dataUrl: string;
  format: 'woff2' | 'woff' | 'ttf' | 'otf';
};

export type BrandingPatch = {
  primary: string;
  secondary: string;
  tertiary: string;
  logo?: string;
  idleLogo?: string;
  footerLogo?: string;
  favicon?: string;
  fonts?: {
    display?: string;
    body?: string;
    displayCustom?: CustomFontPatch;
    bodyCustom?: CustomFontPatch;
  };
  homeHero?: { kind: 'image' | 'video'; src: string };
  heroGradient?: { from: string; to: string; angle: number };
  heroLogoSize?: 'S' | 'M' | 'L' | 'XL';
  idleBackground?: { kind: 'image' | 'video' | 'youtube'; src: string };
  clientName?: string;
  clientCoords?: { lat: number; lng: number };
};

export function usePreviewBridge() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastBrandingRef = useRef<BrandingPatch | null>(null);
  const lastModulesRef = useRef<ModulesConfig | null>(null);
  const lastBillboardRef = useRef<BillboardConfig | null>(null);
  const lastAiRef = useRef<AiAvatarConfig | null>(null);
  const lastSurveyRef = useRef<SurveyConfig | null>(null);
  const lastDealsRef = useRef<DealsModuleConfig | null>(null);
  const lastPhotoBoothRef = useRef<PhotoBoothConfig | null>(null);
  const lastBrochuresRef = useRef<BrochuresModuleConfig | null>(null);
  const lastSocialWallRef = useRef<SocialWallConfig | null>(null);
  const lastGuestbookRef = useRef<GuestbookConfig | null>(null);
  const lastListingsRef = useRef<ListingsModule | null>(null);
  const lastEventsRef = useRef<EventsModule | null>(null);
  const lastTicketsRef = useRef<TicketsModule | null>(null);
  const lastPassesRef = useRef<PassesModule | null>(null);
  const lastTrailsRef = useRef<TrailsModule | null>(null);
  const lastItineraryRef = useRef<ItineraryBuilderConfig | null>(null);
  const lastAdsRef = useRef<AdsModule | null>(null);
  const lastMapRef = useRef<MapConfig | null>(null);
  const brandingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modulesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const billboardDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const surveyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dealsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photoBoothDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const brochuresDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socialWallDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guestbookDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listingsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticketsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trailsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itineraryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const integrationsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIntegrationsRef = useRef<IntegrationsConfig | null>(null);
  const [isReady, setIsReady] = useState(false);
  // Timestamp del último handshake/heartbeat recibido del iframe. Se usa para
  // calcular `bridgeStatus` (connecting/connected/stale/lost). El kiosk emite
  // `studio:ready` al montar y cada 5s como heartbeat (ver `StudioBridge`).
  const [lastAckAt, setLastAckAt] = useState<number | null>(null);
  const [mountAt, setMountAt] = useState<number>(() => Date.now());
  // Counter de postMessage fallidos consecutivos. Si el iframe está dead-
  // locked o detached el postMessage tira; antes esos errores solo iban a
  // `console.warn` (silencioso para el operador). Hallazgo S-04 del audit
  // panorámico v2: si pasamos un threshold lo expone como `postBroken`
  // para que el Shell muestre un banner "Live preview disconnected".
  const postFailureRef = useRef(0);
  const [postBroken, setPostBroken] = useState(false);
  const recordPostFailure = useCallback((e: unknown) => {
    postFailureRef.current += 1;
    // eslint-disable-next-line no-console
    console.warn('[bridge:postMessage]', e);
    if (postFailureRef.current >= 5) setPostBroken(true);
  }, []);
  const recordPostSuccess = useCallback(() => {
    if (postFailureRef.current > 0) {
      postFailureRef.current = 0;
      setPostBroken(false);
    }
  }, []);
  // Ticker que fuerza re-render cada segundo para que el `bridgeStatus`
  // derivado refleje el paso del tiempo (sin esto se quedaría obsoleto).
  const [, setNowTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const sendBrandingNow = useCallback((branding: BrandingPatch) => {
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
            idleLogo: branding.idleLogo,
            footerLogo: branding.footerLogo,
            favicon: branding.favicon,
            fonts: branding.fonts,
            homeHero: branding.homeHero,
            heroGradient: branding.heroGradient,
            heroLogoSize: branding.heroLogoSize,
            idleBackground: branding.idleBackground,
            clientName: branding.clientName,
            clientCoords: branding.clientCoords,
          },
        },
        IFRAME_TARGET_ORIGIN,
      );
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendModulesNow = useCallback((modules: ModulesConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:modules-update', modules }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendBillboardNow = useCallback((billboard: BillboardConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:billboard-update', billboard }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const openBillboardPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:billboard-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const openHomeDashboardPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:home-dashboard-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const openAiAvatarPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:ai-avatar-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendAiNow = useCallback((aiAvatar: AiAvatarConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      // Solo mandamos al kiosk los campos visualmente relevantes — apiKey nunca
      // sale del Studio, lo guardará el server.
      const safe = {
        avatar: aiAvatar.avatar,
        heroVideo: aiAvatar.heroVideo,
        greeting: aiAvatar.greeting,
        suggestedQuestions: aiAvatar.suggestedQuestions,
      };
      win.postMessage({ type: 'studio:ai-avatar-update', aiAvatar: safe }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendSurveyNow = useCallback((survey: SurveyConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:survey-update', survey }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  /**
   * Abrir el survey overlay en el iframe sin esperar a que el usuario tape el
   * tile. Útil para que el editor del Studio muestre el flow al editar.
   */
  const openSurveyPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:survey-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendDealsNow = useCallback((deals: DealsModuleConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:deals-update', deals }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  /**
   * Navegar al módulo Deals en el iframe sin tocar tiles. Útil para previsualizar
   * el grid de cupones desde el editor del Studio.
   */
  const openDealsPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:deals-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendPhotoBoothNow = useCallback((photoBooth: PhotoBoothConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:photo-booth-update', photoBooth }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const openPhotoBoothPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:photo-booth-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendBrochuresNow = useCallback((brochures: BrochuresModuleConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:brochures-update', brochures }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const openBrochuresPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:brochures-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendSocialWallNow = useCallback((socialWall: SocialWallConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:social-wall-update', socialWall }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const openSocialWallPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:social-wall-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendGuestbookNow = useCallback((guestbook: GuestbookConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:guestbook-update', guestbook }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const openGuestbookPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:guestbook-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendListingsNow = useCallback((listings: ListingsModule) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:listings-update', listings }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendEventsNow = useCallback((events: EventsModule) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:events-update', events }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const openEventsPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:events-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendTicketsNow = useCallback((tickets: TicketsModule) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:tickets-update', tickets }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const openTicketsPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:tickets-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendPassesNow = useCallback((passes: PassesModule) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:passes-update', passes }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const openPassesPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:passes-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendTrailsNow = useCallback((trails: TrailsModule) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:trails-update', trails }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const openTrailsPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:trails-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendItineraryNow = useCallback((itineraryBuilder: ItineraryBuilderConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:itinerary-update', itineraryBuilder }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const openItineraryPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:itinerary-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendAdsNow = useCallback((ads: AdsModule) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:ads-update', ads }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const sendMapNow = useCallback((map: MapConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:map-update', map }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  /** Push del IntegrationsConfig al iframe. Hallazgo #14 del audit — antes
   *  el cambio de Mapbox token / weather provider / etc. requería reload.
   *  Filtramos los campos sensibles (apiKeys de Tavus/Bandwango/etc. NO
   *  salen del Studio — eso solo lo lee el server runtime). Lo único que
   *  el iframe puede usar es el Mapbox token (cliente) y el weather
   *  provider/city/units (no la apiKey del provider, que es server-side). */
  const sendIntegrationsNow = useCallback((integrations: IntegrationsConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      const safe = {
        mapbox: { token: integrations.mapbox.token },
        weather: {
          provider: integrations.weather.provider,
          city: integrations.weather.city,
          units: integrations.weather.units,
        },
        analytics: { gaId: integrations.analytics.gaId },
      };
      win.postMessage(
        { type: 'studio:integrations-update', integrations: safe },
        IFRAME_TARGET_ORIGIN,
      );
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  const openMapPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:map-open-preview' }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  // Listener del handshake studio:ready desde el iframe.
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data as { type?: string } | null;
      if (!data || data.type !== 'studio:ready') return;
      setIsReady(true);
      setLastAckAt(Date.now());
      if (lastBrandingRef.current) sendBrandingNow(lastBrandingRef.current);
      if (lastModulesRef.current) sendModulesNow(lastModulesRef.current);
      if (lastBillboardRef.current) sendBillboardNow(lastBillboardRef.current);
      if (lastAiRef.current) sendAiNow(lastAiRef.current);
      if (lastSurveyRef.current) sendSurveyNow(lastSurveyRef.current);
      if (lastDealsRef.current) sendDealsNow(lastDealsRef.current);
      if (lastPhotoBoothRef.current) sendPhotoBoothNow(lastPhotoBoothRef.current);
      if (lastBrochuresRef.current) sendBrochuresNow(lastBrochuresRef.current);
      if (lastSocialWallRef.current) sendSocialWallNow(lastSocialWallRef.current);
      if (lastGuestbookRef.current) sendGuestbookNow(lastGuestbookRef.current);
      if (lastListingsRef.current) sendListingsNow(lastListingsRef.current);
      if (lastEventsRef.current) sendEventsNow(lastEventsRef.current);
      if (lastTicketsRef.current) sendTicketsNow(lastTicketsRef.current);
      if (lastPassesRef.current) sendPassesNow(lastPassesRef.current);
      if (lastTrailsRef.current) sendTrailsNow(lastTrailsRef.current);
      if (lastItineraryRef.current) sendItineraryNow(lastItineraryRef.current);
      if (lastAdsRef.current) sendAdsNow(lastAdsRef.current);
      if (lastMapRef.current) sendMapNow(lastMapRef.current);
      if (lastIntegrationsRef.current) sendIntegrationsNow(lastIntegrationsRef.current);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [
    sendBrandingNow,
    sendModulesNow,
    sendBillboardNow,
    sendAiNow,
    sendSurveyNow,
    sendDealsNow,
    sendPhotoBoothNow,
    sendBrochuresNow,
    sendSocialWallNow,
    sendGuestbookNow,
    sendListingsNow,
    sendEventsNow,
    sendTicketsNow,
    sendPassesNow,
    sendTrailsNow,
    sendItineraryNow,
    sendAdsNow,
    sendMapNow,
    sendIntegrationsNow,
  ]);

  const pushBranding = useCallback(
    (branding: BrandingPatch) => {
      lastBrandingRef.current = branding;
      if (brandingDebounceRef.current) clearTimeout(brandingDebounceRef.current);
      brandingDebounceRef.current = setTimeout(() => sendBrandingNow(branding), 120);
    },
    [sendBrandingNow],
  );

  const pushModules = useCallback(
    (modules: ModulesConfig) => {
      lastModulesRef.current = modules;
      if (modulesDebounceRef.current) clearTimeout(modulesDebounceRef.current);
      modulesDebounceRef.current = setTimeout(() => sendModulesNow(modules), 120);
    },
    [sendModulesNow],
  );

  const pushBillboard = useCallback(
    (billboard: BillboardConfig) => {
      lastBillboardRef.current = billboard;
      if (billboardDebounceRef.current) clearTimeout(billboardDebounceRef.current);
      billboardDebounceRef.current = setTimeout(() => sendBillboardNow(billboard), 120);
    },
    [sendBillboardNow],
  );

  const pushAiAvatar = useCallback(
    (ai: AiAvatarConfig) => {
      lastAiRef.current = ai;
      if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
      aiDebounceRef.current = setTimeout(() => sendAiNow(ai), 120);
    },
    [sendAiNow],
  );

  const pushSurvey = useCallback(
    (survey: SurveyConfig) => {
      lastSurveyRef.current = survey;
      if (surveyDebounceRef.current) clearTimeout(surveyDebounceRef.current);
      surveyDebounceRef.current = setTimeout(() => sendSurveyNow(survey), 120);
    },
    [sendSurveyNow],
  );

  const pushDeals = useCallback(
    (deals: DealsModuleConfig) => {
      lastDealsRef.current = deals;
      if (dealsDebounceRef.current) clearTimeout(dealsDebounceRef.current);
      dealsDebounceRef.current = setTimeout(() => sendDealsNow(deals), 120);
    },
    [sendDealsNow],
  );

  const pushPhotoBooth = useCallback(
    (pb: PhotoBoothConfig) => {
      lastPhotoBoothRef.current = pb;
      if (photoBoothDebounceRef.current) clearTimeout(photoBoothDebounceRef.current);
      photoBoothDebounceRef.current = setTimeout(() => sendPhotoBoothNow(pb), 120);
    },
    [sendPhotoBoothNow],
  );

  const pushBrochures = useCallback(
    (b: BrochuresModuleConfig) => {
      lastBrochuresRef.current = b;
      if (brochuresDebounceRef.current) clearTimeout(brochuresDebounceRef.current);
      brochuresDebounceRef.current = setTimeout(() => sendBrochuresNow(b), 120);
    },
    [sendBrochuresNow],
  );

  const pushSocialWall = useCallback(
    (sw: SocialWallConfig) => {
      lastSocialWallRef.current = sw;
      if (socialWallDebounceRef.current) clearTimeout(socialWallDebounceRef.current);
      socialWallDebounceRef.current = setTimeout(() => sendSocialWallNow(sw), 120);
    },
    [sendSocialWallNow],
  );

  const pushGuestbook = useCallback(
    (gb: GuestbookConfig) => {
      lastGuestbookRef.current = gb;
      if (guestbookDebounceRef.current) clearTimeout(guestbookDebounceRef.current);
      guestbookDebounceRef.current = setTimeout(() => sendGuestbookNow(gb), 120);
    },
    [sendGuestbookNow],
  );

  const pushListings = useCallback(
    (listings: ListingsModule) => {
      lastListingsRef.current = listings;
      if (listingsDebounceRef.current) clearTimeout(listingsDebounceRef.current);
      listingsDebounceRef.current = setTimeout(() => sendListingsNow(listings), 120);
    },
    [sendListingsNow],
  );

  const pushEvents = useCallback(
    (events: EventsModule) => {
      lastEventsRef.current = events;
      if (eventsDebounceRef.current) clearTimeout(eventsDebounceRef.current);
      eventsDebounceRef.current = setTimeout(() => sendEventsNow(events), 120);
    },
    [sendEventsNow],
  );

  const pushTickets = useCallback(
    (tickets: TicketsModule) => {
      lastTicketsRef.current = tickets;
      if (ticketsDebounceRef.current) clearTimeout(ticketsDebounceRef.current);
      ticketsDebounceRef.current = setTimeout(() => sendTicketsNow(tickets), 120);
    },
    [sendTicketsNow],
  );

  const pushPasses = useCallback(
    (passes: PassesModule) => {
      lastPassesRef.current = passes;
      if (passesDebounceRef.current) clearTimeout(passesDebounceRef.current);
      passesDebounceRef.current = setTimeout(() => sendPassesNow(passes), 120);
    },
    [sendPassesNow],
  );

  const pushTrails = useCallback(
    (trails: TrailsModule) => {
      lastTrailsRef.current = trails;
      if (trailsDebounceRef.current) clearTimeout(trailsDebounceRef.current);
      trailsDebounceRef.current = setTimeout(() => sendTrailsNow(trails), 120);
    },
    [sendTrailsNow],
  );

  const pushItinerary = useCallback(
    (itineraryBuilder: ItineraryBuilderConfig) => {
      lastItineraryRef.current = itineraryBuilder;
      if (itineraryDebounceRef.current) clearTimeout(itineraryDebounceRef.current);
      itineraryDebounceRef.current = setTimeout(() => sendItineraryNow(itineraryBuilder), 120);
    },
    [sendItineraryNow],
  );

  const pushAds = useCallback(
    (ads: AdsModule) => {
      lastAdsRef.current = ads;
      if (adsDebounceRef.current) clearTimeout(adsDebounceRef.current);
      adsDebounceRef.current = setTimeout(() => sendAdsNow(ads), 120);
    },
    [sendAdsNow],
  );

  const pushMap = useCallback(
    (map: MapConfig) => {
      lastMapRef.current = map;
      if (mapDebounceRef.current) clearTimeout(mapDebounceRef.current);
      mapDebounceRef.current = setTimeout(() => sendMapNow(map), 120);
    },
    [sendMapNow],
  );

  const pushIntegrations = useCallback(
    (integrations: IntegrationsConfig) => {
      lastIntegrationsRef.current = integrations;
      if (integrationsDebounceRef.current) clearTimeout(integrationsDebounceRef.current);
      integrationsDebounceRef.current = setTimeout(() => sendIntegrationsNow(integrations), 120);
    },
    [sendIntegrationsNow],
  );

  /** Cambia el locale activo del kiosk-iframe sin reload (#10 audit). El
   *  i18n-provider escucha `kiosk:locale-update` y actualiza el store de
   *  zustand. No hay debounce — el cambio es discreto (dropdown). */
  const pushLocale = useCallback((locale: string) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:locale-update', locale }, IFRAME_TARGET_ORIGIN);
      recordPostSuccess();
    } catch (e) {
      recordPostFailure(e);
    }
  }, []);

  // Cuando el iframe re-monta, resetea ready para forzar un nuevo handshake.
  const onIframeLoad = useCallback(() => {
    setIsReady(false);
    setLastAckAt(null);
    setMountAt(Date.now());
  }, []);

  // Estado derivado del bridge para el indicador del Sidebar.
  // Reglas (audit F-17):
  //   - 'connecting': montado <5s sin handshake (esperable mientras carga el iframe).
  //   - 'connected':  último heartbeat <5s.
  //   - 'stale':      último heartbeat 5–30s (atípico — kiosk pausado, throttling).
  //   - 'lost':       sin heartbeat >30s o falló el handshake inicial.
  const bridgeStatus: 'connecting' | 'connected' | 'stale' | 'lost' = (() => {
    const now = Date.now();
    if (lastAckAt === null) {
      return now - mountAt < 5000 ? 'connecting' : 'lost';
    }
    const elapsed = now - lastAckAt;
    if (elapsed < 5000) return 'connected';
    if (elapsed < 30000) return 'stale';
    return 'lost';
  })();

  return {
    iframeRef,
    pushBranding,
    pushModules,
    pushBillboard,
    openBillboardPreview,
    openHomeDashboardPreview,
    pushAiAvatar,
    openAiAvatarPreview,
    pushSurvey,
    openSurveyPreview,
    pushDeals,
    openDealsPreview,
    pushPhotoBooth,
    openPhotoBoothPreview,
    pushBrochures,
    openBrochuresPreview,
    pushSocialWall,
    openSocialWallPreview,
    pushGuestbook,
    openGuestbookPreview,
    pushListings,
    pushEvents,
    openEventsPreview,
    pushTickets,
    openTicketsPreview,
    pushPasses,
    openPassesPreview,
    pushTrails,
    openTrailsPreview,
    pushItinerary,
    openItineraryPreview,
    pushAds,
    pushMap,
    openMapPreview,
    pushIntegrations,
    pushLocale,
    isReady,
    bridgeStatus,
    /** True si han fallado 5+ postMessage consecutivos. Útil para mostrar
     *  un banner "Live preview disconnected — reload" en el Shell.
     *  Hallazgo S-04 del audit panorámico v2. */
    postBroken,
    onIframeLoad,
  };
}
