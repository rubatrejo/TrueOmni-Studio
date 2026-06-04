'use client';

import { useMemo, useState } from 'react';

import { generateItinerary, type AiPreferences, type GeneratedItinerary } from '@/lib/ai-itinerary';
import type { ItineraryAiConfig, PwaTripPlannerModuleConfig } from '@/lib/config';
import { distanceMi, type ItineraryCatalogItem } from '@/lib/itinerary-catalog';
import { useItineraryRail } from '@/lib/itinerary-favorites';

import { PwaBottomNav } from '../bottom-nav';

import { openUntilLabel } from './open-until';
import { TpAiLoading } from './tp-ai-loading';
import { TpAiPopup } from './tp-ai-popup';
import { TpAiResult } from './tp-ai-result';
import { TpAiWizard } from './tp-ai-wizard';
import { TpBottomToggle } from './tp-bottom-toggle';
import { TpListView } from './tp-list-view';
import { TpMapView } from './tp-map-view';
import { TpMyPlan } from './tp-my-plan';
import { TpShareModal } from './tp-share-modal';
import { TpTopSuggestionsResult } from './tp-top-suggestions-result';
import { TpWelcomePopup } from './tp-welcome-popup';
import type { TpCard, TpCategory, TpLocalListing } from './types';

type Mode = 'list' | 'myplan' | 'map';
type AiView = null | 'wizard' | 'loading' | 'result';

interface TripPlannerScreenProps {
  tp: PwaTripPlannerModuleConfig;
  categories: TpCategory[];
  localListings: TpLocalListing[];
  catalog: ItineraryCatalogItem[];
  stayCards: TpCard[];
  textos: Record<string, string>;
  clientName: string;
  clientCoords: { lat: number; lng: number };
  mapboxToken: string;
  ai: ItineraryAiConfig;
}

export function TripPlannerScreen({
  tp,
  categories,
  localListings,
  catalog,
  stayCards,
  textos,
  clientName,
  clientCoords,
  mapboxToken,
  ai,
}: TripPlannerScreenProps) {
  const [mode, setMode] = useState<Mode>('list');
  const [shareOpen, setShareOpen] = useState(false);
  const [aiPopup, setAiPopup] = useState(false);
  const [aiPath, setAiPath] = useState<'ai' | 'top'>('ai');
  const [aiView, setAiView] = useState<AiView>(null);
  const [aiResult, setAiResult] = useState<GeneratedItinerary | null>(null);
  const rail = useItineraryRail();

  // Resolver `${kind}:${slug}` → TpCard desde el catálogo completo.
  const cardByKey = useMemo(() => {
    const m = new Map<string, TpCard>();
    const push = (it: ItineraryCatalogItem) =>
      m.set(`${it.kind}:${it.slug}`, {
        slug: it.slug,
        kind: it.kind,
        moduleSlug: it.moduleSlug,
        title: it.title,
        subcategory: it.subcategory,
        image: it.image,
        coords: it.coords,
        address: it.address,
        distanceMi: distanceMi(clientCoords, it.coords),
        openUntil: openUntilLabel(tp.openUntilPrefix, it.hours, it.endTime),
        date: it.date,
      });
    catalog.forEach(push);
    return m;
  }, [catalog, clientCoords, tp.openUntilPrefix]);

  const planStops = useMemo(
    () =>
      rail.stops
        .map((s) => cardByKey.get(`${s.kind}:${s.slug}`))
        .filter((x): x is TpCard => Boolean(x)),
    [rail.stops, cardByKey],
  );

  const resolveCard = (kind: string, slug: string) => cardByKey.get(`${kind}:${slug}`);

  const startAi = (path: 'ai' | 'top') => {
    setAiPath(path);
    setAiPopup(false);
    setAiResult(null);
    setAiView('wizard');
  };

  const onWizardFinish = (answers: AiPreferences) => {
    setAiView('loading');
    if (aiPath === 'ai') {
      void generateItinerary({
        preferences: answers,
        questions: ai.questions,
        catalog,
        titleTemplate: ai.default_title_template,
        clientName,
        dayLabelTemplate: textos.itinerary_ai_day_label_template,
        planLabel: textos.itinerary_ai_plan_label,
        durationFallback: textos.itinerary_ai_duration_fallback,
      }).then((r) => {
        setAiResult(r);
        setAiView('result');
      });
    } else {
      // Top Suggestions: no genera; muestra cards curadas tras un breve delay.
      window.setTimeout(() => setAiView('result'), 1600);
    }
  };

  const exitAi = () => {
    setAiView(null);
    setAiResult(null);
  };

  // Finish del flujo AI → al planning (My Plan) con todos los listings que el
  // usuario agregó al rail durante el resultado.
  const onAiFinish = () => {
    exitAi();
    setMode('myplan');
  };

  const inAi = aiView !== null;

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Contenido por modo */}
      {!inAi && mode === 'list' && (
        <TpListView
          tp={tp}
          categories={categories}
          localListings={localListings}
          textos={textos}
          rail={rail}
          onOpenMyPlan={() => setMode('myplan')}
        />
      )}
      {!inAi && mode === 'myplan' && (
        <TpMyPlan
          tp={tp}
          textos={textos}
          stops={planStops}
          rail={rail}
          onBack={() => setMode('list')}
          onStartPlan={() => setMode('map')}
        />
      )}
      {!inAi && mode === 'map' && (
        <TpMapView
          tp={tp}
          textos={textos}
          stops={planStops}
          rail={rail}
          clientCoords={clientCoords}
          mapboxToken={mapboxToken}
          onBack={() => setMode('myplan')}
          onShare={() => setShareOpen(true)}
        />
      )}

      {/* Flujo AI */}
      {aiView === 'wizard' && (
        <TpAiWizard
          questions={ai.questions}
          path={aiPath}
          tp={tp}
          textos={textos}
          clientName={clientName}
          onFinish={onWizardFinish}
          onBack={exitAi}
        />
      )}
      {aiView === 'loading' && <TpAiLoading ai={ai} tp={tp} textos={textos} path={aiPath} />}
      {aiView === 'result' &&
        (aiPath === 'ai' && aiResult ? (
          <TpAiResult
            result={aiResult}
            tp={tp}
            textos={textos}
            stayCards={stayCards}
            resolveCard={resolveCard}
            rail={rail}
            onStartOver={() => setAiView('wizard')}
            onFinish={onAiFinish}
            onShare={() => setShareOpen(true)}
          />
        ) : aiPath === 'top' ? (
          <TpTopSuggestionsResult
            tp={tp}
            categories={categories}
            textos={textos}
            rail={rail}
            onStartOver={() => setAiView('wizard')}
            onFinish={onAiFinish}
          />
        ) : null)}

      {/* Barras inferiores fijas (el toggle se oculta durante el loading, como el diseño) */}
      {aiView !== 'loading' && (
        <TpBottomToggle
          tp={tp}
          active={!inAi && mode === 'map' ? 'map' : 'list'}
          onList={() => {
            exitAi();
            setMode('list');
          }}
          onAi={() => setAiPopup(true)}
          onMap={() => {
            exitAi();
            setMode('map');
          }}
        />
      )}
      <PwaBottomNav />

      {/* Welcome (show-once) */}
      {!inAi && <TpWelcomePopup tp={tp} mapboxToken={mapboxToken} clientCoords={clientCoords} />}

      {/* AI popup */}
      {aiPopup && (
        <TpAiPopup
          textos={textos}
          clientName={clientName}
          onChoose={startAi}
          onClose={() => setAiPopup(false)}
        />
      )}

      {/* Share modal */}
      {shareOpen && (
        <TpShareModal textos={textos} clientName={clientName} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}
