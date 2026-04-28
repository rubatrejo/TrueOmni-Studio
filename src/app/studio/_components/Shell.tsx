'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Branding, ConfigMeta, KioskConfig } from '@/lib/studio/schema';

import { STUDIO_SECTIONS, type StudioSectionKey } from '../_lib/sections';
import { patchBranding } from '../_lib/api-client';
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

  const { iframeRef, pushBranding, onIframeLoad } = usePreviewBridge();

  useEffect(() => {
    pushBranding({
      primary: branding.primary,
      secondary: branding.secondary,
      tertiary: branding.tertiary,
      logo: branding.logo,
      favicon: branding.favicon,
      fonts: branding.fonts,
    });
  }, [branding, pushBranding]);

  const isDirty = useMemo(() => !shallowEqualBranding(branding, savedBranding), [branding, savedBranding]);

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
      await patchBranding(initialConfig.slug, branding);
      setSavedBranding(branding);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    } catch (err) {
      console.error('[Studio Save]', err);
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
      setSaveState('error');
    }
  }, [branding, initialConfig.slug, isDirty]);

  const handleDiscard = useCallback(() => {
    setBranding(savedBranding);
    setSaveState('idle');
    setErrorMsg(null);
    setPreviewKey((k) => k + 1);
  }, [savedBranding]);

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
  if ((a.favicon ?? '') !== (b.favicon ?? '')) return false;
  if ((a.fonts?.display ?? '') !== (b.fonts?.display ?? '')) return false;
  if ((a.fonts?.body ?? '') !== (b.fonts?.body ?? '')) return false;
  return true;
}
