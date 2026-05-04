'use client';

// framer-motion ya no es necesario aquí — el tab transition usa CSS keyframes
// nativos (`studio-tab-fade` en studio.css). Audit F-41 quitó este peso del
// bundle del Shell. Otros componentes (modales, sidebar active indicator
// con layoutId) siguen usando framer-motion.
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
import { recordSave as recordSaveLocal } from '../_lib/local-version-history';
import { STUDIO_SECTIONS, type StudioSectionKey } from '../_lib/sections';
import { StudioSlugProvider } from '../_lib/slug-context';
import { usePreviewBridge } from '../_lib/use-preview-bridge';

import { EditorPanel } from './EditorPanel';
import { MobileTabBar, type MobileEditorTab } from './MobileTabBar';
import { PreviewPanel } from './PreviewPanel';
import { CommandPalette } from './CommandPalette';
import { PublishModal } from './PublishModal';
import { SaveBar } from './SaveBar';
import { ShortcutsModal } from './ShortcutsModal';
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
  // Mobile/tablet tab state (`<lg` viewport): solo un panel visible a la vez.
  // En `lg+` ignorado — los 3 paneles (sidebar / editor / preview) se ven
  // simultáneamente. Default 'editor' porque es el flujo más común al entrar.
  const [mobileTab, setMobileTab] = useState<MobileEditorTab>('editor');
  const [previewKey, setPreviewKey] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

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
  const [savedPhotoBooth, setSavedPhotoBooth] = useState<PhotoBoothConfig>(initialPhotoBooth);
  const [photoBooth, setPhotoBooth] = useState<PhotoBoothConfig>(initialPhotoBooth);

  const initialBrochures = initialConfig.brochures ?? structuredClone(DEFAULT_BROCHURES);
  const [savedBrochures, setSavedBrochures] = useState<BrochuresModuleConfig>(initialBrochures);
  const [brochures, setBrochures] = useState<BrochuresModuleConfig>(initialBrochures);

  const initialSocialWall = initialConfig.socialWall ?? structuredClone(DEFAULT_SOCIAL_WALL);
  const [savedSocialWall, setSavedSocialWall] = useState<SocialWallConfig>(initialSocialWall);
  const [socialWall, setSocialWall] = useState<SocialWallConfig>(initialSocialWall);

  const initialGuestbook = initialConfig.guestbook ?? structuredClone(DEFAULT_GUESTBOOK);
  const [savedGuestbook, setSavedGuestbook] = useState<GuestbookConfig>(initialGuestbook);
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
    bridgeStatus,
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

  useEffect(() => {
    pushAds(ads);
  }, [ads, pushAds]);

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
  const aiDirty = useMemo(() => !shallowEqualAi(aiAvatar, savedAi), [aiAvatar, savedAi]);
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
  const adsDirty = useMemo(() => JSON.stringify(ads) !== JSON.stringify(savedAds), [ads, savedAds]);
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
    saveState === 'saving' || saveState === 'error' ? saveState : isDirty ? 'idle' : 'saved';

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
      // Append al timeline local de versiones (placeholder hasta S7.2 — audit F-10).
      recordSaveLocal(initialConfig.slug, initialMeta?.lastEditor ?? 'ruben@trueomni.com');
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

  // beforeunload guard (audit F-26): si hay cambios sin guardar, el navegador
  // dispara su confirm dialog nativo al cerrar pestaña / refrescar / navegar
  // a otra URL. El operador puede cancelar y volver al editor sin perder.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Necesario para que Chrome muestre el confirm. El texto custom se
      // ignora en navegadores modernos por seguridad.
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

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
      // Cmd+/ abre el cheat sheet de shortcuts (audit F-44).
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
      }
      // Cmd+K abre el command palette (audit F-47).
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave]);

  return (
    <StudioSlugProvider slug={initialConfig.slug}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <TopBar
          slug={initialConfig.slug}
          nombre={initialConfig.nombre}
          favicon={branding.favicon}
          currentVersion={initialConfig.currentVersion}
          saveState={effectiveSaveState}
          isDirty={isDirty}
          onOpenVersions={() => setActiveTab('versions')}
          versionsActive={activeTab === 'versions'}
          onPublish={() => setPublishOpen(true)}
        />

        {errorMsg && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Mobile tab bar — visible solo `<lg`. En `lg+` los 3 paneles
            (sidebar/editor/preview) coexisten side-by-side y este bar se
            oculta. */}
        <MobileTabBar
          active={mobileTab}
          onChange={setMobileTab}
          className="lg:hidden"
        />

        <div className="flex flex-1 overflow-hidden">
          <div
            className={`${mobileTab === 'sections' ? 'flex' : 'hidden'} w-full shrink-0 lg:flex lg:w-auto`}
          >
            <SidebarTabs
              sections={STUDIO_SECTIONS}
              activeKey={activeTab}
              onSelect={(k) => {
                setActiveTab(k);
                // Auto-flow en mobile: tras elegir sección, saltar al editor.
                setMobileTab('editor');
              }}
              systemModules={modules.systemModules ?? DEFAULT_SYSTEM_MODULES}
              bridgeStatus={bridgeStatus}
              onReloadPreview={() => setPreviewKey((k) => k + 1)}
            />
          </div>

          <main className="flex flex-1 overflow-hidden">
            <div
              className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} w-full shrink-0 flex-col overflow-hidden border-r border-zinc-200 dark:border-zinc-900 lg:flex lg:w-[400px] xl:w-[480px]`}
            >
              {/* `key={activeTab}` fuerza re-mount al cambiar de sección;
                  la animación CSS `studio-tab-fade` se reproduce en cada
                  re-mount. Reemplaza AnimatePresence (audit F-41). */}
              <div
                key={activeTab}
                className="studio-tab-fade flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                  <EditorPanel
                    sectionKey={activeTab}
                    branding={branding}
                    onBrandingChange={setBranding}
                    modules={modules}
                    onModulesChange={setModules}
                    billboard={billboard}
                    onBillboardChange={setBillboard}
                    onBillboardPreview={openBillboardPreview}
                    onHomeDashboardPreview={openHomeDashboardPreview}
                    aiAvatar={aiAvatar}
                    onAiAvatarChange={setAiAvatar}
                    onAiAvatarPreview={openAiAvatarPreview}
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
                    onEventsPreview={openEventsPreview}
                    tickets={tickets}
                    onTicketsChange={setTickets}
                    onTicketsPreview={openTicketsPreview}
                    passes={passes}
                    onPassesChange={setPasses}
                    onPassesPreview={openPassesPreview}
                    trails={trails}
                    onTrailsChange={setTrails}
                    onTrailsPreview={openTrailsPreview}
                    i18nBundle={i18nBundle}
                    onI18nBundleChange={setI18nBundle}
                    ads={ads}
                    onAdsChange={setAds}
                    integrations={integrations}
                    onIntegrationsChange={setIntegrations}
                    currentVersion={initialConfig.currentVersion ?? 0}
                    lastPublishedAt={initialMeta?.lastEditedAt}
                    lastEditor={initialMeta?.lastEditor}
                    onPublish={() => setPublishOpen(true)}
                  />
              </div>
              <SaveBar
                saveState={effectiveSaveState}
                isDirty={isDirty}
                onSave={handleSave}
                onUndo={handleDiscard}
                onRedo={() => setPreviewKey((k) => k + 1)}
              />
            </div>

            <div
              className={`${mobileTab === 'preview' ? 'flex' : 'hidden'} relative w-full flex-1 items-center justify-center overflow-hidden lg:flex lg:w-auto`}
            >
              <PreviewPanel
                slug={initialConfig.slug}
                nombre={initialConfig.nombre}
                initialOrientation={initialConfig.orientation ?? 'portrait'}
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

        <PublishModal
          open={publishOpen}
          slug={initialConfig.slug}
          onClose={() => setPublishOpen(false)}
          currentVersion={initialConfig.currentVersion ?? 0}
          editor={initialMeta?.lastEditor ?? 'ruben@trueomni.com'}
        />

        <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onSelectSection={(k) => setActiveTab(k)}
          slug={initialConfig.slug}
          onPublish={() => setPublishOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onSave={() => void handleSave()}
        />
      </div>
    </StudioSlugProvider>
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
  if (JSON.stringify(a.homeHero ?? null) !== JSON.stringify(b.homeHero ?? null)) return false;
  if (
    JSON.stringify(a.heroGradient ?? null) !== JSON.stringify(b.heroGradient ?? null)
  )
    return false;
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
  // Comparación full JSON: cubre todos los campos actuales y futuros sin
  // riesgo de olvidar añadir uno cuando se extiende el schema (bug histórico:
  // antes solo se comparaban variant/idleTimeout/logoSize/modules y los
  // cambios al b0 nunca marcaban dirty).
  return JSON.stringify(a) === JSON.stringify(b);
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
