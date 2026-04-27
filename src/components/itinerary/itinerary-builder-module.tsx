'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ItineraryConfig, KioskConfig } from '@/lib/config';
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
import { SendConfirmationPopup } from '@/components/listings/send-confirmation-popup';
import { SendToEmailModal } from '@/components/listings/send-to-email-modal';
import { SendToPhoneModal } from '@/components/listings/send-to-phone-modal';

import { AiItineraryFloatingCard } from './ai-floating-card';
import { AiLoadingScreen } from './ai-loading-screen';
import { AiPopup } from './ai-popup';
import { AiResultScreen } from './ai-result-screen';
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
import { ItineraryMap, type ItineraryMapStop } from './itinerary-map';
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
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [showFinishedPopup, setShowFinishedPopup] = useState<{ count: number } | null>(null);
  const [shareSubModal, setShareSubModal] = useState<'none' | 'email' | 'phone'>('none');
  const [sentDest, setSentDest] = useState<{ kind: 'email' | 'phone'; value: string } | null>(null);

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
      const targetIso = isoDate(weekStart, selectedDayIndex);
      out = out.filter((it) => it.date === targetIso);
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

  const mapStops = useMemo<ItineraryMapStop[]>(() => {
    const out: ItineraryMapStop[] = [];
    rail.stops.forEach((entry, i) => {
      const item = resolveItem(entry);
      if (!item) return;
      out.push({ slug: entry.slug, kind: entry.kind, coords: item.coords, index: i + 1 });
    });
    return out;
  }, [rail.stops, resolveItem]);

  const center = client.coords ?? { lat: 33.4484, lng: -112.074 };

  const interp = { client_name: client.nombre };

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
            stops={mapStops}
            showRoute={showDriving}
            hideCatalogMarkers={hideMarkers}
            unavailableLabel={textos.itinerary_map_unavailable}
            className="absolute"
            style={{
              left: 0,
              top: isEventsTab ? 450 : 320,
              right: 0,
              bottom: 366,
              zIndex: 5,
            }}
          />

          <AiItineraryFloatingCard
            label={textos.itinerary_ai_popup_title ?? 'AI ITINERARY'}
            onTap={() => setPhase('ai-popup')}
          />

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
              emptyLabel={textos.itinerary_no_search_results ?? 'No items match your search.'}
              distanceTemplate={textos.itinerary_distance_away ?? '{n} mi away'}
              onCardDragStart={(item, ev) => dnd.startDragCard(item, ev)}
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

          <MapToolbar
            textos={{
              removeAll: textos.itinerary_remove_all ?? 'Remove All',
              showDriving: textos.itinerary_show_driving ?? 'Show Driving',
              hideMarkers: textos.itinerary_hide_markers ?? 'Hide Markers',
              share: textos.itinerary_share ?? 'Share Itinerary',
            }}
            showDriving={showDriving}
            hideMarkers={hideMarkers}
            onToggleDriving={() => setShowDriving((s) => !s)}
            onToggleHideMarkers={() => setHideMarkers((s) => !s)}
            onRemoveAll={() => rail.clear()}
            onShare={() => setPhase('share')}
            hasStops={rail.count > 0}
          />

          <StopsRail
            stops={rail.stops}
            resolveItem={resolveItem}
            onRemove={(entry) => rail.remove(entry.slug, entry.kind)}
            visibleSlots={Math.max(3, rail.stops.length + 1)}
            caption={textos.itinerary_caption_drag_more ?? 'Drag more listings to add stops.'}
            stopLabelTemplate={textos.itinerary_stop_label ?? 'Stop {n}'}
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
          onStart={() => setPhase('ai-wizard')}
          onTopSuggestions={() => setPhase('ai-wizard')}
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
          logoSrc={props.logoSrc}
          templateVars={interp}
          onFinish={(answers) => {
            setAiAnswers(answers);
            setPhase('ai-loading');
          }}
          onCancel={() => setPhase('manual')}
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
          logoSrc={props.logoSrc}
        />
      )}

      {phase === 'ai-result' && aiResult && (
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
          logoSrc={props.logoSrc}
          onStartOver={() => setShowLeaveWarning(true)}
          onFinish={() => {
            const count = aiResult.days.reduce((acc, d) => acc + d.entries.length, 0);
            aiResult.days.forEach((d) =>
              d.entries.forEach((e) => rail.add(e.slug, e.itemKind)),
            );
            setShowFinishedPopup({ count });
          }}
        />
      )}

      {showLeaveWarning && (
        <LeaveAiWarningPopup
          title={textos.itinerary_ai_leave_warning_title ?? 'Are you sure\nyou want to leave?'}
          body={
            textos.itinerary_ai_leave_warning_body ??
            "You'll lose the AI itinerary you've generated."
          }
          cancelLabel={textos.itinerary_ai_leave_warning_cancel ?? 'Cancel'}
          confirmLabel={textos.itinerary_ai_leave_warning_confirm ?? 'Leave'}
          onCancel={() => setShowLeaveWarning(false)}
          onConfirm={() => {
            setShowLeaveWarning(false);
            setAiResult(null);
            setAiAnswers(null);
            setPhase('ai-popup');
          }}
        />
      )}

      {phase === 'share' && (
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
          poweredByLogo={props.logoSrc}
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
