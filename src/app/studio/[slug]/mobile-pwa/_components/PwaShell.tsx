'use client';

import { useCallback, useEffect, useState } from 'react';

import type { PwaConfig } from '@/lib/config';
import type { UnifiedClientBranding } from '@/lib/studio/client-branding-sync';
import { hslToHex } from '@/lib/studio/hex-to-hsl';

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
  type PwaSliceMetaDto,
} from '../../../_lib/api-client';
import { StudioSlugProvider } from '../../../_lib/slug-context';
import { usePwaPreviewBridge, type PwaBrandingPatch } from '../../../_lib/use-pwa-preview-bridge';
import { PWA_SECTIONS, type PwaSectionKey } from '../_lib/pwa-sections';

import { PwaEditorPanel } from './PwaEditorPanel';

/**
 * Chasis del editor PWA. Paralelo a `Shell.tsx` (kiosk) pero con dos slices de
 * estado: el branding unificado del cliente (compartido con kiosk/signage) y
 * el slice `features.pwa`. Reutiliza TopBar / SidebarTabs / SaveBar /
 * PreviewPanel / MobileTabBar / BrandingForm del kiosk vía sus props (cero
 * regresión del editor del kiosk).
 */

/** HSL canónico ("H S% L%") o hex → hex `#RRGGBB` (client-safe; `toHex` del
 *  módulo server-only `client-branding-sync` no es importable aquí). */
function toHexClient(value: string): string {
  const t = value.trim();
  if (t.startsWith('#')) {
    return t.length === 4 ? `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}` : t;
  }
  return hslToHex(t);
}

function unifiedToPwaBrandingPatch(u: UnifiedClientBranding): PwaBrandingPatch {
  return {
    primary: toHexClient(u.brand.primary),
    secondary: toHexClient(u.brand.secondary),
    tertiary: toHexClient(u.brand.accent),
    logo: u.logos.default || undefined,
    favicon: u.favicon || undefined,
    fonts: { display: u.fonts.display, body: u.fonts.body },
    clientName: u.name,
  };
}

export function PwaShell({
  slug,
  nombre,
  initialPwa,
  initialMeta,
  initialBranding,
}: {
  slug: string;
  nombre: string;
  initialPwa: PwaConfig;
  initialMeta: PwaSliceMetaDto | null;
  /** Branding unificado del cliente (compartido). Editable desde esta PWA. */
  initialBranding: UnifiedClientBranding;
}) {
  const [activeTab, setActiveTab] = useState<PwaSectionKey>('branding');
  const [mobileTab, setMobileTab] = useState<MobileEditorTab>('editor');
  const [previewKey, setPreviewKey] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const toast = useToast();

  const [publishing, setPublishing] = useState(false);
  const [savedPwa, setSavedPwa] = useState<PwaConfig>(initialPwa);
  const [pwa, setPwa] = useState<PwaConfig>(initialPwa);

  const [savedBranding, setSavedBranding] = useState<UnifiedClientBranding>(initialBranding);
  const [branding, setBranding] = useState<UnifiedClientBranding>(initialBranding);

  const { iframeRef, pushPwa, pushBranding, pushLocale, bridgeStatus, onIframeLoad } =
    usePwaPreviewBridge();

  // Empuja el branding al preview en cada cambio (y se re-envía en cada
  // handshake) para que `/pwa` muestre la marca real, no la del cliente
  // `default` que sirve el build del Studio.
  useEffect(() => {
    pushBranding(unifiedToPwaBrandingPatch(branding));
  }, [branding, pushBranding]);

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
      if (dirtyPwa) tasks.push(patchPwaSlice(slug, pwa));
      if (dirtyBranding) tasks.push(patchClientBranding(slug, branding));
      await Promise.all(tasks);
      if (dirtyPwa) setSavedPwa(pwa);
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
  }, [pwa, savedPwa, branding, savedBranding, slug, toast]);

  const handlePublish = useCallback(async () => {
    if (publishing) return;
    // Si hay cambios sin guardar, primero los persistimos: el publish lee del
    // KV, así que sin guardar no entrarían en el PR.
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
          currentVersion={initialMeta?.currentVersion ?? 0}
          saveState={effectiveSaveState}
          isDirty={isDirty}
          productLabel="Mobile PWA"
          previewHref="/pwa"
          showExportImport={false}
          onPublish={() => void handlePublish()}
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
