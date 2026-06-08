'use client';

import type { PwaSearchConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

/**
 * Editor de la pantalla "Search" de la PWA (`SearchScreen`). Edita solo los textos
 * white-label; el índice buscable se construye del setup (secciones + listings +
 * eventos), no se edita aquí.
 */

const EMPTY: PwaSearchConfig = {
  placeholder: '',
  recentTitle: '',
  browseTitle: '',
  clearAll: '',
  noResults: '',
  typeSection: '',
  typeEvent: '',
};

export function SearchEditor({
  value,
  onChange,
}: {
  value: PwaSearchConfig | undefined;
  onChange: (next: PwaSearchConfig) => void;
}) {
  const v: PwaSearchConfig = { ...EMPTY, ...value };

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Search"
        description="White-label texts of the search screen. The searchable index is built from the setup (sections, listings, events)."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="General">
          <PwaField
            label="Placeholder"
            value={v.placeholder}
            onChange={(placeholder) => onChange({ ...v, placeholder })}
          />
          <PwaField
            label="Recent heading"
            value={v.recentTitle}
            onChange={(recentTitle) => onChange({ ...v, recentTitle })}
          />
          <PwaField
            label="Browse heading"
            value={v.browseTitle}
            onChange={(browseTitle) => onChange({ ...v, browseTitle })}
          />
          <PwaField
            label="Clear all"
            value={v.clearAll}
            onChange={(clearAll) => onChange({ ...v, clearAll })}
          />
          <PwaField
            label="No results (supports {query})"
            value={v.noResults}
            onChange={(noResults) => onChange({ ...v, noResults })}
          />
        </PwaGroup>

        <PwaGroup title="Result type labels">
          <PwaField
            label="Section subtitle"
            value={v.typeSection}
            onChange={(typeSection) => onChange({ ...v, typeSection })}
          />
          <PwaField
            label="Event subtitle"
            value={v.typeEvent}
            onChange={(typeEvent) => onChange({ ...v, typeEvent })}
          />
        </PwaGroup>
      </div>
    </div>
  );
}
