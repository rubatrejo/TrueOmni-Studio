'use client';

import { useEffect, useRef } from 'react';

import type {
  AdsModule,
  AiAvatarConfig,
  BillboardConfig,
  Branding,
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
 * `useStudioBridgeSync` — consolida los 18 `useEffect(() => pushX(X), [X])`
 * que vivían en `Shell.tsx` en un único hook con diff por slot. Hallazgos
 * S-32 y S-33 del audit panorámico v2:
 *
 *   - **S-32** (25 useEffects): el problema señalado por el audit era el
 *     fan-out de effects al primer mount; cada useEffect disparaba su
 *     postMessage individual sin batchear. Ahora corre un solo useEffect
 *     que diff-ea cada slot contra el snapshot previo y solo emite los
 *     que cambiaron.
 *   - **S-33** (Shell.tsx 1072 ln): mover ~85 ln de boilerplate a un
 *     archivo separado libera espacio en el componente principal y
 *     centraliza la sincronización.
 *
 * El hook NO cambia la API del bridge ni el contrato con el iframe; solo
 * concentra el flujo de push.
 */

export interface StudioBridgeState {
  branding: Branding;
  modules: ModulesConfig;
  billboard: BillboardConfig;
  aiAvatar: AiAvatarConfig;
  survey: SurveyConfig;
  deals: DealsModuleConfig;
  photoBooth: PhotoBoothConfig;
  brochures: BrochuresModuleConfig;
  socialWall: SocialWallConfig;
  guestbook: GuestbookConfig;
  listings: ListingsModule;
  events: EventsModule;
  tickets: TicketsModule;
  passes: PassesModule;
  trails: TrailsModule;
  map: MapConfig;
  itinerary: ItineraryBuilderConfig;
  ads: AdsModule;
  integrations: IntegrationsConfig;
}

export interface StudioBridgePushers {
  pushBranding: (branding: BrandingPushPayload) => void;
  pushModules: (modules: ModulesConfig) => void;
  pushBillboard: (billboard: BillboardConfig) => void;
  pushAiAvatar: (aiAvatar: AiAvatarConfig) => void;
  pushSurvey: (survey: SurveyConfig) => void;
  pushDeals: (deals: DealsModuleConfig) => void;
  pushPhotoBooth: (photoBooth: PhotoBoothConfig) => void;
  pushBrochures: (brochures: BrochuresModuleConfig) => void;
  pushSocialWall: (socialWall: SocialWallConfig) => void;
  pushGuestbook: (guestbook: GuestbookConfig) => void;
  pushListings: (listings: ListingsModule) => void;
  pushEvents: (events: EventsModule) => void;
  pushTickets: (tickets: TicketsModule) => void;
  pushPasses: (passes: PassesModule) => void;
  pushTrails: (trails: TrailsModule) => void;
  pushMap: (map: MapConfig) => void;
  pushItinerary: (itinerary: ItineraryBuilderConfig) => void;
  pushAds: (ads: AdsModule) => void;
  pushIntegrations: (integrations: IntegrationsConfig) => void;
}

/** Payload del branding push — incluye el branding más metadata del cliente. */
export interface BrandingPushPayload extends Branding {
  clientName: string;
  clientCoords?: { lat: number; lng: number };
}

export interface UseStudioBridgeSyncContext {
  /** Nombre del cliente (no parte del Branding pero el bridge lo necesita). */
  clientName: string;
  clientCoords?: { lat: number; lng: number };
}

/**
 * Sincroniza el state del editor kiosk con el iframe del preview.
 *
 * Diff por referencia (`Object.is`): si el slot del state es la misma
 * referencia que en el render anterior, no se emite el push. React garantiza
 * que cuando un `setX(prev)` produce el mismo valor, mantiene la referencia,
 * así que esta optimización es coherente con el modelo de React.
 *
 * Para el primer render `previousRef.current` es null → emite todos los
 * slots como "initial sync". El bridge se encarga del buffering hasta que
 * el iframe haga handshake.
 */
export function useStudioBridgeSync(
  state: StudioBridgeState,
  pushers: StudioBridgePushers,
  ctx: UseStudioBridgeSyncContext,
): void {
  const previousRef = useRef<StudioBridgeState | null>(null);

  useEffect(() => {
    const prev = previousRef.current;
    const isInitial = prev === null;

    if (isInitial || !Object.is(prev.branding, state.branding)) {
      pushers.pushBranding({
        ...state.branding,
        clientName: ctx.clientName,
        clientCoords: ctx.clientCoords,
      });
    }
    if (isInitial || !Object.is(prev.modules, state.modules)) {
      pushers.pushModules(state.modules);
    }
    if (isInitial || !Object.is(prev.billboard, state.billboard)) {
      pushers.pushBillboard(state.billboard);
    }
    if (isInitial || !Object.is(prev.aiAvatar, state.aiAvatar)) {
      pushers.pushAiAvatar(state.aiAvatar);
    }
    if (isInitial || !Object.is(prev.survey, state.survey)) {
      pushers.pushSurvey(state.survey);
    }
    if (isInitial || !Object.is(prev.deals, state.deals)) {
      pushers.pushDeals(state.deals);
    }
    if (isInitial || !Object.is(prev.photoBooth, state.photoBooth)) {
      pushers.pushPhotoBooth(state.photoBooth);
    }
    if (isInitial || !Object.is(prev.brochures, state.brochures)) {
      pushers.pushBrochures(state.brochures);
    }
    if (isInitial || !Object.is(prev.socialWall, state.socialWall)) {
      pushers.pushSocialWall(state.socialWall);
    }
    if (isInitial || !Object.is(prev.guestbook, state.guestbook)) {
      pushers.pushGuestbook(state.guestbook);
    }
    if (isInitial || !Object.is(prev.listings, state.listings)) {
      pushers.pushListings(state.listings);
    }
    if (isInitial || !Object.is(prev.events, state.events)) {
      pushers.pushEvents(state.events);
    }
    if (isInitial || !Object.is(prev.tickets, state.tickets)) {
      pushers.pushTickets(state.tickets);
    }
    if (isInitial || !Object.is(prev.passes, state.passes)) {
      pushers.pushPasses(state.passes);
    }
    if (isInitial || !Object.is(prev.trails, state.trails)) {
      pushers.pushTrails(state.trails);
    }
    if (isInitial || !Object.is(prev.map, state.map)) {
      pushers.pushMap(state.map);
    }
    if (isInitial || !Object.is(prev.itinerary, state.itinerary)) {
      pushers.pushItinerary(state.itinerary);
    }
    if (isInitial || !Object.is(prev.ads, state.ads)) {
      pushers.pushAds(state.ads);
    }
    if (isInitial || !Object.is(prev.integrations, state.integrations)) {
      pushers.pushIntegrations(state.integrations);
    }

    previousRef.current = state;
  }, [
    state,
    pushers,
    ctx.clientName,
    ctx.clientCoords,
  ]);
}
