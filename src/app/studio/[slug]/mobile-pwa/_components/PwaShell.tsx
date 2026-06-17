'use client';

import { Play } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { PwaConfig } from '@/lib/config';
import type { UnifiedClientBranding } from '@/lib/studio/client-branding-sync';
import { hexToHsl } from '@/lib/studio/hex-to-hsl';
import type { Branding } from '@/lib/studio/schema';

import { MobileTabBar, type MobileEditorTab } from '../../../_components/MobileTabBar';
import { PreviewPanel } from '../../../_components/PreviewPanel';
import { SaveBar } from '../../../_components/SaveBar';
import { SidebarTabs } from '../../../_components/SidebarTabs';
import { useToast } from '../../../_components/Toast';
import { TopBar } from '../../../_components/TopBar';
import {
  patchClientBranding,
  patchPwaSlice,
  publishPwaSlice,
  publishStandalone,
  type PwaSliceMetaDto,
} from '../../../_lib/api-client';
import { StudioSlugProvider } from '../../../_lib/slug-context';
import { usePwaPreviewBridge, type PwaBrandingPatch } from '../../../_lib/use-pwa-preview-bridge';
import { PWA_SECTIONS, pwaSectionPreviewRoute, type PwaSectionKey } from '../_lib/pwa-sections';

import { PwaEditorPanel } from './PwaEditorPanel';

/**
 * Chasis del editor PWA. Paralelo a `Shell.tsx` (kiosk) pero con dos slices de
 * estado: el branding del cliente (compartido con kiosk/signage, editado con el
 * MISMO `BrandingEditor` del kiosk) y el slice `features.pwa`. Reutiliza el
 * chasis del kiosk (TopBar / SidebarTabs / SaveBar / PreviewPanel / MobileTabBar
 * / BrandingEditor) sin tocar su comportamiento.
 */

/** Branding (hex, shape del kiosk) → patch para el bridge del preview PWA. */
function brandingToPatch(b: Branding, clientName: string): PwaBrandingPatch {
  return {
    primary: b.primary,
    secondary: b.secondary,
    tertiary: b.tertiary,
    logo: b.logo,
    idleLogo: b.idleLogo,
    footerLogo: b.footerLogo,
    favicon: b.favicon,
    fonts: { display: b.fonts?.display, body: b.fonts?.body },
    clientName,
  };
}

/**
 * Reconstruye el unified branding del cliente desde el `Branding` editado (hex)
 * preservando los campos que el `BrandingEditor` no toca (name, location,
 * website, neutral). Equivalente client-safe de `kioskToUnifiedBranding`.
 */
function rebuildUnified(base: UnifiedClientBranding, b: Branding): UnifiedClientBranding {
  return {
    ...base,
    brand: {
      primary: hexToHsl(b.primary),
      secondary: hexToHsl(b.secondary),
      accent: hexToHsl(b.tertiary),
      neutral: base.brand.neutral,
    },
    logos: {
      default: b.logo ?? '',
      dark: base.logos.dark ?? '',
      idle: b.idleLogo ?? '',
      footer: b.footerLogo ?? '',
    },
    fonts: {
      display: b.fonts?.display ?? base.fonts.display,
      body: b.fonts?.body ?? base.fonts.body,
      displayCustom: b.fonts?.displayCustom,
      bodyCustom: b.fonts?.bodyCustom,
    },
    favicon: b.favicon ?? '',
    homeHero: b.homeHero ?? base.homeHero,
    heroGradient: b.heroGradient ?? base.heroGradient,
    heroLogoSize: b.heroLogoSize ?? base.heroLogoSize,
    brandVideo: b.brandVideo ?? base.brandVideo,
    idleBackground: b.idleBackground ?? base.idleBackground,
  };
}

export function PwaShell({
  slug,
  nombre,
  initialPwa,
  initialMeta,
  initialBranding,
  initialUnified,
  availableLocales,
  mapboxToken,
}: {
  slug: string;
  nombre: string;
  initialPwa: PwaConfig;
  initialMeta: PwaSliceMetaDto | null;
  /** Branding del cliente en shape `Branding` (hex) para el BrandingEditor. */
  initialBranding: Branding;
  /** Unified branding base (para preservar name/location/neutral al guardar). */
  initialUnified: UnifiedClientBranding;
  /** Idiomas que ofrece el cliente (`features.languages.available`) para el
   *  editor i18n (F-PWA-7). `null` → el editor usa su lista por defecto. */
  availableLocales: string[] | null;
  /** Token Mapbox del cliente (`integraciones.mapbox_token`) para los pickers de
   *  coords de Scavenger/Wayfinding. '' si no está configurado. */
  mapboxToken: string;
}) {
  const [activeTab, setActiveTab] = useState<PwaSectionKey>('branding');
  const [mobileTab, setMobileTab] = useState<MobileEditorTab>('editor');
  const [previewKey, setPreviewKey] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const toast = useToast();

  const [publishing, setPublishing] = useState(false);
  const [exportingStandalone, setExportingStandalone] = useState(false);

  // Export standalone SOLO de la PWA (cada editor exporta su producto).
  const handleExportStandalone = useCallback(async () => {
    if (exportingStandalone) return;
    setExportingStandalone(true);
    try {
      const res = await publishStandalone(slug, 'pwa');
      toast.show('PWA export dispatched', {
        variant: 'success',
        description: `Track the build run: ${res.runsUrl}`,
      });
    } catch (err) {
      toast.show('Export failed', {
        variant: 'error',
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setExportingStandalone(false);
    }
  }, [exportingStandalone, slug, toast]);
  const [savedPwa, setSavedPwa] = useState<PwaConfig>(initialPwa);
  const [pwa, setPwa] = useState<PwaConfig>(initialPwa);
  // F-PWA-4: la meta (versión) avanza con cada save; antes el badge usaba siempre
  // `initialMeta` y se quedaba clavado en la versión de carga.
  const [meta, setMeta] = useState(initialMeta);

  const [savedBranding, setSavedBranding] = useState<Branding>(initialBranding);
  const [branding, setBranding] = useState<Branding>(initialBranding);

  const {
    iframeRef,
    pushPwa,
    pushBranding,
    pushLocale,
    pushActiveSection,
    navTo,
    bridgeStatus,
    onIframeLoad,
  } = usePwaPreviewBridge();

  // F-PWA-2: informa al preview qué sección se edita (re-enviado en cada
  // handshake por el hook) para que el runtime PWA congele comportamientos solo
  // donde corresponde (p. ej. el auto-advance del Welcome splash).
  useEffect(() => {
    pushActiveSection(activeTab);
  }, [activeTab, pushActiveSection]);

  // Empuja el branding al preview en cada cambio (y se re-envía en cada
  // handshake) para que `/pwa` muestre la marca real, no la del cliente
  // `default` que sirve el build del Studio.
  useEffect(() => {
    pushBranding(brandingToPatch(branding, nombre));
  }, [branding, nombre, pushBranding]);

  // Empuja el slice PWA al preview en cada cambio (debounced 120ms en el hook).
  useEffect(() => {
    pushPwa(pwa);
  }, [pwa, pushPwa]);

  const pwaDirty = JSON.stringify(pwa) !== JSON.stringify(savedPwa);
  const brandingDirty = JSON.stringify(branding) !== JSON.stringify(savedBranding);
  const isDirty = pwaDirty || brandingDirty;
  const effectiveSaveState =
    saveState === 'saving' || saveState === 'error' ? saveState : isDirty ? 'idle' : 'saved';

  const handleSave = useCallback(async () => {
    const dirtyPwa = JSON.stringify(pwa) !== JSON.stringify(savedPwa);
    const dirtyBranding = JSON.stringify(branding) !== JSON.stringify(savedBranding);
    if (!dirtyPwa && !dirtyBranding) return;
    setSaveState('saving');
    try {
      const tasks: Array<Promise<unknown>> = [];
      let nextMeta: PwaSliceMetaDto | undefined;
      if (dirtyPwa)
        tasks.push(
          patchPwaSlice(slug, pwa).then((m) => {
            nextMeta = m;
          }),
        );
      if (dirtyBranding)
        tasks.push(patchClientBranding(slug, rebuildUnified(initialUnified, branding)));
      await Promise.all(tasks);
      if (dirtyPwa) {
        setSavedPwa(pwa);
        if (nextMeta) setMeta(nextMeta); // F-PWA-4: badge de versión reactivo.
      }
      if (dirtyBranding) setSavedBranding(branding);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    } catch (err) {
      console.error('[PWA Save]', err);
      toast.show('Save failed', {
        variant: 'error',
        description: err instanceof Error ? err.message : 'Unknown error',
      });
      setSaveState('error');
    }
  }, [pwa, savedPwa, branding, savedBranding, slug, initialUnified, toast]);

  const handlePublish = useCallback(async () => {
    if (publishing) return;
    const dirtyNow =
      JSON.stringify(pwa) !== JSON.stringify(savedPwa) ||
      JSON.stringify(branding) !== JSON.stringify(savedBranding);
    if (dirtyNow) await handleSave();
    setPublishing(true);
    try {
      const result = await publishPwaSlice(slug);
      if (result.pr) {
        toast.show('Published · PR opened', {
          variant: 'success',
          description: `${result.pr.branch} → ${result.pr.url}`,
        });
      } else if (result.written > 0) {
        toast.show('Published to filesystem', {
          variant: 'success',
          description: `${result.written} file(s) updated.`,
        });
      } else {
        toast.show('Nothing to publish', { description: 'No changes vs the published config.' });
      }
    } catch (err) {
      console.error('[PWA Publish]', err);
      toast.show('Publish failed', {
        variant: 'error',
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setPublishing(false);
    }
  }, [publishing, pwa, savedPwa, branding, savedBranding, handleSave, slug, toast]);

  const handleDiscard = useCallback(() => {
    setPwa(savedPwa);
    setBranding(savedBranding);
    setSaveState('idle');
    setPreviewKey((k) => k + 1);
  }, [savedPwa, savedBranding]);

  // Cmd/Ctrl+S guarda.
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

  // beforeunload guard si hay cambios sin guardar.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  return (
    <StudioSlugProvider slug={slug}>
      <div className="studio-shell flex h-screen w-full flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <TopBar
          slug={slug}
          nombre={nombre}
          favicon={branding.favicon}
          currentVersion={meta?.currentVersion ?? 0}
          saveState={effectiveSaveState}
          isDirty={isDirty}
          productLabel="Mobile PWA"
          previewHref="/pwa"
          showExportImport={false}
          onPublish={() => void handlePublish()}
          onExportStandalone={() => void handleExportStandalone()}
          exportingStandalone={exportingStandalone}
        />

        <MobileTabBar active={mobileTab} onChange={setMobileTab} className="lg:hidden" />

        <div className="flex flex-1 overflow-hidden">
          <div
            className={`${mobileTab === 'sections' ? 'flex' : 'hidden'} w-full shrink-0 lg:flex lg:w-auto`}
          >
            <SidebarTabs<PwaSectionKey>
              sections={PWA_SECTIONS}
              activeKey={activeTab}
              onSelect={(k) => {
                setActiveTab(k);
                setMobileTab('editor');
              }}
              bridgeStatus={bridgeStatus}
              onReloadPreview={() => setPreviewKey((k) => k + 1)}
            />
          </div>

          <main className="flex flex-1 overflow-hidden">
            <div
              className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} w-full shrink-0 flex-col overflow-hidden border-r border-zinc-200 dark:border-zinc-900 lg:flex lg:w-[400px] xl:w-[480px]`}
            >
              {(() => {
                // Botón "ver esta pantalla en el preview" (paridad con el editor del
                // kiosk): navega el iframe a la ruta `/pwa/...` de la sección activa.
                // Solo en secciones con pantalla propia (branding/ads/languages/publish no).
                const previewRoute = pwaSectionPreviewRoute(activeTab);
                return previewRoute ? (
                  <div className="flex shrink-0 items-center justify-end border-b border-zinc-200 px-4 py-1.5 dark:border-zinc-900">
                    <button
                      type="button"
                      onClick={() => navTo(previewRoute)}
                      title={`Open ${previewRoute} in the preview`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-[11.5px] font-medium text-sky-700 transition hover:bg-sky-500/20 dark:border-sky-400/30 dark:text-sky-300"
                    >
                      <Play className="h-3 w-3" />
                      View in preview
                    </button>
                  </div>
                ) : null;
              })()}
              <div
                key={activeTab}
                className="studio-tab-fade flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <PwaEditorPanel
                  slug={slug}
                  sectionKey={activeTab}
                  pwa={pwa}
                  onPwaChange={setPwa}
                  branding={branding}
                  onBrandingChange={setBranding}
                  availableLocales={availableLocales}
                  mapboxToken={mapboxToken}
                  currentVersion={meta?.currentVersion ?? 0}
                  onPublish={() => void handlePublish()}
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
                slug={slug}
                nombre={nombre}
                product="pwa"
                reloadKey={previewKey}
                iframeRef={iframeRef}
                onIframeLoad={onIframeLoad}
                onLocaleChange={pushLocale}
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
      </div>
    </StudioSlugProvider>
  );
}
