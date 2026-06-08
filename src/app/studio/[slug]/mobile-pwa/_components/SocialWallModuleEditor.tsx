'use client';

import type { PwaSocialWallModuleConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

/**
 * Editor del módulo "Social Wall" de la PWA (`SocialWallScreen`). Edita solo los
 * textos white-label de `PwaSocialWallModuleConfig`; el muro (hashtag, handles,
 * highlights, posts) viene del setup (`home.modules['social-wall']`).
 */

const EMPTY: PwaSocialWallModuleConfig = {
  title: '',
  allLabel: '',
  highlightsLabel: '',
};

export function SocialWallModuleEditor({
  value,
  onChange,
}: {
  value: PwaSocialWallModuleConfig | undefined;
  onChange: (next: PwaSocialWallModuleConfig) => void;
}) {
  const v: PwaSocialWallModuleConfig = { ...EMPTY, ...value };

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Social Wall"
        description="White-label texts of the social wall. Posts, handles, hashtag and highlights come from the setup."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="General">
          <PwaField label="Title" value={v.title} onChange={(title) => onChange({ ...v, title })} />
          <PwaField
            label="All tab label"
            value={v.allLabel}
            onChange={(allLabel) => onChange({ ...v, allLabel })}
          />
          <PwaField
            label="Highlights row label"
            value={v.highlightsLabel}
            onChange={(highlightsLabel) => onChange({ ...v, highlightsLabel })}
          />
        </PwaGroup>
      </div>
    </div>
  );
}
