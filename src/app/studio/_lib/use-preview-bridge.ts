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
  ListingsModule,
  ModulesConfig,
  PassesModule,
  PhotoBoothConfig,
  SocialWallConfig,
  SurveyConfig,
  TicketsModule,
  TrailsModule,
} from '@/lib/studio/schema';

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
  const lastAdsRef = useRef<AdsModule | null>(null);
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
  const adsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isReady, setIsReady] = useState(false);
  // Timestamp del último handshake/heartbeat recibido del iframe. Se usa para
  // calcular `bridgeStatus` (connecting/connected/stale/lost). El kiosk emite
  // `studio:ready` al montar y cada 5s como heartbeat (ver `StudioBridge`).
  const [lastAckAt, setLastAckAt] = useState<number | null>(null);
  const [mountAt, setMountAt] = useState<number>(() => Date.now());
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
          },
        },
        '*',
      );
    } catch {}
  }, []);

  const sendModulesNow = useCallback((modules: ModulesConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:modules-update', modules }, '*');
    } catch {}
  }, []);

  const sendBillboardNow = useCallback((billboard: BillboardConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:billboard-update', billboard }, '*');
    } catch {}
  }, []);

  const openBillboardPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:billboard-open-preview' }, '*');
    } catch {}
  }, []);

  const openHomeDashboardPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:home-dashboard-open-preview' }, '*');
    } catch {}
  }, []);

  const openAiAvatarPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:ai-avatar-open-preview' }, '*');
    } catch {}
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
      win.postMessage({ type: 'studio:ai-avatar-update', aiAvatar: safe }, '*');
    } catch {}
  }, []);

  const sendSurveyNow = useCallback((survey: SurveyConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:survey-update', survey }, '*');
    } catch {}
  }, []);

  /**
   * Abrir el survey overlay en el iframe sin esperar a que el usuario tape el
   * tile. Útil para que el editor del Studio muestre el flow al editar.
   */
  const openSurveyPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:survey-open-preview' }, '*');
    } catch {}
  }, []);

  const sendDealsNow = useCallback((deals: DealsModuleConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:deals-update', deals }, '*');
    } catch {}
  }, []);

  /**
   * Navegar al módulo Deals en el iframe sin tocar tiles. Útil para previsualizar
   * el grid de cupones desde el editor del Studio.
   */
  const openDealsPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:deals-open-preview' }, '*');
    } catch {}
  }, []);

  const sendPhotoBoothNow = useCallback((photoBooth: PhotoBoothConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:photo-booth-update', photoBooth }, '*');
    } catch {}
  }, []);

  const openPhotoBoothPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:photo-booth-open-preview' }, '*');
    } catch {}
  }, []);

  const sendBrochuresNow = useCallback((brochures: BrochuresModuleConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:brochures-update', brochures }, '*');
    } catch {}
  }, []);

  const openBrochuresPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:brochures-open-preview' }, '*');
    } catch {}
  }, []);

  const sendSocialWallNow = useCallback((socialWall: SocialWallConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:social-wall-update', socialWall }, '*');
    } catch {}
  }, []);

  const openSocialWallPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:social-wall-open-preview' }, '*');
    } catch {}
  }, []);

  const sendGuestbookNow = useCallback((guestbook: GuestbookConfig) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:guestbook-update', guestbook }, '*');
    } catch {}
  }, []);

  const openGuestbookPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:guestbook-open-preview' }, '*');
    } catch {}
  }, []);

  const sendListingsNow = useCallback((listings: ListingsModule) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:listings-update', listings }, '*');
    } catch {}
  }, []);

  const sendEventsNow = useCallback((events: EventsModule) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:events-update', events }, '*');
    } catch {}
  }, []);

  const openEventsPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:events-open-preview' }, '*');
    } catch {}
  }, []);

  const sendTicketsNow = useCallback((tickets: TicketsModule) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:tickets-update', tickets }, '*');
    } catch {}
  }, []);

  const openTicketsPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:tickets-open-preview' }, '*');
    } catch {}
  }, []);

  const sendPassesNow = useCallback((passes: PassesModule) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:passes-update', passes }, '*');
    } catch {}
  }, []);

  const openPassesPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:passes-open-preview' }, '*');
    } catch {}
  }, []);

  const sendTrailsNow = useCallback((trails: TrailsModule) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:trails-update', trails }, '*');
    } catch {}
  }, []);

  const openTrailsPreview = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:trails-open-preview' }, '*');
    } catch {}
  }, []);

  const sendAdsNow = useCallback((ads: AdsModule) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'studio:ads-update', ads }, '*');
    } catch {}
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
      if (lastAdsRef.current) sendAdsNow(lastAdsRef.current);
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
    sendAdsNow,
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
      modulesDebounceRef.current = setTimeout(() => sendModulesNow(modules), 80);
    },
    [sendModulesNow],
  );

  const pushBillboard = useCallback(
    (billboard: BillboardConfig) => {
      lastBillboardRef.current = billboard;
      if (billboardDebounceRef.current) clearTimeout(billboardDebounceRef.current);
      billboardDebounceRef.current = setTimeout(() => sendBillboardNow(billboard), 80);
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
      dealsDebounceRef.current = setTimeout(() => sendDealsNow(deals), 150);
    },
    [sendDealsNow],
  );

  const pushPhotoBooth = useCallback(
    (pb: PhotoBoothConfig) => {
      lastPhotoBoothRef.current = pb;
      if (photoBoothDebounceRef.current) clearTimeout(photoBoothDebounceRef.current);
      photoBoothDebounceRef.current = setTimeout(() => sendPhotoBoothNow(pb), 200);
    },
    [sendPhotoBoothNow],
  );

  const pushBrochures = useCallback(
    (b: BrochuresModuleConfig) => {
      lastBrochuresRef.current = b;
      if (brochuresDebounceRef.current) clearTimeout(brochuresDebounceRef.current);
      brochuresDebounceRef.current = setTimeout(() => sendBrochuresNow(b), 150);
    },
    [sendBrochuresNow],
  );

  const pushSocialWall = useCallback(
    (sw: SocialWallConfig) => {
      lastSocialWallRef.current = sw;
      if (socialWallDebounceRef.current) clearTimeout(socialWallDebounceRef.current);
      socialWallDebounceRef.current = setTimeout(() => sendSocialWallNow(sw), 150);
    },
    [sendSocialWallNow],
  );

  const pushGuestbook = useCallback(
    (gb: GuestbookConfig) => {
      lastGuestbookRef.current = gb;
      if (guestbookDebounceRef.current) clearTimeout(guestbookDebounceRef.current);
      guestbookDebounceRef.current = setTimeout(() => sendGuestbookNow(gb), 150);
    },
    [sendGuestbookNow],
  );

  const pushListings = useCallback(
    (listings: ListingsModule) => {
      lastListingsRef.current = listings;
      if (listingsDebounceRef.current) clearTimeout(listingsDebounceRef.current);
      listingsDebounceRef.current = setTimeout(() => sendListingsNow(listings), 150);
    },
    [sendListingsNow],
  );

  const pushEvents = useCallback(
    (events: EventsModule) => {
      lastEventsRef.current = events;
      if (eventsDebounceRef.current) clearTimeout(eventsDebounceRef.current);
      eventsDebounceRef.current = setTimeout(() => sendEventsNow(events), 150);
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
      passesDebounceRef.current = setTimeout(() => sendPassesNow(passes), 150);
    },
    [sendPassesNow],
  );

  const pushTrails = useCallback(
    (trails: TrailsModule) => {
      lastTrailsRef.current = trails;
      if (trailsDebounceRef.current) clearTimeout(trailsDebounceRef.current);
      trailsDebounceRef.current = setTimeout(() => sendTrailsNow(trails), 150);
    },
    [sendTrailsNow],
  );

  const pushAds = useCallback(
    (ads: AdsModule) => {
      lastAdsRef.current = ads;
      if (adsDebounceRef.current) clearTimeout(adsDebounceRef.current);
      adsDebounceRef.current = setTimeout(() => sendAdsNow(ads), 150);
    },
    [sendAdsNow],
  );

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
    pushAds,
    isReady,
    bridgeStatus,
    onIframeLoad,
  };
}
