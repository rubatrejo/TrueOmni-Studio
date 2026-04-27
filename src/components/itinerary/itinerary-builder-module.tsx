'use client';

import { useEffect, useState } from 'react';

import type { ItineraryConfig, KioskConfig } from '@/lib/config';
import { useItineraryRail } from '@/lib/itinerary-favorites';
import type { WeatherData } from '@/lib/weather';

import { WelcomePopup } from './welcome-popup';

export type ItineraryPhase =
  | 'welcome'
  | 'manual'
  | 'local-preview'
  | 'ai-popup'
  | 'ai-wizard'
  | 'ai-loading'
  | 'ai-result'
  | 'share';

export interface ItineraryBuilderModuleProps {
  config: ItineraryConfig;
  client: KioskConfig['client'];
  textos: Record<string, string>;
  logoSrc: string;
  logoAlt: string;
  weather: WeatherData | null;
  mapboxToken?: string;
}

const WELCOME_STORAGE_KEY = 'kiosk_itinerary_welcomed';

/** Interpola `{client_name}` en strings tokenizados. */
function fmt(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, v),
    template ?? '',
  );
}

export function ItineraryBuilderModule(props: ItineraryBuilderModuleProps) {
  const { config, client, textos, mapboxToken } = props;
  const rail = useItineraryRail();

  const initialPhase: ItineraryPhase = config.welcome_always_visible
    ? 'welcome'
    : (() => {
        if (typeof window === 'undefined') return 'welcome';
        try {
          return window.sessionStorage.getItem(WELCOME_STORAGE_KEY) === '1' ? 'manual' : 'welcome';
        } catch {
          return 'welcome';
        }
      })();
  const [phase, setPhase] = useState<ItineraryPhase>(initialPhase);

  useEffect(() => {
    if (phase !== 'welcome') {
      try {
        window.sessionStorage.setItem(WELCOME_STORAGE_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  }, [phase]);

  const interp = { client_name: client.nombre };

  return (
    <div className="absolute inset-0 bg-background text-foreground">
      {/* Pantalla manual (placeholder mientras se construye en sub-fases siguientes) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-5xl font-semibold">{textos.itinerary_title}</h1>
          <p className="mb-6 text-xl text-muted-foreground">
            Phase 3.17 in progress · current phase: {phase}
          </p>
          <p className="mb-6 text-base text-muted-foreground/70">
            Stops in rail: {rail.count}
          </p>
          {phase === 'manual' && (
            <button
              type="button"
              onClick={() => setPhase('welcome')}
              className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground"
            >
              Re-open Welcome
            </button>
          )}
        </div>
      </div>

      {phase === 'welcome' && (
        <WelcomePopup
          textos={{
            kicker: textos.itinerary_welcome_kicker ?? 'NEW · 3D TRIP PLANNER',
            intro: textos.itinerary_welcome_intro ?? 'DISCOVER YOUR PERFECT VISIT',
            title: fmt(
              textos.itinerary_welcome_title ?? "WELCOME TO {client_name}'S\nOFFICIAL TRIP BUILDER.",
              interp,
            ),
            body:
              textos.itinerary_welcome_body ??
              'Discover the city your way curated for you or explored at your own pace.',
            createCta: textos.itinerary_welcome_create_cta ?? 'Create Itinerary',
            aiCta: textos.itinerary_welcome_ai_cta ?? 'AI Itinerary',
            categoryThings: textos.itinerary_welcome_category_things ?? 'THINGS TO DO',
            categoryRestaurants:
              textos.itinerary_welcome_category_restaurants ?? 'RESTAURANTS',
            categoryStay: textos.itinerary_welcome_category_stay ?? 'PLACES TO STAY',
            categoryVenues: textos.itinerary_welcome_category_venues ?? 'VENUES',
          }}
          clientCoords={client.coords}
          mapboxToken={mapboxToken}
          onCreate={() => setPhase('manual')}
          onAi={() => setPhase('ai-popup')}
          onClose={() => setPhase('manual')}
        />
      )}
    </div>
  );
}
