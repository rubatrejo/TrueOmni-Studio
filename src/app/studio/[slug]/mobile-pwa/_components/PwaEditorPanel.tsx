'use client';

import type { PwaConfig } from '@/lib/config';
import type { Branding } from '@/lib/studio/schema';

import { BrandingSyncBanner } from '../../../_components/BrandingSyncBanner';
import { BrandingEditor } from '../../../_components/EditorPanel';
import { PWA_SECTIONS, type PwaSectionKey } from '../_lib/pwa-sections';

import { ModulesEditor } from './ModulesEditor';
import { PwaPanelHeader, PwaPlaceholderPanel } from './pwa-ui';
import { ScavengerHuntEditor } from './ScavengerHuntEditor';
import { TripPlannerEditor } from './TripPlannerEditor';
import { WayfindingEditor } from './WayfindingEditor';

/**
 * Panel central del editor PWA. Renderiza el editor de la sección activa con el
 * mismo chasis (header + scroll) y tamaños que el EditorPanel del kiosk.
 *
 * Branding reutiliza el MISMO `BrandingEditor` del kiosk (mismo UI) sobre el
 * branding compartido del cliente. El resto de secciones edita el slice
 * `features.pwa`. Trip Planner / Módulos / Scavenger Hunt / Wayfinding tienen
 * editor real; el branding y el idioma se previsualizan en vivo.
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
  branding: Branding;
  onBrandingChange: (next: Branding) => void;
}) {
  if (sectionKey === 'branding') {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
        <PwaPanelHeader
          title="Branding & Identity"
          description="Brand colors, logo and typography. Shared with the kiosk — editing here updates every product for this client."
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <BrandingSyncBanner slug={slug} product="pwa" />
          <BrandingEditor branding={branding} onChange={onBrandingChange} />
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
