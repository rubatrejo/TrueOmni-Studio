'use client';

import type { PwaConfig } from '@/lib/config';
import type { UnifiedClientBranding } from '@/lib/studio/client-branding-sync';

import { BrandingForm } from '../../_components/BrandingForm';
import { PWA_SECTIONS, type PwaSectionKey } from '../_lib/pwa-sections';

import { ModulesEditor } from './ModulesEditor';
import { PwaPanelHeader, PwaPlaceholderPanel } from './pwa-ui';
import { ScavengerHuntEditor } from './ScavengerHuntEditor';
import { TripPlannerEditor } from './TripPlannerEditor';
import { WayfindingEditor } from './WayfindingEditor';

/**
 * Panel central del editor PWA. Renderiza el editor de la sección activa.
 *
 * Implementados: Branding (unified, compartido) y Trip Planner. El resto de
 * secciones muestran un placeholder hasta la siguiente iteración. El branding
 * y el idioma se previsualizan en vivo vía el StudioBridge.
 */
export function PwaEditorPanel({
  slug,
  sectionKey,
  pwa,
  onPwaChange,
  branding,
  onBrandingChange,
}: {
  slug: string;
  sectionKey: PwaSectionKey;
  pwa: PwaConfig;
  onPwaChange: (next: PwaConfig) => void;
  branding: UnifiedClientBranding;
  onBrandingChange: (next: UnifiedClientBranding) => void;
}) {
  if (sectionKey === 'branding') {
    return (
      <div className="flex h-full flex-col">
        <PwaPanelHeader
          title="Branding & Identity"
          description="Brand colors, logo and typography. Shared with the kiosk — editing here updates every product for this client."
        />
        <div className="flex-1 overflow-y-auto p-4">
          <BrandingForm slug={slug} value={branding} onChange={onBrandingChange} />
        </div>
      </div>
    );
  }

  if (sectionKey === 'modules') {
    return (
      <ModulesEditor
        value={pwa.dashboard}
        onChange={(dashboard) => onPwaChange({ ...pwa, dashboard })}
      />
    );
  }

  if (sectionKey === 'scavenger-hunt') {
    return (
      <ScavengerHuntEditor
        value={pwa.scavengerHunt}
        onChange={(scavengerHunt) => onPwaChange({ ...pwa, scavengerHunt })}
      />
    );
  }

  if (sectionKey === 'wayfinding') {
    return (
      <WayfindingEditor
        value={pwa.wayfinding}
        onChange={(wayfinding) => onPwaChange({ ...pwa, wayfinding })}
      />
    );
  }

  if (sectionKey === 'trip-planner') {
    return (
      <TripPlannerEditor
        value={pwa.tripPlanner}
        onChange={(tripPlanner) => onPwaChange({ ...pwa, tripPlanner })}
      />
    );
  }

  const section = PWA_SECTIONS.find((s) => s.key === sectionKey);
  return (
    <PwaPlaceholderPanel
      title={section?.title ?? 'Section'}
      description={section?.description ?? ''}
    />
  );
}
