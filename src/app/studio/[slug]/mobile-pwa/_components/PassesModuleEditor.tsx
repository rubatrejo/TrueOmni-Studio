'use client';

import type { PwaPassesModuleConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

/**
 * Editor del módulo "Passes" de la PWA. Grid (`PassesGridScreen`) → detalle
 * (`PassDetailScreen`). Edita solo los textos white-label de
 * `PwaPassesModuleConfig`; los passes y sus actividades vienen del setup
 * (`home.modules.passes`).
 */

const EMPTY: PwaPassesModuleConfig = {
  title: '',
  eyebrow: '',
  viewWebsite: '',
  activitiesEmpty: '',
};

export function PassesModuleEditor({
  value,
  onChange,
}: {
  value: PwaPassesModuleConfig | undefined;
  onChange: (next: PwaPassesModuleConfig) => void;
}) {
  const v: PwaPassesModuleConfig = { ...EMPTY, ...value };

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Passes"
        description="White-label texts of the passes grid and detail screen. Passes data comes from the setup."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="General">
          <PwaField label="Title" value={v.title} onChange={(title) => onChange({ ...v, title })} />
          <PwaField
            label="Detail eyebrow"
            value={v.eyebrow}
            onChange={(eyebrow) => onChange({ ...v, eyebrow })}
          />
          <PwaField
            label="View website (per activity)"
            value={v.viewWebsite}
            onChange={(viewWebsite) => onChange({ ...v, viewWebsite })}
          />
          <PwaField
            label="Activities empty state"
            value={v.activitiesEmpty}
            onChange={(activitiesEmpty) => onChange({ ...v, activitiesEmpty })}
          />
        </PwaGroup>
      </div>
    </div>
  );
}
