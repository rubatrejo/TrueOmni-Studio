'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  AdsModule,
  AiAvatarConfig,
  BillboardConfig,
  Branding,
  BrochuresModuleConfig,
  ConfigMeta,
  DealsModuleConfig,
  EventsModule,
  GuestbookConfig,
  I18nBundle,
  IntegrationsConfig,
  KioskConfig,
  ListingsModule,
  ModulesConfig,
  PassesModule,
  PhotoBoothConfig,
  SocialWallConfig,
  SurveyConfig,
  TicketsModule,
  TrailsModule,
} from '@/lib/studio/schema';
import {
  DEFAULT_AI_AVATAR,
  DEFAULT_BILLBOARD,
  DEFAULT_BROCHURES,
  DEFAULT_DEALS,
  DEFAULT_GUESTBOOK,
  DEFAULT_PHOTO_BOOTH,
  DEFAULT_SOCIAL_WALL,
  DEFAULT_SURVEY,
  DEFAULT_SYSTEM_MODULES,
  defaultAds,
  defaultEvents,
  defaultI18nBundle,
  defaultIntegrations,
  defaultListings,
  defaultModules,
  defaultPasses,
  defaultTickets,
  defaultTrails,
} from '@/lib/studio/schema';

import { getI18n, patchConfig, patchI18n } from '../_lib/api-client';
import { STUDIO_SECTIONS, type StudioSectionKey } from '../_lib/sections';
import { usePreviewBridge } from '../_lib/use-preview-bridge';

import { EditorPanel } from './EditorPanel';
import { PreviewPanel } from './PreviewPanel';
import { SaveBar } from './SaveBar';
import { SidebarTabs } from './SidebarTabs';
import { TopBar } from './TopBar';

export function Shell({
  initialConfig,
  initialMeta,
}: {
  initialConfig: KioskConfig;
  initialMeta: ConfigMeta | null;
}) {
  const [activeTab, setActiveTab] = useState<StudioSectionKey>('branding');
  const [previewKey, setPreviewKey] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [savedBranding, setSavedBranding] = useState<Branding>(initialConfig.branding);
  const [branding, setBranding] = useState<Branding>(savedBranding);

  const initialModules = initialConfig.modules ?? defaultModules();
  const [savedModules, setSavedModules] = useState<ModulesConfig>(initialModules);
  const [modules, setModules] = useState<ModulesConfig>(initialModules);

  const initialBillboard = initialConfig.billboard ?? DEFAULT_BILLBOARD;
  const [savedBillboard, setSavedBillboard] = useState<BillboardConfig>(initialBillboard);
  const [billboard, setBillboard] = useState<BillboardConfig>(initialBillboard);

  const initialAi = initialConfig.aiAvatar ?? DEFAULT_AI_AVATAR;
  const [savedAi, setSavedAi] = useState<AiAvatarConfig>(initialAi);
  const [aiAvatar, setAiAvatar] = useState<AiAvatarConfig>(initialAi);

  const initialSurvey = initialConfig.survey ?? structuredClone(DEFAULT_SURVEY);
  const [savedSurvey, setSavedSurvey] = useState<SurveyConfig>(initialSurvey);
  const [survey, setSurvey] = useState<SurveyConfig>(initialSurvey);

  const initialDeals = initialConfig.deals ?? structuredClone(DEFAULT_DEALS);
  const [savedDeals, setSavedDeals] = useState<DealsModuleConfig>(initialDeals);
  const [deals, setDeals] = useState<DealsModuleConfig>(initialDeals);

  const initialPhotoBooth = initialConfig.photoBooth ?? structuredClone(DEFAULT_PHOTO_BOOTH);
  const [savedPhotoBooth, setSavedPhotoBooth] =
    useState<PhotoBoothConfig>(initialPhotoBooth);
  const [photoBooth, setPhotoBooth] = useState<PhotoBoothConfig>(initialPhotoBooth);

  const initialBrochures = initialConfig.brochures ?? structuredClone(DEFAULT_BROCHURES);
  const [savedBrochures, setSavedBrochures] =
    useState<BrochuresModuleConfig>(initialBrochures);
  const [brochures, setBrochures] = useState<BrochuresModuleConfig>(initialBrochures);

  const initialSocialWall = initialConfig.socialWall ?? structuredClone(DEFAULT_SOCIAL_WALL);
  const [savedSocialWall, setSavedSocialWall] =
    useState<SocialWallConfig>(initialSocialWall);
  const [socialWall, setSocialWall] = useState<SocialWallConfig>(initialSocialWall);

  const initialGuestbook = initialConfig.guestbook ?? structuredClone(DEFAULT_GUESTBOOK);
  const [savedGuestbook, setSavedGuestbook] =
    useState<GuestbookConfig>(initialGuestbook);
  const [guestbook, setGuestbook] = useState<GuestbookConfig>(initialGuestbook);

  const initialListings = initialConfig.listings ?? defaultListings();
  const [savedListings, setSavedListings] = useState<ListingsModule>(initialListings);
  const [listings, setListings] = useState<ListingsModule>(initialListings);

  const initialEvents = initialConfig.events ?? defaultEvents();
  const [savedEvents, setSavedEvents] = useState<EventsModule>(initialEvents);
  const [events, setEvents] = useState<EventsModule>(initialEvents);

  const initialTickets = initialConfig.tickets ?? defaultTickets();
  const [savedTickets, setSavedTickets] = useState<TicketsModule>(initialTickets);
  const [tickets, setTickets] = useState<TicketsModule>(initialTickets);

  const initialPasses = initialConfig.passes ?? defaultPasses();
  const [savedPasses, setSavedPasses] = useState<PassesModule>(initialPasses);
  const [passes, setPasses] = useState<PassesModule>(initialPasses);

  const initialTrails = initialConfig.trails ?? defaultTrails();
  const [savedTrails, setSavedTrails] = useState<TrailsModule>(initialTrails);
  const [trails, setTrails] = useState<TrailsModule>(initialTrails);

  const initialAds = initialConfig.ads ?? defaultAds();
  const [savedAds, setSavedAds] = useState<AdsModule>(initialAds);
  const [ads, setAds] = useState<AdsModule>(initialAds);

  const initialIntegrations = initialConfig.integrations ?? defaultIntegrations();
  const [savedIntegrations, setSavedIntegrations] =
    useState<IntegrationsConfig>(initialIntegrations);
  const [integrations, setIntegrations] = useState<IntegrationsConfig>(initialIntegrations);

  const [savedI18nBundle, setSavedI18nBundle] = useState<I18nBundle>(defaultI18nBundle());
  const [i18nBundle, setI18nBundle] = useState<I18nBundle>(savedI18nBundle);
  const [i18nLoaded, setI18nLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getI18n(initialConfig.slug)
      .then((bundle) => {
        if (cancelled) return;
        setSavedI18nBundle(bundle);
        setI18nBundle(bundle);
        setI18nLoaded(true);
      })
      .catch((err) => {
        console.error('[Studio i18n load]', err);
        setI18nLoaded(true); // siguen los defaults; permite editar
      });
    return () => {
      cancelled = true;
    };
  }, [initialConfig.slug]);

  const {
    iframeRef,
    pushBranding,
    pushModules,
    pushBillboard,
    pushAiAvatar,
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
    pushTickets,
    pushPasses,
    pushTrails,
    onIframeLoad,
  } = usePreviewBridge();

  useEffect(() => {
    pushBranding({
      primary: branding.primary,
      secondary: branding.secondary,
      tertiary: branding.tertiary,
      logo: branding.logo,
      idleLogo: branding.idleLogo,
      footerLogo: branding.footerLogo,
      favicon: branding.favicon,
      fonts: branding.fonts,
    });
  }, [branding, pushBranding]);

  useEffect(() => {
    pushModules(modules);
  }, [modules, pushModules]);

  useEffect(() => {
    pushBillboard(billboard);
  }, [billboard, pushBillboard]);

  // Si la tab activa pertenece a un módulo que se acaba de apagar en Modules,
  // saltamos automáticamente a la tab Modules para evitar quedarse en una
  // sección que ahora está locked.
  useEffect(() => {
    const sys = modules.systemModules ?? DEFAULT_SYSTEM_MODULES;
    const section = STUDIO_SECTIONS.find((s) => s.key === activeTab);
    if (section?.systemModuleKey && !sys[section.systemModuleKey]) {
      setActiveTab('modules');
    }
  }, [modules.systemModules, activeTab]);

  useEffect(() => {
    pushAiAvatar(aiAvatar);
  }, [aiAvatar, pushAiAvatar]);

  useEffect(() => {
    pushSurvey(survey);
  }, [survey, pushSurvey]);

  useEffect(() => {
    pushDeals(deals);
  }, [deals, pushDeals]);

  useEffect(() => {
    pushPhotoBooth(photoBooth);
  }, [photoBooth, pushPhotoBooth]);

  useEffect(() => {
    pushBrochures(brochures);
  }, [brochures, pushBrochures]);

  useEffect(() => {
    pushSocialWall(socialWall);
  }, [socialWall, pushSocialWall]);

  useEffect(() => {
    pushGuestbook(guestbook);
  }, [guestbook, pushGuestbook]);

  useEffect(() => {
    pushListings(listings);
  }, [listings, pushListings]);

  useEffect(() => {
    pushEvents(events);
  }, [events, pushEvents]);

  useEffect(() => {
    pushTickets(tickets);
  }, [tickets, pushTickets]);

  useEffect(() => {
    pushPasses(passes);
  }, [passes, pushPasses]);

  useEffect(() => {
    pushTrails(trails);
  }, [trails, pushTrails]);

  const brandingDirty = useMemo(
    () => !shallowEqualBranding(branding, savedBranding),
    [branding, savedBranding],
  );
  const modulesDirty = useMemo(
    () => !shallowEqualModules(modules, savedModules),
    [modules, savedModules],
  );
  const billboardDirty = useMemo(
    () => !shallowEqualBillboard(billboard, savedBillboard),
    [billboard, savedBillboard],
  );
  const aiDirty = useMemo(
    () => !shallowEqualAi(aiAvatar, savedAi),
    [aiAvatar, savedAi],
  );
  const surveyDirty = useMemo(
    () => JSON.stringify(survey) !== JSON.stringify(savedSurvey),
    [survey, savedSurvey],
  );
  const dealsDirty = useMemo(
    () => JSON.stringify(deals) !== JSON.stringify(savedDeals),
    [deals, savedDeals],
  );
  const photoBoothDirty = useMemo(
    () => JSON.stringify(photoBooth) !== JSON.stringify(savedPhotoBooth),
    [photoBooth, savedPhotoBooth],
  );
  const brochuresDirty = useMemo(
    () => JSON.stringify(brochures) !== JSON.stringify(savedBrochures),
    [brochures, savedBrochures],
  );
  const socialWallDirty = useMemo(
    () => JSON.stringify(socialWall) !== JSON.stringify(savedSocialWall),
    [socialWall, savedSocialWall],
  );
  const guestbookDirty = useMemo(
    () => JSON.stringify(guestbook) !== JSON.stringify(savedGuestbook),
    [guestbook, savedGuestbook],
  );
  const listingsDirty = useMemo(
    () => JSON.stringify(listings) !== JSON.stringify(savedListings),
    [listings, savedListings],
  );
  const eventsDirty = useMemo(
    () => JSON.stringify(events) !== JSON.stringify(savedEvents),
    [events, savedEvents],
  );
  const ticketsDirty = useMemo(
    () => JSON.stringify(tickets) !== JSON.stringify(savedTickets),
    [tickets, savedTickets],
  );
  const passesDirty = useMemo(
    () => JSON.stringify(passes) !== JSON.stringify(savedPasses),
    [passes, savedPasses],
  );
  const trailsDirty = useMemo(
    () => JSON.stringify(trails) !== JSON.stringify(savedTrails),
    [trails, savedTrails],
  );
  const adsDirty = useMemo(
    () => JSON.stringify(ads) !== JSON.stringify(savedAds),
    [ads, savedAds],
  );
  const integrationsDirty = useMemo(
    () => JSON.stringify(integrations) !== JSON.stringify(savedIntegrations),
    [integrations, savedIntegrations],
  );
  const i18nDirty = useMemo(
    () => i18nLoaded && JSON.stringify(i18nBundle) !== JSON.stringify(savedI18nBundle),
    [i18nBundle, savedI18nBundle, i18nLoaded],
  );
  const isDirty =
    brandingDirty ||
    modulesDirty ||
    billboardDirty ||
    aiDirty ||
    surveyDirty ||
    dealsDirty ||
    photoBoothDirty ||
    brochuresDirty ||
    socialWallDirty ||
    guestbookDirty ||
    listingsDirty ||
    eventsDirty ||
    ticketsDirty ||
    passesDirty ||
    trailsDirty ||
    adsDirty ||
    integrationsDirty ||
    i18nDirty;

  const effectiveSaveState =
    saveState === 'saving' || saveState === 'error'
      ? saveState
      : isDirty
        ? 'idle'
        : 'saved';

  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    setSaveState('saving');
    setErrorMsg(null);
    try {
      const payload: {
        branding?: Branding;
        modules?: ModulesConfig;
        billboard?: BillboardConfig;
        aiAvatar?: AiAvatarConfig;
        survey?: SurveyConfig;
        deals?: DealsModuleConfig;
        photoBooth?: PhotoBoothConfig;
        brochures?: BrochuresModuleConfig;
        socialWall?: SocialWallConfig;
        guestbook?: GuestbookConfig;
        listings?: ListingsModule;
        events?: EventsModule;
        tickets?: TicketsModule;
        passes?: PassesModule;
        trails?: TrailsModule;
        ads?: AdsModule;
        integrations?: IntegrationsConfig;
      } = {};
      if (brandingDirty) payload.branding = branding;
      if (modulesDirty) payload.modules = modules;
      if (billboardDirty) payload.billboard = billboard;
      if (aiDirty) payload.aiAvatar = aiAvatar;
      if (surveyDirty) payload.survey = survey;
      if (dealsDirty) payload.deals = deals;
      if (photoBoothDirty) payload.photoBooth = photoBooth;
      if (brochuresDirty) payload.brochures = brochures;
      if (socialWallDirty) payload.socialWall = socialWall;
      if (guestbookDirty) payload.guestbook = guestbook;
      if (listingsDirty) payload.listings = listings;
      if (eventsDirty) payload.events = events;
      if (ticketsDirty) payload.tickets = tickets;
      if (passesDirty) payload.passes = passes;
      if (trailsDirty) payload.trails = trails;
      if (adsDirty) payload.ads = ads;
      if (integrationsDirty) payload.integrations = integrations;
      const tasks: Array<Promise<unknown>> = [];
      if (Object.keys(payload).length > 0) {
        tasks.push(patchConfig(initialConfig.slug, payload));
      }
      if (i18nDirty) {
        tasks.push(patchI18n(initialConfig.slug, i18nBundle));
      }
      await Promise.all(tasks);
      if (brandingDirty) setSavedBranding(branding);
      if (modulesDirty) setSavedModules(modules);
      if (billboardDirty) setSavedBillboard(billboard);
      if (aiDirty) setSavedAi(aiAvatar);
      if (surveyDirty) setSavedSurvey(survey);
      if (dealsDirty) setSavedDeals(deals);
      if (photoBoothDirty) setSavedPhotoBooth(photoBooth);
      if (brochuresDirty) setSavedBrochures(brochures);
      if (socialWallDirty) setSavedSocialWall(socialWall);
      if (guestbookDirty) setSavedGuestbook(guestbook);
      if (listingsDirty) setSavedListings(listings);
      if (eventsDirty) setSavedEvents(events);
      if (ticketsDirty) setSavedTickets(tickets);
      if (passesDirty) setSavedPasses(passes);
      if (trailsDirty) setSavedTrails(trails);
      if (adsDirty) setSavedAds(ads);
      if (integrationsDirty) setSavedIntegrations(integrations);
      if (i18nDirty) setSavedI18nBundle(i18nBundle);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    } catch (err) {
      console.error('[Studio Save]', err);
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
      setSaveState('error');
    }
  }, [
    branding,
    modules,
    billboard,
    aiAvatar,
    survey,
    deals,
    photoBooth,
    brochures,
    socialWall,
    guestbook,
    listings,
    events,
    tickets,
    passes,
    trails,
    ads,
    integrations,
    i18nBundle,
    brandingDirty,
    modulesDirty,
    billboardDirty,
    aiDirty,
    surveyDirty,
    dealsDirty,
    photoBoothDirty,
    brochuresDirty,
    socialWallDirty,
    guestbookDirty,
    listingsDirty,
    eventsDirty,
    ticketsDirty,
    passesDirty,
    trailsDirty,
    adsDirty,
    integrationsDirty,
    i18nDirty,
    isDirty,
    initialConfig.slug,
  ]);

  const handleDiscard = useCallback(() => {
    setBranding(savedBranding);
    setModules(savedModules);
    setBillboard(savedBillboard);
    setAiAvatar(savedAi);
    setSurvey(savedSurvey);
    setDeals(savedDeals);
    setPhotoBooth(savedPhotoBooth);
    setBrochures(savedBrochures);
    setSocialWall(savedSocialWall);
    setGuestbook(savedGuestbook);
    setListings(savedListings);
    setEvents(savedEvents);
    setTickets(savedTickets);
    setPasses(savedPasses);
    setTrails(savedTrails);
    setAds(savedAds);
    setIntegrations(savedIntegrations);
    setI18nBundle(savedI18nBundle);
    setSaveState('idle');
    setErrorMsg(null);
    setPreviewKey((k) => k + 1);
  }, [
    savedBranding,
    savedModules,
    savedBillboard,
    savedAi,
    savedSurvey,
    savedDeals,
    savedPhotoBooth,
    savedBrochures,
    savedSocialWall,
    savedGuestbook,
    savedListings,
    savedEvents,
    savedTickets,
    savedPasses,
    savedTrails,
    savedAds,
    savedIntegrations,
    savedI18nBundle,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <TopBar
        slug={initialConfig.slug}
        nombre={initialConfig.nombre}
        currentVersion={initialConfig.currentVersion}
        saveState={effectiveSaveState}
        isDirty={isDirty}
        onOpenVersions={() => setActiveTab('versions')}
        versionsActive={activeTab === 'versions'}
      />

      {errorMsg && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <SidebarTabs
          sections={STUDIO_SECTIONS}
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          systemModules={modules.systemModules ?? DEFAULT_SYSTEM_MODULES}
        />

        <main className="flex flex-1 overflow-hidden">
          <div className="flex w-[480px] shrink-0 flex-col overflow-hidden border-r border-zinc-200 dark:border-zinc-900">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex flex-1 flex-col overflow-hidden"
              >
                <EditorPanel
                  sectionKey={activeTab}
                  branding={branding}
                  onBrandingChange={setBranding}
                  modules={modules}
                  onModulesChange={setModules}
                  billboard={billboard}
                  onBillboardChange={setBillboard}
                  aiAvatar={aiAvatar}
                  onAiAvatarChange={setAiAvatar}
                  survey={survey}
                  onSurveyChange={setSurvey}
                  onSurveyPreview={openSurveyPreview}
                  deals={deals}
                  onDealsChange={setDeals}
                  onDealsPreview={openDealsPreview}
                  photoBooth={photoBooth}
                  onPhotoBoothChange={setPhotoBooth}
                  onPhotoBoothPreview={openPhotoBoothPreview}
                  brochures={brochures}
                  onBrochuresChange={setBrochures}
                  onBrochuresPreview={openBrochuresPreview}
                  socialWall={socialWall}
                  onSocialWallChange={setSocialWall}
                  onSocialWallPreview={openSocialWallPreview}
                  guestbook={guestbook}
                  onGuestbookChange={setGuestbook}
                  onGuestbookPreview={openGuestbookPreview}
                  listings={listings}
                  onListingsChange={setListings}
                  events={events}
                  onEventsChange={setEvents}
                  tickets={tickets}
                  onTicketsChange={setTickets}
                  passes={passes}
                  onPassesChange={setPasses}
                  trails={trails}
                  onTrailsChange={setTrails}
                  i18nBundle={i18nBundle}
                  onI18nBundleChange={setI18nBundle}
                  ads={ads}
                  onAdsChange={setAds}
                  integrations={integrations}
                  onIntegrationsChange={setIntegrations}
                />
              </motion.div>
            </AnimatePresence>
            <SaveBar
              saveState={effectiveSaveState}
              isDirty={isDirty}
              onSave={handleSave}
              onUndo={handleDiscard}
              onRedo={() => setPreviewKey((k) => k + 1)}
            />
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            <PreviewPanel
              slug={initialConfig.slug}
              nombre={initialConfig.nombre}
              reloadKey={previewKey}
              iframeRef={iframeRef}
              onIframeLoad={onIframeLoad}
            />
          </div>
        </main>
      </div>

      <p className="sr-only" aria-live="polite">
        {effectiveSaveState === 'saving'
          ? 'Saving changes'
          : effectiveSaveState === 'saved' && !isDirty
            ? 'All changes saved'
            : isDirty
              ? 'You have unsaved changes'
              : ''}
      </p>

      <span hidden suppressHydrationWarning>
        {initialMeta?.lastEditedAt ?? ''}
      </span>
    </div>
  );
}

function shallowEqualBranding(a: Branding, b: Branding): boolean {
  if (a.primary !== b.primary) return false;
  if (a.secondary !== b.secondary) return false;
  if (a.tertiary !== b.tertiary) return false;
  if ((a.logo ?? '') !== (b.logo ?? '')) return false;
  if ((a.idleLogo ?? '') !== (b.idleLogo ?? '')) return false;
  if ((a.footerLogo ?? '') !== (b.footerLogo ?? '')) return false;
  if ((a.favicon ?? '') !== (b.favicon ?? '')) return false;
  if ((a.fonts?.display ?? '') !== (b.fonts?.display ?? '')) return false;
  if ((a.fonts?.body ?? '') !== (b.fonts?.body ?? '')) return false;
  if ((a.fonts?.displayCustom?.name ?? '') !== (b.fonts?.displayCustom?.name ?? '')) return false;
  if ((a.fonts?.bodyCustom?.name ?? '') !== (b.fonts?.bodyCustom?.name ?? '')) return false;
  return true;
}

function shallowEqualModules(a: ModulesConfig, b: ModulesConfig): boolean {
  if (a.tiles.length !== b.tiles.length) return false;
  for (let i = 0; i < a.tiles.length; i++) {
    const ta = a.tiles[i];
    const tb = b.tiles[i];
    if (ta.key !== tb.key) return false;
    if (ta.label !== tb.label) return false;
    if (ta.enabled !== tb.enabled) return false;
  }
  const sa = a.systemModules;
  const sb = b.systemModules;
  if ((sa?.ads ?? true) !== (sb?.ads ?? true)) return false;
  if ((sa?.languages ?? true) !== (sb?.languages ?? true)) return false;
  if ((sa?.aiAvatar ?? true) !== (sb?.aiAvatar ?? true)) return false;
  return true;
}

function shallowEqualBillboard(a: BillboardConfig, b: BillboardConfig): boolean {
  return a.variant === b.variant && a.idleTimeoutSec === b.idleTimeoutSec;
}

function shallowEqualAi(a: AiAvatarConfig, b: AiAvatarConfig): boolean {
  if ((a.avatar ?? '') !== (b.avatar ?? '')) return false;
  if ((a.heroVideo ?? '') !== (b.heroVideo ?? '')) return false;
  if (a.greeting !== b.greeting) return false;
  if (a.model !== b.model) return false;
  if ((a.apiKey ?? '') !== (b.apiKey ?? '')) return false;
  if (a.suggestedQuestions.length !== b.suggestedQuestions.length) return false;
  for (let i = 0; i < a.suggestedQuestions.length; i++) {
    if (a.suggestedQuestions[i].id !== b.suggestedQuestions[i].id) return false;
    if (a.suggestedQuestions[i].text !== b.suggestedQuestions[i].text) return false;
  }
  return true;
}
