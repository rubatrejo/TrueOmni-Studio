'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTextosMap } from '@/components/i18n-provider';
import type { ItineraryConfig, KioskConfig, MapSource } from '@/lib/config';
import type { MapItem } from '@/lib/map-item';
import {
  distanceMi,
  filterCatalogBySearch,
  getItineraryCatalogAll,
  getItineraryCatalogForModule,
  type ItineraryCatalogItem,
} from '@/lib/itinerary-catalog';
import { useItineraryRail, type ItineraryRailEntry } from '@/lib/itinerary-favorites';
import { LOCAL_LISTINGS_TAB_SLUG, getItineraryTabs } from '@/lib/itinerary-tabs';
import { useItineraryDnd } from '@/lib/use-itinerary-dnd';
import type { WeatherData } from '@/lib/weather';

import { generateItinerary, type GeneratedItinerary } from '@/lib/ai-itinerary';
import { MapPinBubble } from '@/components/map/map-pin-bubble';
import { OnScreenKeyboard, type KeyboardKey } from '@/components/home/on-screen-keyboard';
import { DraggableKeyboard } from '@/components/keyboard/draggable-keyboard';
import { ListingDetail } from '@/components/listings/listing-detail';
import { FloatingHomeButton } from '@/components/listings/floating-home-button';
import { buildItineraryDetailLookup } from '@/lib/itinerary-detail-lookup';
import { SendConfirmationPopup } from '@/components/listings/send-confirmation-popup';
import { SendToEmailModal } from '@/components/listings/send-to-email-modal';
import { SendToPhoneModal } from '@/components/listings/send-to-phone-modal';

import { AiItineraryFloatingCard } from './ai-floating-card';
import { AiLoadingScreen } from './ai-loading-screen';
import { AiPopup } from './ai-popup';
import { AiResultScreen } from './ai-result-screen';
import { TopSuggestionsScreen } from './top-suggestions-screen';
import { AiWizard, type AiAnswers } from './ai-wizard';
import { CategoryTabsRow } from './category-tabs-row';
import { DragGhost } from './drag-ghost';
import {
  EventsWeekStrip,
  getWeekStart,
  isoDate,
  shiftWeek,
} from './events-week-strip';
import { ItineraryFinishedPopup } from './itinerary-finished-popup';
import { ItineraryHeader } from './itinerary-header';
import { ItineraryMap } from './itinerary-map';
import { LeaveAiWarningPopup } from './leave-ai-warning-popup';
import { ShareItineraryModal } from './share-itinerary-modal';
import { ListingsColumn } from './listings-column';
import { LocalListingPreview } from './local-listing-preview';
import { LocalListingsColumn } from './local-listings-column';
import { MapToolbar } from './map-toolbar';
import { StopsRail } from './stops-rail';
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
  const { config, fullConfig, client, mapboxToken } = props;
  const textos = useTextosMap();
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
    () =>
      getItineraryTabs(fullConfig, textos.itinerary_local_listings_tab_label ?? 'Local Listings'),
    [fullConfig, textos.itinerary_local_listings_tab_label],
  );
  const [activeTabSlug, setActiveTabSlug] = useState<string>(() => tabs[0]?.slug ?? '');
  const [searchValue, setSearchValue] = useState('');
  const [collapsedListings, setCollapsedListings] = useState(false);
  const [showDriving, setShowDriving] = useState(config.show_driving_default ?? true);
  const [hideMarkers, setHideMarkers] = useState(config.hide_markers_default ?? false);
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => new Date().getDay());

  const activeTab = tabs.find((t) => t.slug === activeTabSlug);
  const isEventsTab = activeTab?.moduleKind === 'events';
  const isLocalListingsTab = activeTab?.slug === LOCAL_LISTINGS_TAB_SLUG;
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const previewItinerary = previewSlug
    ? config.local_listings.find((it) => it.slug === previewSlug) ?? null
    : null;
  const [aiAnswers, setAiAnswers] = useState<AiAnswers | null>(null);
  const [aiResult, setAiResult] = useState<GeneratedItinerary | null>(null);
  /** Discrimina la pantalla final según el path elegido en AiPopup:
   *  - `'ai'` (Start) → AiResultScreen con timeline/slider/carousel
   *  - `'top-suggestions'` (Let's Go) → TopSuggestionsScreen con QR + cards */
  const [aiPath, setAiPath] = useState<'ai' | 'top-suggestions'>('ai');
  const [leaveWarning, setLeaveWarning] = useState<null | 'wizard' | 'result'>(null);
  const [showFinishedPopup, setShowFinishedPopup] = useState<{ count: number } | null>(null);
  const [shareSubModal, setShareSubModal] = useState<'none' | 'email' | 'phone'>('none');
  const [smartRouteAlreadyOptimal, setSmartRouteAlreadyOptimal] = useState(false);
  const [sentDest, setSentDest] = useState<{ kind: 'email' | 'phone'; value: string } | null>(null);
  const [selectedSlug, setSelectedSlugRaw] = useState<string | null>(null);
  const [pinPos, setPinPos] = useState<{ left: number; top: number } | null>(null);
  // Wrapper que SIEMPRE limpia pinPos en el mismo tick que cambia el slug.
  // React 18 batchea ambos setState dentro de un mismo evento, evitando un
  // render intermedio donde se mostraría el bubble con CONTENIDO nuevo en
  // POSICIÓN vieja (causa principal del "flash" raro al cambiar de pin).
  const setSelectedSlug = useCallback((slug: string | null | ((prev: string | null) => string | null)) => {
    setSelectedSlugRaw(slug);
    setPinPos(null);
  }, []);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const detailLookup = useMemo(() => buildItineraryDetailLookup(fullConfig), [fullConfig]);
  // Memoizado para no recrear el objeto en cada render del módulo (re-runs del
  // effect del MapCanvas que reinician el ease del bubble switch).
  const mapFlyToPadding = useMemo(
    () => (collapsedListings ? { top: 200 } : { left: 420, top: 200 }),
    [collapsedListings],
  );

  const handleKeyboardKey = useCallback((k: KeyboardKey) => {
    if (k === 'BACKSPACE') {
      setSearchValue((q) => q.slice(0, -1));
      return;
    }
    if (k === 'SPACE') {
      setSearchValue((q) => q + ' ');
      return;
    }
    if (k === 'ENTER') {
      setShowKeyboard(false);
      return;
    }
    if (typeof k === 'string') {
      setSearchValue((q) => q + k);
    }
  }, []);

  const allCatalog = useMemo(() => getItineraryCatalogAll(fullConfig), [fullConfig]);

  const catalogIndex = useMemo(() => {
    const idx = new Map<string, ItineraryCatalogItem>();
    allCatalog.forEach((it) => idx.set(`${it.kind}:${it.slug}`, it));
    return idx;
  }, [allCatalog]);

  const items = useMemo<ItineraryCatalogItem[]>(() => {
    if (!activeTab || activeTab.slug === LOCAL_LISTINGS_TAB_SLUG || !activeTab.isModule) return [];
    return getItineraryCatalogForModule(fullConfig, activeTab.slug);
  }, [activeTab, fullConfig]);

  const filteredItems = useMemo(() => {
    let out = filterCatalogBySearch(items, searchValue);
    if (isEventsTab) {
      // Filtra eventos por día seleccionado, pero si no hay eventos ese día,
      // muestra todos los eventos del catálogo en lugar de empty state.
      const targetIso = isoDate(weekStart, selectedDayIndex);
      const sameDay = out.filter((it) => it.date === targetIso);
      out = sameDay.length > 0 ? sameDay : out;
    }
    return out;
  }, [items, searchValue, isEventsTab, weekStart, selectedDayIndex]);

  const resolveItem = useCallback(
    (entry: ItineraryRailEntry) => catalogIndex.get(`${entry.kind}:${entry.slug}`) ?? null,
    [catalogIndex],
  );

  const computeDistance = useCallback(
    (item: ItineraryCatalogItem) => (client.coords ? distanceMi(item.coords, client.coords) : 0),
    [client.coords],
  );

  const center = client.coords ?? { lat: 33.4484, lng: -112.074 };

  const interp = { client_name: client.nombre };

  // Auto-like de Top Suggestions: al entrar al screen, todos los items curados
  // se añaden al rail. El usuario puede quitar el like.
  useEffect(() => {
    if (phase !== 'ai-result' || aiPath !== 'top-suggestions') return;
    const sortByPop = (a: ItineraryCatalogItem, b: ItineraryCatalogItem) =>
      (b.popularity ?? 0) - (a.popularity ?? 0);
    const things = allCatalog
      .filter((it) => it.kind === 'listing' && it.moduleSlug !== 'restaurants' && it.moduleSlug !== 'stay')
      .concat(allCatalog.filter((it) => it.kind === 'trail'))
      .sort(sortByPop)
      .slice(0, 8);
    const evts = allCatalog.filter((it) => it.kind === 'event').sort(sortByPop).slice(0, 8);
    const rests = allCatalog
      .filter((it) => it.kind === 'listing' && it.moduleSlug === 'restaurants')
      .sort(sortByPop)
      .slice(0, 8);
    [...things, ...evts, ...rests].forEach((it) => rail.add(it.slug, it.kind));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, aiPath, allCatalog]);

  // Trigger generación cuando entramos a phase ai-loading.
  useEffect(() => {
    if (phase !== 'ai-loading' || !aiAnswers) return;
    let cancelled = false;
    generateItinerary({
      preferences: aiAnswers,
      questions: config.ai.questions,
      catalog: allCatalog,
      titleTemplate: config.ai.default_title_template,
      clientName: client.nombre,
      dayLabelTemplate: textos.itinerary_ai_day_label_template ?? 'Day {n}',
      planLabel: textos.itinerary_ai_plan_label ?? 'Plan',
      durationFallback: textos.itinerary_ai_duration_fallback ?? 'Trip',
    }).then((result) => {
      if (cancelled) return;
      setAiResult(result);
      setPhase('ai-result');
    });
    return () => {
      cancelled = true;
    };
  }, [
    phase,
    aiAnswers,
    allCatalog,
    config.ai.questions,
    config.ai.default_title_template,
    client.nombre,
  ]);

  const dnd = useItineraryDnd({
    onDrop: (payload, target) => {
      if (payload.type === 'card') {
        // Drop card → añadir al rail si está sobre el rail.
        if (target.overRail) {
          rail.add(payload.item.slug, payload.item.kind);
        }
        return;
      }
      if (payload.type === 'stop') {
        // Reorder dentro del rail.
        if (target.slotIndex !== null && target.slotIndex !== payload.fromIndex) {
          rail.reorder(payload.fromIndex, target.slotIndex);
        }
      }
    },
  });

  return (
    <div
      className="absolute inset-0 bg-background text-foreground"
      data-itinerary-canvas
      data-phase={phase}
    >
      {/* La pantalla manual se renderiza SIEMPRE como base. Los modales
          (welcome, ai-popup, share, leave-warning, finished) van encima como
          overlays. Las pantallas full-screen (ai-wizard, ai-loading, ai-result)
          ocultan el manual con su propio z-50. */}
      {(phase === 'welcome' ||
        phase === 'manual' ||
        phase === 'local-preview' ||
        phase === 'ai-popup' ||
        phase === 'share') && (
        <>
          <ItineraryHeader
            weather={props.weather}
            locale={client.locale ?? 'en-US'}
            timezone={client.timezone}
            title={textos.itinerary_title ?? 'Itinerary Builder'}
            searchPlaceholder={textos.itinerary_search_placeholder ?? 'Search…'}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onSearchFocus={() => setShowKeyboard(true)}
          />
          <CategoryTabsRow
            tabs={tabs}
            activeSlug={activeTabSlug}
            onSelect={(slug) => {
              setActiveTabSlug(slug);
              setSearchValue('');
            }}
          />

          {isEventsTab && (
            <EventsWeekStrip
              weekStart={weekStart}
              selectedDayIndex={selectedDayIndex}
              locale={client.locale ?? 'en-US'}
              onDayChange={setSelectedDayIndex}
              onPrevWeek={() => setWeekStart((w) => shiftWeek(w, -1))}
              onNextWeek={() => setWeekStart((w) => shiftWeek(w, 1))}
            />
          )}

          <ItineraryMap
            token={mapboxToken}
            center={center}
            zoom={11}
            catalog={allCatalog}
            stops={rail.stops}
            showRoute={showDriving}
            hideCatalogMarkers={hideMarkers}
            selectedSlug={selectedSlug}
            onSelect={(slug) => setSelectedSlug((prev) => (prev === slug ? null : slug))}
            onSelectedPosition={setPinPos}
            flyToPadding={mapFlyToPadding}
            fitRouteBounds
            unavailableLabel={textos.itinerary_map_unavailable}
            className="absolute"
            style={{
              left: 0,
              top: isEventsTab ? 540 : 340,
              right: 0,
              bottom: 366,
              zIndex: 5,
            }}
          />

          <AiItineraryFloatingCard
            label={textos.itinerary_ai_popup_title ?? 'AI ITINERARY'}
            onTap={() => setPhase('ai-popup')}
            topY={isEventsTab ? 540 : 360}
          />

          {activeTab?.isModule && (
            <ListingsColumn
              topY={isEventsTab ? 540 : undefined}
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
              emptyLabel={textos.itinerary_no_search_results ?? 'No items match your search.'}
              isSearching={searchValue.trim().length > 0}
              emptySearchTitle={textos.itinerary_empty_search_title ?? 'Ooops! Try again'}
              emptySearchBody={
                textos.itinerary_empty_search_body ??
                "We couldn't find any listings\nthat match your search. Please\nuse different keywords or\nexplore our categories."
              }
              distanceTemplate={textos.itinerary_distance_away ?? '{n} mi away'}
              onCardDragStart={(item, ev) => dnd.startDragCard(item, ev)}
              onCardTap={(item) => setSelectedSlug(item.slug)}
            />
          )}

          {isLocalListingsTab && (
            <LocalListingsColumn
              items={config.local_listings}
              onSelect={setPreviewSlug}
              emptyLabel={
                textos.itinerary_no_local_listings ?? 'No pre-built itineraries available.'
              }
              stopsCountTemplate={textos.itinerary_stops_count ?? '{n} stops'}
            />
          )}

          <FloatingHomeButton />

          <MapToolbar
            textos={{
              removeAll: textos.itinerary_remove_all ?? 'Remove All',
              showDriving: textos.itinerary_show_driving ?? 'Show Driving',
              hideMarkers: textos.itinerary_hide_markers ?? 'Hide Markers',
              share: textos.itinerary_share ?? 'Share Itinerary',
              smartRoute: textos.itinerary_smart_route ?? 'Smart Route',
            }}
            showDriving={showDriving}
            hideMarkers={hideMarkers}
            onToggleDriving={() => setShowDriving((s) => !s)}
            onToggleHideMarkers={() => setHideMarkers((s) => !s)}
            onRemoveAll={() => rail.clear()}
            onShare={() => setPhase('share')}
            onSmartRoute={() => {
              // Nearest-neighbor TSP greedy: empieza en el primer stop, luego
              // siempre el más cercano no visitado. Reordena el rail.
              if (rail.stops.length < 3) {
                setSmartRouteAlreadyOptimal(true);
                return;
              }
              const stopsWithCoords = rail.stops
                .map((s) => {
                  const it = catalogIndex.get(`${s.kind}:${s.slug}`);
                  return it ? { entry: s, coords: it.coords } : null;
                })
                .filter((x): x is { entry: ItineraryRailEntry; coords: { lat: number; lng: number } } => x !== null);
              if (stopsWithCoords.length < 3) return;
              const visited = new Set<number>();
              const order: number[] = [0];
              visited.add(0);
              while (order.length < stopsWithCoords.length) {
                const lastIdx = order[order.length - 1]!;
                const last = stopsWithCoords[lastIdx]!.coords;
                let bestIdx = -1;
                let bestDist = Infinity;
                for (let i = 0; i < stopsWithCoords.length; i++) {
                  if (visited.has(i)) continue;
                  const c = stopsWithCoords[i]!.coords;
                  const dLat = c.lat - last.lat;
                  const dLng = c.lng - last.lng;
                  const d2 = dLat * dLat + dLng * dLng;
                  if (d2 < bestDist) {
                    bestDist = d2;
                    bestIdx = i;
                  }
                }
                if (bestIdx < 0) break;
                visited.add(bestIdx);
                order.push(bestIdx);
              }
              // ¿El orden óptimo es igual al actual? Entonces ya estaba ruteado.
              const isAlreadyOptimal = order.every((idx, pos) => idx === pos);
              if (isAlreadyOptimal) {
                setSmartRouteAlreadyOptimal(true);
                return;
              }
              // Aplicar el reorder paso a paso (reorder del rail acepta from→to).
              const current = [...rail.stops];
              const target = order.map((i) => stopsWithCoords[i]!.entry);
              for (let to = 0; to < target.length; to++) {
                const from = current.findIndex(
                  (s) => s.slug === target[to]!.slug && s.kind === target[to]!.kind,
                );
                if (from >= 0 && from !== to) {
                  rail.reorder(from, to);
                  const [moved] = current.splice(from, 1);
                  current.splice(to, 0, moved!);
                }
              }
            }}
            hasStops={rail.count > 0}
          />

          <StopsRail
            stops={rail.stops}
            resolveItem={resolveItem}
            onRemove={(entry) => rail.remove(entry.slug, entry.kind)}
            visibleSlots={Math.max(3, rail.stops.length + 1)}
            startLabel={textos.itinerary_slot_start_label ?? 'Start'}
            stopWord={textos.itinerary_slot_stop_word ?? 'Stop'}
            helperText={
              textos.itinerary_caption_drag_more ??
              'To add more items to your day,\njust drag more listings\ninto this day'
            }
            removeAriaLabelTemplate={
              textos.itinerary_slot_remove_aria ?? 'Remove stop {n}'
            }
            distanceTemplate={textos.itinerary_distance_away ?? '{n} mi away'}
            computeDistance={computeDistance}
            onSlotDragStart={(entry, item, fromIndex, ev) =>
              dnd.startDragStop(
                {
                  slug: entry.slug,
                  kind: entry.kind,
                  fromIndex,
                  thumbnail: item.image,
                  title: item.title,
                },
                ev,
              )
            }
          />
          <DragGhost payload={dnd.dragPayload} cursor={dnd.cursorPos} />

          {selectedSlug && pinPos
            ? (() => {
                const item = catalogIndex.get(`listing:${selectedSlug}`)
                  ?? catalogIndex.get(`event:${selectedSlug}`)
                  ?? catalogIndex.get(`trail:${selectedSlug}`);
                if (!item) return null;
                const source: MapSource =
                  item.kind === 'event'
                    ? 'events'
                    : item.kind === 'trail'
                      ? 'things-to-do'
                      : item.moduleSlug === 'restaurants'
                        ? 'restaurants'
                        : item.moduleSlug === 'stay'
                          ? 'stay'
                          : 'things-to-do';
                const mapItem: MapItem = {
                  source,
                  moduleSlug: item.moduleSlug,
                  slug: item.slug,
                  title: item.title,
                  subcategory: item.subcategory,
                  image: item.image,
                  coords: item.coords,
                  address: item.address,
                  features: item.features,
                  popularity: item.popularity,
                  hours: item.hours,
                  priceRange: item.priceRange,
                  priceMode: item.priceMode,
                };
                const mapTop = isEventsTab ? 540 : 340;
                // MapPinBubble se renderiza en el root del canvas (no dentro
                // de un wrapper full-area) para que NO bloquee los clicks en
                // las cards del sidebar mientras está abierto.
                return (
                  <MapPinBubble
                    item={mapItem}
                    left={pinPos.left}
                    top={pinPos.top + mapTop}
                    clientCoords={client.coords}
                    labels={{
                      seeMoreInfo: textos.map_see_more_info ?? 'SEE MORE INFO',
                      addToItinerary: textos.map_add_to_itinerary ?? 'ADD TO ITINERARY',
                      addedToItinerary: textos.map_added_to_itinerary ?? 'ADDED TO ITINERARY',
                      miAwaySuffix: textos.map_mi_away_suffix ?? 'mi away',
                      minWalkingSuffix: textos.map_min_walking_suffix ?? 'min',
                    }}
                    onSeeMore={() => {
                      setDetailKey(`${item.kind}:${item.slug}`);
                      setSelectedSlug(null);
                    }}
                    onClose={() => setSelectedSlug(null)}
                  />
                );
              })()
            : null}

          {previewItinerary && (
            <LocalListingPreview
              itinerary={previewItinerary}
              resolveItem={(slug, kind) => catalogIndex.get(`${kind}:${slug}`) ?? null}
              useCtaLabel={textos.itinerary_local_use_cta ?? 'Use this itinerary'}
              stopsCountTemplate={textos.itinerary_stops_count ?? '{n} stops'}
              closeAriaLabel="Close itinerary preview"
              onUse={() => {
                rail.clear();
                previewItinerary.stops.forEach((s) => rail.add(s.slug, s.kind));
                setPreviewSlug(null);
              }}
              onClose={() => setPreviewSlug(null)}
            />
          )}
        </>
      )}

      {phase === 'ai-popup' && (
        <AiPopup
          textos={{
            title: textos.itinerary_ai_popup_title ?? 'AI ITINERARY BUILDER',
            subtitle: textos.itinerary_ai_popup_subtitle ?? '',
            aiCardTitle: textos.itinerary_ai_card_ai_title ?? 'AI ITINERARY',
            aiCardBody: textos.itinerary_ai_card_ai_body ?? '',
            aiCardCta: textos.itinerary_ai_card_ai_cta ?? 'Start',
            topCardTitle: textos.itinerary_ai_card_top_title ?? 'TOP SUGGESTIONS',
            topCardBody: textos.itinerary_ai_card_top_body ?? '',
            topCardCta: textos.itinerary_ai_card_top_cta ?? "Let's Go",
          }}
          onStart={() => {
            setAiPath('ai');
            setPhase('ai-wizard');
          }}
          onTopSuggestions={() => {
            setAiPath('top-suggestions');
            setPhase('ai-wizard');
          }}
          onClose={() => setPhase('manual')}
        />
      )}

      {phase === 'ai-wizard' && (
        <AiWizard
          questions={config.ai.questions}
          textos={{
            back: textos.itinerary_ai_back ?? 'Back',
            next: textos.itinerary_ai_next ?? 'Next question',
            finish: textos.itinerary_ai_finish ?? 'Finish',
          }}
          templateVars={interp}
          weather={props.weather}
          locale={client.locale ?? 'en-US'}
          timezone={client.timezone}
          onFinish={(answers) => {
            setAiAnswers(answers);
            setPhase('ai-loading');
          }}
          onRequestLeave={() => setLeaveWarning('wizard')}
        />
      )}

      {phase === 'ai-loading' && (
        <AiLoadingScreen
          title={textos.itinerary_ai_loading_title ?? 'AI Itinerary Builder'}
          body={
            textos.itinerary_ai_loading_body ??
            "We're building your perfect itinerary! This might take a few seconds…"
          }
          backgroundImage={config.ai.loading_image}
        />
      )}

      {phase === 'ai-result' && aiResult && aiPath === 'ai' && (
        <AiResultScreen
          itinerary={aiResult}
          resolveItem={(slug, kind) => catalogIndex.get(`${kind}:${slug}`) ?? null}
          textos={{
            resultTitle: textos.itinerary_ai_result_title ?? 'Itinerary',
            tabEvents: textos.itinerary_ai_result_tab_events ?? 'EVENTS',
            tabDayTemplate: textos.itinerary_ai_result_tab_day ?? 'DAY {n}',
            startOver: textos.itinerary_ai_start_over ?? 'Start Over',
            finish: textos.itinerary_ai_finish_cta ?? 'Finish',
            sliderStart: textos.itinerary_ai_result_slider_start ?? 'Start',
            sliderStop: textos.itinerary_ai_result_slider_stop ?? 'Stop',
          }}
          kindLabels={{
            breakfast: textos.itinerary_kind_breakfast ?? 'Breakfast',
            lunch: textos.itinerary_kind_lunch ?? 'Lunch',
            dinner: textos.itinerary_kind_dinner ?? 'Dinner',
            activity: textos.itinerary_kind_activity ?? 'Activity',
            event: textos.itinerary_kind_event ?? 'Event',
          }}
          weather={props.weather}
          locale={client.locale ?? 'en-US'}
          timezone={client.timezone}
          clientCoords={client.coords}
          distanceTemplate={textos.itinerary_distance_away ?? '{n} mi away'}
          onStartOver={() => setLeaveWarning('result')}
          onFinish={() => {
            const count = aiResult.days.reduce((acc, d) => acc + d.entries.length, 0);
            aiResult.days.forEach((d) =>
              d.entries.forEach((e) => rail.add(e.slug, e.itemKind)),
            );
            setShowFinishedPopup({ count });
          }}
        />
      )}

      {phase === 'ai-result' && aiPath === 'top-suggestions' && (() => {
        // Auto-like: cuando se entra a Top Suggestions, todos los items
        // sugeridos se añaden al rail automáticamente. El usuario puede
        // quitar el like de los que no le gusten.
        // (Se ejecuta inline en la IIFE — el useEffect de abajo lo dispara
        // una sola vez por entrada al screen via `aiPath` dep.)
        // Top Suggestions: top items por popularity de cada bucket
        const sortByPopularity = (a: ItineraryCatalogItem, b: ItineraryCatalogItem) =>
          (b.popularity ?? 0) - (a.popularity ?? 0);
        const things = allCatalog
          .filter((it) => it.kind === 'listing' && it.moduleSlug !== 'restaurants' && it.moduleSlug !== 'stay')
          .concat(allCatalog.filter((it) => it.kind === 'trail'))
          .sort(sortByPopularity)
          .slice(0, 8);
        const evts = allCatalog
          .filter((it) => it.kind === 'event')
          .sort(sortByPopularity)
          .slice(0, 8);
        const rests = allCatalog
          .filter((it) => it.kind === 'listing' && it.moduleSlug === 'restaurants')
          .sort(sortByPopularity)
          .slice(0, 8);
        return (
          <TopSuggestionsScreen
            thingsToDo={things}
            events={evts}
            restaurants={rests}
            textos={{
              title: textos.itinerary_top_title ?? 'Top Suggestions',
              subtitle:
                textos.itinerary_top_subtitle ??
                'Top curated ideas.\nJust choose, save, or start over!',
              scanLabel:
                textos.itinerary_top_scan_label ?? 'Scan QR and send\nit to your phone',
              tabThingsToDo: textos.itinerary_top_tab_things ?? 'Things to do',
              tabEvents: textos.itinerary_top_tab_events ?? 'Events',
              tabRestaurants: textos.itinerary_top_tab_restaurants ?? 'Restaurants',
              moreInfo: textos.itinerary_top_more_info ?? 'More info',
              directions: textos.itinerary_top_directions ?? 'Directions',
              startOver: textos.itinerary_ai_start_over ?? 'Start Over',
              finish: textos.itinerary_ai_finish_cta ?? 'Finish',
              distanceTemplate: textos.itinerary_distance_away ?? '{n} mi away',
              openUntilPrefix: textos.map_open_until_prefix ?? 'Open until',
            }}
            weather={props.weather}
            locale={client.locale ?? 'en-US'}
            timezone={client.timezone}
            clientCoords={client.coords}
            qrUrl={`https://share.${client.slug}.kiosk.example/itinerary/preview`}
            onMoreInfo={(item) => setDetailKey(`${item.kind}:${item.slug}`)}
            onToggleFavorite={(item) =>
              rail.has(item.slug, item.kind)
                ? rail.remove(item.slug, item.kind)
                : rail.add(item.slug, item.kind)
            }
            isInRail={(item) => rail.has(item.slug, item.kind)}
            onStartOver={() => setLeaveWarning('result')}
            onFinish={() => setPhase('manual')}
          />
        );
      })()}

      {smartRouteAlreadyOptimal && (
        <div
          className="absolute inset-0 z-[55] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setSmartRouteAlreadyOptimal(false)}
            className="absolute inset-0 cursor-default"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          />
          <div className="relative flex w-[820px] flex-col items-center rounded-[24px] bg-white px-12 py-10 shadow-2xl">
            <div
              className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full"
              style={{ backgroundColor: 'hsl(var(--itinerary-olive))' }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 12l5 5 9-9"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-center text-[32px] font-bold leading-tight text-foreground">
              {textos.itinerary_smart_route_optimal_title ?? 'You already have the best route!'}
            </h3>
            <p
              className="mt-3 text-center text-[18px] leading-relaxed text-zinc-600"
              style={{ whiteSpace: 'pre-line' }}
            >
              {textos.itinerary_smart_route_optimal_body ??
                'Your stops are already arranged\nin the most efficient order.'}
            </p>
            <button
              type="button"
              onClick={() => setSmartRouteAlreadyOptimal(false)}
              className="mt-7 flex h-[60px] items-center justify-center rounded-xl px-12 text-[18px] font-bold text-white shadow-md transition hover:opacity-95"
              style={{ backgroundColor: 'hsl(var(--primary))' }}
            >
              {textos.itinerary_smart_route_optimal_cta ?? 'Got it'}
            </button>
          </div>
        </div>
      )}

      {leaveWarning && (
        <LeaveAiWarningPopup
          title={textos.itinerary_ai_leave_warning_title ?? 'Are you sure\nyou want to leave?'}
          body={
            textos.itinerary_ai_leave_warning_body ??
            "You'll lose the AI itinerary you've generated."
          }
          cancelLabel={textos.itinerary_ai_leave_warning_cancel ?? 'Cancel'}
          confirmLabel={textos.itinerary_ai_leave_warning_confirm ?? 'Leave'}
          onCancel={() => setLeaveWarning(null)}
          onConfirm={() => {
            const ctx = leaveWarning;
            setLeaveWarning(null);
            setAiResult(null);
            setAiAnswers(null);
            // Wizard → main dashboard (manual). Result Start Over → ai-popup.
            setPhase(ctx === 'wizard' ? 'manual' : 'ai-popup');
          }}
        />
      )}

      {phase === 'share' && shareSubModal === 'none' && !sentDest && (
        <ShareItineraryModal
          textos={{
            title: textos.itinerary_share_modal_title ?? 'You made it!',
            body: textos.itinerary_share_modal_body ?? '',
            scanLabel: textos.itinerary_share_scan_label ?? 'SCAN ME',
            poweredBy: textos.itinerary_share_powered_by ?? 'Powered by',
            sendPhone: textos.itinerary_share_send_phone ?? 'SEND TO PHONE',
            sendEmail: textos.itinerary_share_send_email ?? 'SEND TO EMAIL',
          }}
          qrUrl={`https://share.${client.slug}.kiosk.example/itinerary/preview`}
          onSendPhone={() => setShareSubModal('phone')}
          onSendEmail={() => setShareSubModal('email')}
          onClose={() => setPhase('manual')}
        />
      )}

      <SendToEmailModal
        open={shareSubModal === 'email'}
        listingTitle={textos.itinerary_title ?? 'Itinerary'}
        onCancel={() => setShareSubModal('none')}
        onSent={(email) => {
          setShareSubModal('none');
          setSentDest({ kind: 'email', value: email });
        }}
      />
      <SendToPhoneModal
        open={shareSubModal === 'phone'}
        listingTitle={textos.itinerary_title ?? 'Itinerary'}
        onCancel={() => setShareSubModal('none')}
        onSent={(phone) => {
          setShareSubModal('none');
          setSentDest({ kind: 'phone', value: phone });
        }}
        onSwitchToKeyboard={() => setShareSubModal('email')}
      />
      {sentDest && (
        <SendConfirmationPopup
          open
          kind={sentDest.kind}
          destination={sentDest.value}
          onClose={() => {
            setSentDest(null);
            setPhase('manual');
          }}
        />
      )}

      {showFinishedPopup && (
        <ItineraryFinishedPopup
          title={textos.itinerary_finished_title ?? 'Itinerary saved!'}
          body={(
            textos.itinerary_finished_body ??
            "We've added the {count} stops to your day."
          ).replace('{count}', String(showFinishedPopup.count))}
          onClose={() => {
            setShowFinishedPopup(null);
            setPhase('manual');
            setAiResult(null);
            setAiAnswers(null);
          }}
        />
      )}

      {detailKey && detailLookup[detailKey]
        ? (() => {
            const entry = detailLookup[detailKey];
            // Wrapper z-60 para que el detail screen (interno z-20) y su
            // backdrop queden ENCIMA de toda la pantalla del Itinerary
            // (FloatingHomeButton z-30, MapToolbar/StopsRail z-25,
            //  AiFloatingCard z-30, search keyboard z-40, etc).
            return (
              <div className="absolute inset-0" style={{ zIndex: 60 }}>
                <ListingDetail
                  moduleKey={entry.moduleKey}
                  listing={entry.listing}
                  mapboxToken={mapboxToken}
                  clientCoords={client.coords}
                  eventMeta={entry.eventMeta}
                  secondaryCta={entry.secondaryCta}
                  favoritesKind={entry.favoritesKind}
                  onClose={() => setDetailKey(null)}
                />
              </div>
            );
          })()
        : null}

      {showKeyboard && (
        <div className="absolute inset-0 z-40">
          <button
            type="button"
            aria-label="Cerrar teclado"
            onClick={() => setShowKeyboard(false)}
            className="absolute inset-0 h-full w-full cursor-default focus:outline-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          />
          <DraggableKeyboard storageKey="kiosk_keyboard_pos:itinerary">
            <OnScreenKeyboard onKey={handleKeyboardKey} />
          </DraggableKeyboard>
        </div>
      )}

      {phase === 'welcome' && (
        <WelcomePopup
          textos={{
            intro: textos.itinerary_welcome_intro ?? 'DISCOVER YOUR PERFECT VISIT',
            title: fmt(
              textos.itinerary_welcome_title ?? "WELCOME TO {client_name}'S\nOFFICIAL TRIP BUILDER.",
              interp,
            ),
            body:
              textos.itinerary_welcome_body ??
              'Discover the city your way\ncurated for you or explored at your own pace.',
            createCta: textos.itinerary_welcome_create_cta ?? 'Create Itinerary',
            aiCta: textos.itinerary_welcome_ai_cta ?? 'AI Itinerary',
          }}
          onCreate={() => setPhase('manual')}
          onAi={() => setPhase('ai-popup')}
          onClose={() => setPhase('manual')}
        />
      )}
    </div>
  );
}
