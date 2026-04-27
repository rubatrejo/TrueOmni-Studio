'use client';

import { useEffect, useMemo, useState } from 'react';

import type { ItineraryConfig, KioskConfig } from '@/lib/config';
import {
  filterCatalogBySearch,
  getItineraryCatalogAll,
  getItineraryCatalogForModule,
  type ItineraryCatalogItem,
} from '@/lib/itinerary-catalog';
import { useItineraryRail } from '@/lib/itinerary-favorites';
import { LOCAL_LISTINGS_TAB_SLUG, getItineraryTabs } from '@/lib/itinerary-tabs';
import type { WeatherData } from '@/lib/weather';

import { CategoryTabsRow } from './category-tabs-row';
import { ItineraryHeader } from './itinerary-header';
import { ListingsColumn } from './listings-column';
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
  fullConfig: KioskConfig;
  client: KioskConfig['client'];
  textos: Record<string, string>;
  logoSrc: string;
  logoAlt: string;
  weather: WeatherData | null;
  mapboxToken?: string;
}

const WELCOME_STORAGE_KEY = 'kiosk_itinerary_welcomed';

function fmt(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, v),
    template ?? '',
  );
}

export function ItineraryBuilderModule(props: ItineraryBuilderModuleProps) {
  const { config, fullConfig, client, textos, mapboxToken } = props;
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

  const tabs = useMemo(
    () => getItineraryTabs(fullConfig, textos.itinerary_local_listings_tab_label ?? 'Local Listings'),
    [fullConfig, textos.itinerary_local_listings_tab_label],
  );
  const [activeTabSlug, setActiveTabSlug] = useState<string>(() => tabs[0]?.slug ?? '');
  const [searchValue, setSearchValue] = useState('');
  const [collapsedListings, setCollapsedListings] = useState(false);

  const activeTab = tabs.find((t) => t.slug === activeTabSlug);

  const items = useMemo<ItineraryCatalogItem[]>(() => {
    if (!activeTab) return [];
    if (!activeTab.isModule) {
      // Tab Local Listings — no son items normales del catálogo, su preview se
      // renderiza por separado (sub-fase 3.17-8). Aquí devolvemos []
      return [];
    }
    return getItineraryCatalogForModule(fullConfig, activeTab.slug);
  }, [activeTab, fullConfig]);

  const filteredItems = useMemo(
    () => filterCatalogBySearch(items, searchValue),
    [items, searchValue],
  );

  // Catálogo total (para el mapa, próxima sub-fase). Lo calculamos aquí para
  // tener la lista lista cuando el mapa se monte.
  const allCatalog = useMemo(() => getItineraryCatalogAll(fullConfig), [fullConfig]);
  void allCatalog; // Sub-fase 3.17-5 lo consumirá.

  const interp = { client_name: client.nombre };

  return (
    <div
      className="absolute inset-0 bg-background text-foreground"
      data-itinerary-canvas
      data-phase={phase}
    >
      {phase !== 'welcome' && phase !== 'ai-popup' && (
        <>
          <ItineraryHeader
            weather={props.weather}
            locale={client.locale ?? 'en-US'}
            timezone={client.timezone}
            title={textos.itinerary_title ?? 'Itinerary Builder'}
            searchPlaceholder={textos.itinerary_search_placeholder ?? 'Search…'}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
          />
          <CategoryTabsRow
            tabs={tabs}
            activeSlug={activeTabSlug}
            onSelect={(slug) => {
              setActiveTabSlug(slug);
              setSearchValue('');
            }}
          />

          {/* Map area placeholder (3.17-5 lo reemplaza con MapCanvas + ruta) */}
          <div
            className="absolute"
            style={{
              left: 0,
              top: 320,
              right: 0,
              bottom: 380,
              backgroundColor: 'hsl(220 14% 92%)',
              zIndex: 5,
            }}
            aria-label="Map placeholder"
          >
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-muted-foreground">
              Map placeholder · sub-phase 3.17-5
            </div>
          </div>

          {/* Listings column */}
          {activeTab?.isModule && (
            <ListingsColumn
              items={filteredItems}
              isInRail={(slug, kind) => rail.has(slug, kind)}
              onToggle={(item) =>
                rail.has(item.slug, item.kind)
                  ? rail.remove(item.slug, item.kind)
                  : rail.add(item.slug, item.kind)
              }
              collapsed={collapsedListings}
              onToggleCollapsed={() => setCollapsedListings((c) => !c)}
              clientCoords={client.coords}
              emptyLabel="No items match your search."
            />
          )}

          {/* Bottom bar placeholder (3.17-5 lo reemplaza con MapToolbar + StopsRail) */}
          <div
            className="absolute left-0 right-0 bg-zinc-100 px-6 py-4 text-sm text-muted-foreground"
            style={{ bottom: 0, height: 380, zIndex: 30 }}
          >
            <p className="mb-2 font-semibold text-foreground">
              Stops in rail: {rail.count} (drag&drop + map · sub-phase 3.17-5/6)
            </p>
            {phase === 'manual' && (
              <button
                type="button"
                onClick={() => setPhase('welcome')}
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                Re-open Welcome
              </button>
            )}
          </div>
        </>
      )}

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
