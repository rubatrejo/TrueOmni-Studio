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
        default:
          break;
      }
    };

    window.addEventListener('message', handler);

    const announceReady = () => {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'studio:ready' }, '*');
        }
      } catch {}
    };
    announceReady();
    const t1 = setTimeout(announceReady, 50);
    const t2 = setTimeout(announceReady, 250);
    const t3 = setTimeout(announceReady, 800);
    // Heartbeat: re-anunciamos cada 5s para que el host pueda detectar
    // desconexiones reales del bridge (postMessage roto, iframe paused…).
    const heartbeat = setInterval(announceReady, 5000);

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
};

type ModulesPatch = {
  tiles: Array<{ key: string; label: string; enabled: boolean }>;
  systemModules?: { ads: boolean; languages: boolean; aiAvatar: boolean };
};

type BillboardPatch = {
  variant: 0 | 1 | 2 | 3;
  idleTimeoutSec: number;
  logoSize?: 'S' | 'M' | 'L';
  /** Tamaño del logo del footer (mismo enum, mapping diferente). */
  footerLogoSize?: 'S' | 'M' | 'L';
  modules?: string[];
  /** Settings exclusivos del variant 0 (Dark Hero). */
  b0?: {
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
  /** Background editable per variant (B1/B2/B3). */
  b1?: { background?: { type: 'image' | 'video'; src: string } };
  b2?: { background?: { type: 'image' | 'video'; src: string } };
  b3?: { background?: { type: 'image' | 'video'; src: string } };
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

function applyModulesOverride(modules: ModulesPatch) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(KIOSK_MODULES_OVERRIDE_EVENT, {
      detail: { tiles: modules.tiles },
    }),
  );
  if (modules.systemModules) {
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
  window.dispatchEvent(new CustomEvent(KIOSK_LISTINGS_OVERRIDE_EVENT, { detail: listings }));
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

function applyAdsOverride(ads: unknown) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KIOSK_ADS_OVERRIDE_EVENT, { detail: ads }));
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
  if (branding.homeHero !== undefined || branding.heroGradient !== undefined) {
    const heroCache = (window as KioskBridgeWindow).__kioskHero ?? {};
    if (branding.homeHero !== undefined) heroCache.homeHero = branding.homeHero;
    if (branding.heroGradient !== undefined) heroCache.heroGradient = branding.heroGradient;
    (window as KioskBridgeWindow).__kioskHero = heroCache;
    window.dispatchEvent(
      new CustomEvent(KIOSK_HERO_OVERRIDE_EVENT, {
        detail: {
          homeHero: branding.homeHero,
          heroGradient: branding.heroGradient,
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
