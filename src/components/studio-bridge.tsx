'use client';

import { useEffect } from 'react';

const HIDE_DEV_INDICATOR_STYLE_ID = 'studio-bridge-hide-dev-indicator';
const HIDE_DEV_INDICATOR_CSS = `
  /* Hide Next.js dev indicator when kiosk is embedded inside the Studio iframe.
     Selectors cover both stable and dev-only Next 15 indicators. */
  nextjs-portal,
  [data-nextjs-toast],
  [data-nextjs-toast-root],
  #__next-build-watcher,
  #__next-prerender-indicator {
    display: none !important;
  }
`;

const FONT_LINK_PREFIX = 'studio-bridge-font-';

/**
 * Bridge runtime kiosk ↔ Studio.
 *
 * Escucha `postMessage` del host (Studio) y aplica las CSS variables del
 * branding al `:root` del documento del kiosk, sin remontar componentes.
 *
 * Mensaje soportado (host → kiosk):
 *   `{ type: 'studio:branding-update', branding: {
 *       primary, secondary, tertiary,    // HSL "H S% L%"
 *       logo?, favicon?,                  // data URLs
 *       fonts?: { display?, body? }       // Google Font names
 *   }}`
 *
 * Mensaje legacy soportado (compat):
 *   `{ type: 'studio:brand-update', brand: { primary, secondary, tertiary } }`
 *
 * Mensajes emitidos (kiosk → host):
 *   - `{ type: 'studio:ready' }`  con re-anuncios para cubrir races.
 */
export function StudioBridge() {
  // Oculta el Next.js dev indicator cuando el kiosk está embebido.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isEmbedded = false;
    try {
      isEmbedded = window.parent !== window;
    } catch {
      isEmbedded = true;
    }
    if (!isEmbedded) return;

    if (document.getElementById(HIDE_DEV_INDICATOR_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = HIDE_DEV_INDICATOR_STYLE_ID;
    style.textContent = HIDE_DEV_INDICATOR_CSS;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event: MessageEvent) => {
      // F-CORE-2: el runtime (`/`, `/pwa`) es público y puede embeberse en un
      // iframe hostil; sin validar el origin, el parent podría inyectar
      // `studio:branding-update`/`studio:pwa-nav` (defacement/redirección). Solo
      // aceptamos mensajes del mismo origin (Studio y runtime comparten dominio).
      if (event.origin !== window.location.origin) return;
      const data = event.data as {
        type?: string;
        brand?: BrandPatch;
        branding?: BrandingPatch;
        modules?: ModulesPatch;
        billboard?: BillboardPatch;
        aiAvatar?: AiAvatarPatch;
        survey?: unknown;
        deals?: unknown;
        photoBooth?: unknown;
        brochures?: unknown;
        socialWall?: unknown;
        guestbook?: unknown;
        listings?: unknown;
        events?: unknown;
        tickets?: unknown;
        passes?: unknown;
        trails?: unknown;
        itineraryBuilder?: unknown;
        ads?: unknown;
        map?: unknown;
        integrations?: unknown;
        locale?: string;
        /** Bundle i18n completo (locale → strings) para reflejar renames en vivo. */
        i18nBundle?: Record<string, Record<string, string>>;
        /** Slice `features.pwa` completo enviado por el editor PWA del Studio. */
        pwa?: unknown;
        /** Ruta destino para `studio:pwa-nav` (navegación del preview PWA). */
        route?: string;
        /** Sección activa del editor PWA (`studio:pwa-active-section`). */
        section?: string;
      } | null;
      if (!data || typeof data !== 'object' || !data.type) return;

      switch (data.type) {
        case 'studio:branding-update':
          if (data.branding) applyBranding(data.branding);
          break;
        case 'studio:brand-update':
          // Legacy: solo colores.
          if (data.brand) applyBranding(data.brand);
          break;
        case 'studio:modules-update':
          if (data.modules) applyModulesOverride(data.modules);
          break;
        case 'studio:i18n-update':
          // Bundle i18n completo: refleja renames de tiles/módulos en vivo en el
          // preview (los labels del runtime salen de las keys i18n, no del config).
          if (data.i18nBundle) {
            (window as Window & { __kioskI18nOverride?: unknown }).__kioskI18nOverride =
              data.i18nBundle;
            window.dispatchEvent(
              new CustomEvent('kiosk:i18n-override', { detail: { bundle: data.i18nBundle } }),
            );
          }
          break;
        case 'studio:billboard-update':
          if (data.billboard) applyBillboardOverride(data.billboard);
          break;
        case 'studio:ai-avatar-update':
          if (data.aiAvatar) applyAiAvatarOverride(data.aiAvatar);
          break;
        case 'studio:survey-update':
          if (data.survey) applySurveyOverride(data.survey);
          break;
        case 'studio:survey-open-preview':
          window.dispatchEvent(new CustomEvent('kiosk:survey-open'));
          break;
        case 'studio:deals-update':
          if (data.deals) applyDealsOverride(data.deals);
          break;
        case 'studio:deals-open-preview':
          // Navegar al módulo Deals si no estamos ya ahí.
          try {
            if (window.location.pathname !== '/home/deals') {
              window.location.assign('/home/deals');
            }
          } catch {}
          break;
        case 'studio:photo-booth-update':
          if (data.photoBooth) applyPhotoBoothOverride(data.photoBooth);
          break;
        case 'studio:photo-booth-open-preview':
          try {
            if (window.location.pathname !== '/home/photo-booth') {
              window.location.assign('/home/photo-booth');
            }
          } catch {}
          break;
        case 'studio:brochures-update':
          if (data.brochures) applyBrochuresOverride(data.brochures);
          break;
        case 'studio:brochures-open-preview':
          try {
            if (window.location.pathname !== '/home/digital-brochure') {
              window.location.assign('/home/digital-brochure');
            }
          } catch {}
          break;
        case 'studio:social-wall-update':
          if (data.socialWall) applySocialWallOverride(data.socialWall);
          break;
        case 'studio:social-wall-open-preview':
          try {
            if (window.location.pathname !== '/home/social-wall') {
              window.location.assign('/home/social-wall');
            }
          } catch {}
          break;
        case 'studio:guestbook-update':
          if (data.guestbook) applyGuestbookOverride(data.guestbook);
          break;
        case 'studio:guestbook-open-preview':
          try {
            if (window.location.pathname !== '/home/guestbook') {
              window.location.assign('/home/guestbook');
            }
          } catch {}
          break;
        case 'studio:listings-update':
          if (data.listings) applyListingsOverride(data.listings);
          break;
        case 'studio:events-update':
          if (data.events) applyEventsOverride(data.events);
          break;
        case 'studio:events-open-preview':
          try {
            if (window.location.pathname !== '/home/events') {
              window.location.assign('/home/events');
            }
          } catch {}
          break;
        case 'studio:tickets-update':
          if (data.tickets) applyTicketsOverride(data.tickets);
          break;
        case 'studio:tickets-open-preview':
          try {
            if (window.location.pathname !== '/home/tickets') {
              window.location.assign('/home/tickets');
            }
          } catch {}
          break;
        case 'studio:passes-update':
          if (data.passes) applyPassesOverride(data.passes);
          break;
        case 'studio:passes-open-preview':
          try {
            if (window.location.pathname !== '/home/passes') {
              window.location.assign('/home/passes');
            }
          } catch {}
          break;
        case 'studio:trails-update':
          if (data.trails) applyTrailsOverride(data.trails);
          break;
        case 'studio:map-update':
          if (data.map) applyMapOverride(data.map);
          break;
        case 'studio:integrations-update':
          if (data.integrations) applyIntegrationsOverride(data.integrations);
          break;
        case 'studio:locale-update':
          // Multi-idioma preview (#10 audit). El i18n-provider escucha este
          // evento y cambia el locale activo del store sin reload (textos del
          // kiosk reutilizados vía `useTextos`).
          if (typeof data.locale === 'string') {
            const nextLocale = data.locale;
            window.dispatchEvent(
              new CustomEvent('kiosk:locale-update', { detail: { locale: nextLocale } }),
            );
            // La PWA resuelve su slice (`features.pwa`) server-side por la cookie
            // `pwa_locale` (ver `(pwa)/layout`). El cambio reactivo no basta:
            // hay que escribir la cookie y recargar para re-resolver. Guard por
            // valor actual para no entrar en loop con el re-envío del handshake.
            try {
              if (window.location.pathname.startsWith('/pwa')) {
                const current = document.cookie.match(/(?:^|;\s*)pwa_locale=([^;]+)/)?.[1];
                if (current !== nextLocale) {
                  document.cookie = `pwa_locale=${nextLocale};path=/;max-age=31536000;samesite=lax`;
                  window.location.reload();
                }
              }
            } catch {}
          }
          break;
        case 'studio:map-open-preview':
          try {
            if (window.location.pathname !== '/home/map') {
              window.location.assign('/home/map');
            }
          } catch {}
          break;
        case 'studio:trails-open-preview':
          try {
            if (window.location.pathname !== '/home/trails') {
              window.location.assign('/home/trails');
            }
          } catch {}
          break;
        case 'studio:itinerary-update':
          if (data.itineraryBuilder) applyItineraryOverride(data.itineraryBuilder);
          break;
        case 'studio:itinerary-open-preview':
          try {
            if (window.location.pathname !== '/home/itinerary-builder') {
              window.location.assign('/home/itinerary-builder');
            }
          } catch {}
          break;
        case 'studio:billboard-open-preview':
          try {
            if (window.location.pathname !== '/') {
              window.location.assign('/');
            }
          } catch {}
          break;
        case 'studio:home-dashboard-open-preview':
          try {
            if (window.location.pathname !== '/home') {
              window.location.assign('/home');
            }
          } catch {}
          break;
        case 'studio:ai-avatar-open-preview':
          try {
            if (window.location.pathname !== '/home') {
              window.location.assign('/home');
            } else {
              window.dispatchEvent(new CustomEvent('kiosk:ai-avatar-open'));
            }
          } catch {}
          break;
        case 'studio:ads-update':
          if (data.ads) applyAdsOverride(data.ads);
          break;
        case 'studio:pwa-update':
          // Editor PWA → runtime PWA. Empuja el slice `features.pwa` completo;
          // el `PwaBridgeProvider` lo aplica reactivamente a las pantallas.
          if (data.pwa) applyPwaOverride(data.pwa);
          break;
        case 'studio:pwa-active-section':
          // Editor PWA → runtime PWA: qué sección se está editando ahora. Lo usan
          // las pantallas para congelar comportamientos de runtime SOLO en su
          // sección (F-PWA-2: Welcome no auto-avanza mientras se edita Welcome).
          if (typeof data.section === 'string') applyPwaActiveSection(data.section);
          break;
        case 'studio:pwa-nav':
          // Navega el preview PWA a una ruta (`/pwa/...`) sin reload completo
          // cuando ya estamos en el mismo origin.
          if (typeof data.route === 'string' && data.route.startsWith('/pwa')) {
            try {
              if (window.location.pathname !== data.route) {
                window.location.assign(data.route);
              }
            } catch {}
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handler);

    const postToParent = (type: 'studio:ready' | 'studio:heartbeat') => {
      try {
        if (window.parent && window.parent !== window) {
          // F-CORE-2: targetOrigin explícito (mismo origin) en vez de '*'.
          window.parent.postMessage({ type }, window.location.origin);
        }
      } catch {}
    };
    // Handshake inicial (+ reintentos para cubrir races de montaje del host):
    // el host trata `studio:ready` como (re)conexión y re-empuja todos los slots.
    const announceReady = () => postToParent('studio:ready');
    announceReady();
    const t1 = setTimeout(announceReady, 50);
    const t2 = setTimeout(announceReady, 250);
    const t3 = setTimeout(announceReady, 800);
    // F-CORE-9: el heartbeat ya NO reusa `studio:ready` (el host lo trataba como
    // reconexión y reenviaba los 18 slots cada 5s). Emite `studio:heartbeat`,
    // que el host solo usa para refrescar `lastAckAt` (detección de liveness).
    const heartbeat = setInterval(() => postToParent('studio:heartbeat'), 5000);

    return () => {
      window.removeEventListener('message', handler);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(heartbeat);
    };
  }, []);

  return null;
}

type BrandPatch = {
  primary?: string;
  secondary?: string;
  tertiary?: string;
};

type CustomFontPatch = {
  name: string;
  dataUrl: string;
  format: 'woff2' | 'woff' | 'ttf' | 'otf';
};

type BrandingPatch = BrandPatch & {
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
  /** Tamaño del logo del hero header (S/M/L/XL). */
  heroLogoSize?: 'S' | 'M' | 'L' | 'XL';
  /** Nombre del cliente — interpola `{client_name}` en textos del kiosk
   *  reactivamente, sin esperar a publish. */
  clientName?: string;
  /** Coords del cliente — centra el módulo Map y el "distance" sort de
   *  listings reactivamente. Resueltas via Nominatim al crear el kiosk. */
  clientCoords?: { lat: number; lng: number };
};

export const KIOSK_HERO_OVERRIDE_EVENT = 'kiosk:hero-override';
export const KIOSK_CLIENT_NAME_OVERRIDE_EVENT = 'kiosk:client-name-override';
export const KIOSK_CLIENT_COORDS_OVERRIDE_EVENT = 'kiosk:client-coords-override';

export type HeroOverrideDetail = {
  homeHero?: { kind: 'image' | 'video'; src: string };
  heroGradient?: { from: string; to: string; angle: number };
  /** Tamaño del logo del hero header (S/M/L/XL). Consumido por HeroLogoSlot. */
  heroLogoSize?: 'S' | 'M' | 'L' | 'XL';
};

type ModulesPatch = {
  tiles: Array<{ key: string; label: string; enabled: boolean; wide?: boolean; image?: string }>;
  systemModules?: { ads: boolean; languages: boolean; aiAvatar: boolean };
  /** Tamaño global de la tipografía de los títulos de los tiles (px). */
  tileTitleFontSize?: number;
  /** Opacidad global (0–100 %) de la capa oscura de los tiles. */
  tileOverlayOpacity?: number;
};

/** Settings idle de una variante del Billboard. Mismo shape que `b0`
 *  para B0/B1/B2/B3 — cada runtime aplica los campos que tienen sentido en
 *  su layout (algunos como width/height del button solo aplican al B0 y se
 *  ignoran silenciosamente en B1/B2/B3). */
type BillboardVariantPatch = {
  background?: { type: 'image' | 'video'; src: string };
  touchHere?: {
    label: string;
    twoLines: boolean;
    width: number;
    height: number;
    fontSize: number;
  };
  overlayOpacity?: number;
  overlay?: {
    mode?: 'solid' | 'gradient';
    color?: string;
    opacity?: number;
    gradient?: { from?: string; to?: string; angle?: number };
  };
};

type BillboardPatch = {
  variant: 0 | 1 | 2 | 3;
  idleTimeoutSec: number;
  logoSize?: 'S' | 'M' | 'L' | 'XL';
  /** Tamaño del logo del footer (mismo enum, mapping diferente). */
  footerLogoSize?: 'S' | 'M' | 'L' | 'XL';
  /** Posición absoluta (top-left) del slot del logo idle. */
  logoPosition?: { x: number; y: number };
  /** Posición absoluta del logo del footer ("Powered by"). Solo aplica
   *  visualmente al B0; los demás variants ignoran el override. */
  footerLogoPosition?: { x: number; y: number };
  modules?: string[];
  /** Background compartido por las 4 variants. Tiene prioridad sobre el
   *  `b{N}.background` (legacy). */
  background?: { type?: 'image' | 'video'; src?: string };
  /** Settings idle compartidos: shape unificado para los 4 variants. */
  b0?: BillboardVariantPatch;
  b1?: BillboardVariantPatch;
  b2?: BillboardVariantPatch;
  b3?: BillboardVariantPatch;
};

type AiAvatarPatch = {
  avatar?: string;
  heroVideo?: string;
  greeting?: string;
  suggestedQuestions?: Array<{ id: string; text: string }>;
};

/**
 * Eventos globales del Studio bridge consumidos por componentes runtime.
 */
export const KIOSK_MODULES_OVERRIDE_EVENT = 'kiosk:modules-override';
export const KIOSK_SYSTEM_MODULES_EVENT = 'kiosk:system-modules-override';
export const KIOSK_BILLBOARD_OVERRIDE_EVENT = 'kiosk:billboard-override';
export const KIOSK_AI_AVATAR_OVERRIDE_EVENT = 'kiosk:ai-avatar-override';
export const KIOSK_LOGO_OVERRIDE_EVENT = 'kiosk:logo-override';
export const KIOSK_SURVEY_OVERRIDE_EVENT = 'kiosk:survey-override';
export const KIOSK_DEALS_OVERRIDE_EVENT = 'kiosk:deals-override';
export const KIOSK_PHOTO_BOOTH_OVERRIDE_EVENT = 'kiosk:photo-booth-override';
export const KIOSK_BROCHURES_OVERRIDE_EVENT = 'kiosk:brochures-override';
export const KIOSK_SOCIAL_WALL_OVERRIDE_EVENT = 'kiosk:social-wall-override';
export const KIOSK_GUESTBOOK_OVERRIDE_EVENT = 'kiosk:guestbook-override';
export const KIOSK_LISTINGS_OVERRIDE_EVENT = 'kiosk:listings-override';
export const KIOSK_EVENTS_OVERRIDE_EVENT = 'kiosk:events-override';
export const KIOSK_TICKETS_OVERRIDE_EVENT = 'kiosk:tickets-override';
export const KIOSK_PASSES_OVERRIDE_EVENT = 'kiosk:passes-override';
export const KIOSK_TRAILS_OVERRIDE_EVENT = 'kiosk:trails-override';
export const KIOSK_ITINERARY_OVERRIDE_EVENT = 'kiosk:itinerary-override';
export const KIOSK_ADS_OVERRIDE_EVENT = 'kiosk:ads-override';
export const KIOSK_MAP_OVERRIDE_EVENT = 'kiosk:map-override';
export const KIOSK_INTEGRATIONS_OVERRIDE_EVENT = 'kiosk:integrations-override';

function applyModulesOverride(modules: ModulesPatch) {
  if (typeof window === 'undefined') return;
  const tilesDetail = {
    tiles: modules.tiles,
    tileTitleFontSize: modules.tileTitleFontSize,
    tileOverlayOpacity: modules.tileOverlayOpacity,
  };
  // Cache en window: si el Home se monta DESPUÉS de este evento (navegación
  // interna del iframe, o el preview venía de otra pantalla), lo lee al montar
  // y aplica el toggle/orden/labels sin esperar a un nuevo push. Sin esto, un
  // módulo recién desactivado podía seguir visible hasta el próximo cambio.
  const w = window as Window & {
    __kioskModulesOverride?: unknown;
    __kioskSystemModulesOverride?: unknown;
  };
  w.__kioskModulesOverride = tilesDetail;
  window.dispatchEvent(new CustomEvent(KIOSK_MODULES_OVERRIDE_EVENT, { detail: tilesDetail }));
  if (modules.systemModules) {
    w.__kioskSystemModulesOverride = modules.systemModules;
    window.dispatchEvent(
      new CustomEvent(KIOSK_SYSTEM_MODULES_EVENT, { detail: modules.systemModules }),
    );
  }
}

function applyBillboardOverride(b: BillboardPatch) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_BILLBOARD_OVERRIDE_EVENT, { detail: b }));
}

function applyAiAvatarOverride(ai: AiAvatarPatch) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_AI_AVATAR_OVERRIDE_EVENT, { detail: ai }));
}

function applySurveyOverride(survey: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_SURVEY_OVERRIDE_EVENT, { detail: survey }));
}

function applyDealsOverride(deals: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_DEALS_OVERRIDE_EVENT, { detail: deals }));
}

function applyPhotoBoothOverride(photoBooth: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_PHOTO_BOOTH_OVERRIDE_EVENT, { detail: photoBooth }));
}

function applyBrochuresOverride(brochures: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_BROCHURES_OVERRIDE_EVENT, { detail: brochures }));
}

function applySocialWallOverride(socialWall: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_SOCIAL_WALL_OVERRIDE_EVENT, { detail: socialWall }));
}

function applyGuestbookOverride(guestbook: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_GUESTBOOK_OVERRIDE_EVENT, { detail: guestbook }));
}

function applyListingsOverride(listings: unknown) {
  if (typeof window === 'undefined') return;
  // Cachear el último override para que componentes que monten DESPUÉS del
  // dispatch (e.g. navegación SPA a /home/<dyn-module>) puedan recuperarlo.
  (window as KioskBridgeWindow).__kioskListings = listings;
  window.dispatchEvent(new CustomEvent(KIOSK_LISTINGS_OVERRIDE_EVENT, { detail: listings }));
}

/** Devuelve el último listings override cacheado (o null si nunca se dispatched). */
export function getCachedListings(): unknown {
  if (typeof window === 'undefined') return null;
  return (window as KioskBridgeWindow).__kioskListings ?? null;
}

function applyEventsOverride(events: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_EVENTS_OVERRIDE_EVENT, { detail: events }));
}

function applyTicketsOverride(tickets: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_TICKETS_OVERRIDE_EVENT, { detail: tickets }));
}

function applyPassesOverride(passes: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_PASSES_OVERRIDE_EVENT, { detail: passes }));
}

function applyTrailsOverride(trails: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_TRAILS_OVERRIDE_EVENT, { detail: trails }));
}

function applyItineraryOverride(itineraryBuilder: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(KIOSK_ITINERARY_OVERRIDE_EVENT, { detail: itineraryBuilder }),
  );
}

function applyMapOverride(map: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_MAP_OVERRIDE_EVENT, { detail: map }));
}

function applyIntegrationsOverride(integrations: unknown) {
  if (typeof window === 'undefined') return;
  // Cache en window para que un component que se monte tarde
  // (post-`studio:integrations-update`) pueda leer el último valor sin
  // esperar al siguiente push del Studio.
  (window as unknown as { __kioskIntegrationsOverride?: unknown }).__kioskIntegrationsOverride =
    integrations;
  window.dispatchEvent(
    new CustomEvent(KIOSK_INTEGRATIONS_OVERRIDE_EVENT, { detail: integrations }),
  );
}

function applyAdsOverride(ads: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_ADS_OVERRIDE_EVENT, { detail: ads }));
}

/** Evento global que el `PwaBridgeProvider` escucha para reemplazar el slice
 *  `features.pwa` activo cuando el editor PWA del Studio empuja cambios. */
export const PWA_CONFIG_OVERRIDE_EVENT = 'pwa:config-override';

function applyPwaOverride(pwa: unknown) {
  if (typeof window === 'undefined') return;
  // Cachear el último override para que un provider que monte DESPUÉS del
  // dispatch (navegación SPA dentro del iframe) pueda hidratarse al mount.
  (window as PwaBridgeWindow).__pwaConfigOverride = pwa;
  window.dispatchEvent(new CustomEvent(PWA_CONFIG_OVERRIDE_EVENT, { detail: pwa }));
}

interface PwaBridgeWindow extends Window {
  __pwaConfigOverride?: unknown;
  __pwaActiveSection?: string;
}

/** Lee el último slice `features.pwa` que el bridge haya aplicado, o `null`. */
export function getCachedPwaOverride(): unknown {
  if (typeof window === 'undefined') return null;
  return (window as PwaBridgeWindow).__pwaConfigOverride ?? null;
}

/** Evento global que el `PwaBridgeProvider` escucha para saber qué sección del
 *  editor PWA está activa (F-PWA-2). */
export const PWA_ACTIVE_SECTION_EVENT = 'pwa:active-section';

function applyPwaActiveSection(section: string) {
  if (typeof window === 'undefined') return;
  (window as PwaBridgeWindow).__pwaActiveSection = section;
  window.dispatchEvent(new CustomEvent(PWA_ACTIVE_SECTION_EVENT, { detail: section }));
}

/** Lee la última sección activa del editor PWA que el bridge haya anunciado. */
export function getCachedPwaActiveSection(): string | null {
  if (typeof window === 'undefined') return null;
  return (window as PwaBridgeWindow).__pwaActiveSection ?? null;
}

const injectedFontLinks = new Set<string>();

function applyBranding(branding: BrandingPatch) {
  const root = document.documentElement;
  const set = (name: string, value: string | undefined) => {
    if (!value) return;
    root.style.setProperty(name, value, 'important');
  };
  set('--brand-primary', branding.primary);
  set('--brand-secondary', branding.secondary);
  set('--brand-tertiary', branding.tertiary);

  // Custom fonts (drag&drop @font-face). Si están presentes, sobreescriben la
  // Google Font seleccionada para ese slot.
  const displayCustom = branding.fonts?.displayCustom;
  const bodyCustom = branding.fonts?.bodyCustom;
  if (displayCustom) injectCustomFontFace(displayCustom);
  if (bodyCustom) injectCustomFontFace(bodyCustom);

  // Fonts dinámicas vía Google Fonts. Inyecta <link> por familia y override
  // las CSS vars que Tailwind / componentes consumen.
  const display = branding.fonts?.display;
  const body = branding.fonts?.body;
  const displayFamily = displayCustom?.name ?? display;
  const bodyFamily = bodyCustom?.name ?? body;
  if (display && !displayCustom) ensureGoogleFont(display);
  if (body && !bodyCustom) ensureGoogleFont(body);
  if (displayFamily) {
    root.style.setProperty(
      '--font-display',
      `"${displayFamily}", var(--font-noto-jp, "Noto Sans JP"), system-ui, -apple-system, "Segoe UI", sans-serif`,
      'important',
    );
  }
  if (bodyFamily) {
    root.style.setProperty(
      '--font-sans',
      `"${bodyFamily}", var(--font-noto-jp, "Noto Sans JP"), system-ui, -apple-system, "Segoe UI", sans-serif`,
      'important',
    );
  }

  // Favicon dinámico.
  if (branding.favicon) {
    setFavicon(branding.favicon);
  }

  // Logos: dos eventos diferenciados (default = header del kiosk, idle =
  // logo grande del Billboard). Componentes consumen `slot` para escuchar
  // solo el suyo. También guardamos el último valor en `window.__kioskLogos`
  // para que componentes que se monten DESPUÉS del último dispatch (ej. al
  // navegar entre rutas dentro del iframe) puedan leerlo en su mount.
  const cache = (window as KioskBridgeWindow).__kioskLogos ?? {};
  if (branding.logo !== undefined) {
    cache.default = branding.logo;
    window.dispatchEvent(
      new CustomEvent(KIOSK_LOGO_OVERRIDE_EVENT, {
        detail: { slot: 'default', logo: branding.logo },
      }),
    );
  }
  if (branding.idleLogo !== undefined) {
    cache.idle = branding.idleLogo;
    window.dispatchEvent(
      new CustomEvent(KIOSK_LOGO_OVERRIDE_EVENT, {
        detail: { slot: 'idle', logo: branding.idleLogo },
      }),
    );
  }
  if (branding.footerLogo !== undefined) {
    cache.footer = branding.footerLogo;
    window.dispatchEvent(
      new CustomEvent(KIOSK_LOGO_OVERRIDE_EVENT, {
        detail: { slot: 'footer', logo: branding.footerLogo },
      }),
    );
  }
  (window as KioskBridgeWindow).__kioskLogos = cache;

  // Client name (reactivo): interpola `{client_name}` en greeting/subtitle
  // del Ask AI, en módulos como Itinerary, etc. Evento separado para que
  // los componentes solo escuchen lo que necesitan.
  if (branding.clientName !== undefined) {
    (window as KioskBridgeWindow).__kioskClientName = branding.clientName;
    window.dispatchEvent(
      new CustomEvent(KIOSK_CLIENT_NAME_OVERRIDE_EVENT, {
        detail: { clientName: branding.clientName },
      }),
    );
  }

  // Client coords (reactivo): centra el módulo Map y el "distance" sort
  // sin esperar a publish. Cuando el operador crea un kiosk con
  // `Location: Davenport, FL` y Nominatim resuelve coords, el bridge las
  // envía aquí.
  if (branding.clientCoords) {
    (window as KioskBridgeWindow).__kioskClientCoords = branding.clientCoords;
    window.dispatchEvent(
      new CustomEvent(KIOSK_CLIENT_COORDS_OVERRIDE_EVENT, {
        detail: { coords: branding.clientCoords },
      }),
    );
  }

  // Hero header background + gradient. Mismo patrón que logos: dispatch
  // event + cache en window para que componentes que se monten DESPUÉS
  // del último dispatch (ej. nav entre rutas dentro del iframe) puedan
  // leer el override actual.
  if (
    branding.homeHero !== undefined ||
    branding.heroGradient !== undefined ||
    branding.heroLogoSize !== undefined
  ) {
    const heroCache = (window as KioskBridgeWindow).__kioskHero ?? {};
    if (branding.homeHero !== undefined) heroCache.homeHero = branding.homeHero;
    if (branding.heroGradient !== undefined) heroCache.heroGradient = branding.heroGradient;
    if (branding.heroLogoSize !== undefined) heroCache.heroLogoSize = branding.heroLogoSize;
    (window as KioskBridgeWindow).__kioskHero = heroCache;
    window.dispatchEvent(
      new CustomEvent(KIOSK_HERO_OVERRIDE_EVENT, {
        detail: {
          homeHero: branding.homeHero,
          heroGradient: branding.heroGradient,
          heroLogoSize: branding.heroLogoSize,
        },
      }),
    );
  }
}

interface KioskBridgeWindow extends Window {
  __kioskLogos?: { default?: string; idle?: string; footer?: string };
  __kioskHero?: HeroOverrideDetail;
  __kioskClientName?: string;
  __kioskClientCoords?: { lat: number; lng: number };
  __kioskListings?: unknown;
}

/**
 * Lee el último override de hero (homeHero/heroGradient) que el bridge
 * haya aplicado. Usado por `<HeroBackgroundLayer>` en su mount inicial
 * para que respete el state actual del editor sin esperar a un nuevo
 * postMessage.
 */
export function getCachedHeroOverride(): HeroOverrideDetail {
  if (typeof window === 'undefined') return {};
  return (window as KioskBridgeWindow).__kioskHero ?? {};
}

/**
 * Lee el último client name override que el bridge haya aplicado, si
 * existe. Usado por hooks reactivos para hidratar el estado al mount
 * sin esperar el siguiente postMessage.
 */
export function getCachedClientName(): string | null {
  if (typeof window === 'undefined') return null;
  return (window as KioskBridgeWindow).__kioskClientName ?? null;
}

/**
 * Lee las últimas coords del cliente que el bridge haya aplicado.
 * Usado por componentes que necesitan actualizar el centro del mapa
 * o el sort por distancia.
 */
export function getCachedClientCoords(): { lat: number; lng: number } | null {
  if (typeof window === 'undefined') return null;
  return (window as KioskBridgeWindow).__kioskClientCoords ?? null;
}

/**
 * Lee el último logo que el bridge ha aplicado para un slot dado.
 * Usado por `<TrueOmniLogo>` cuando se monta después del dispatch (ej. al
 * navegar entre /home y / dentro del iframe del Studio).
 */
export function getCachedLogoOverride(slot: 'default' | 'idle' | 'footer'): string | null {
  if (typeof window === 'undefined') return null;
  const cache = (window as KioskBridgeWindow).__kioskLogos;
  return cache?.[slot] ?? null;
}

const injectedCustomFonts = new Set<string>();

/**
 * Mapea la extensión del archivo al valor canónico que CSS Fonts spec
 * acepta dentro de `format()`. Pasar "ttf" u "otf" directamente hace que
 * Chrome/Safari descarten silenciosamente el @font-face — por eso el font
 * subido por el usuario "no se aplicaba" y caía al fallback system-ui.
 *
 * Spec: https://drafts.csswg.org/css-fonts/#font-face-rule
 */
const CSS_FORMAT_BY_EXT: Record<CustomFontPatch['format'], string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
};

function injectCustomFontFace(font: CustomFontPatch) {
  const id = `kiosk-custom-font-${font.name.replace(/\s+/g, '-').toLowerCase()}`;
  // Si ya fue inyectada con el MISMO dataUrl, skip. Si la font cambió de
  // bytes, removemos el style anterior para que el browser cargue la nueva.
  const existing = document.getElementById(id) as HTMLStyleElement | null;
  if (existing) {
    if (existing.dataset.fontHash === font.dataUrl.length.toString()) return;
    existing.remove();
    injectedCustomFonts.delete(id);
  }
  const cssFormat = CSS_FORMAT_BY_EXT[font.format] ?? font.format;
  const style = document.createElement('style');
  style.id = id;
  style.dataset.fontHash = font.dataUrl.length.toString();
  style.textContent = `@font-face {
  font-family: "${font.name}";
  src: url(${font.dataUrl}) format("${cssFormat}");
  font-display: swap;
}`;
  document.head.appendChild(style);
  injectedCustomFonts.add(id);
}

function ensureGoogleFont(family: string) {
  const id = FONT_LINK_PREFIX + family.replace(/\s+/g, '-').toLowerCase();
  if (injectedFontLinks.has(id) || document.getElementById(id)) return;
  injectedFontLinks.add(id);

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

function setFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}
