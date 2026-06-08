'use client';

import type { PwaDigitalBrochureModuleConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

/**
 * Editor del módulo "Digital Brochure" de la PWA. Listado (`BrochuresListScreen`)
 * → reader de PDF (`BrochureReaderScreen`). Edita solo los textos white-label de
 * `PwaDigitalBrochureModuleConfig`; los brochures (cover, pdf, categorías) vienen
 * del setup (`home.modules['digital-brochure']`).
 */

const EMPTY: PwaDigitalBrochureModuleConfig = {
  title: '',
  searchPlaceholder: '',
  allLabel: '',
  noResults: '',
  loadingLabel: '',
  mbDownloaded: '',
  errorTitle: '',
  openPdfDirectly: '',
};

export function DigitalBrochureModuleEditor({
  value,
  onChange,
}: {
  value: PwaDigitalBrochureModuleConfig | undefined;
  onChange: (next: PwaDigitalBrochureModuleConfig) => void;
}) {
  const v: PwaDigitalBrochureModuleConfig = { ...EMPTY, ...value };

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Digital Brochure"
        description="White-label texts of the brochures list and the PDF reader. Brochures and categories come from the setup."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="List">
          <PwaField label="Title" value={v.title} onChange={(title) => onChange({ ...v, title })} />
          <PwaField
            label="Search placeholder"
            value={v.searchPlaceholder}
            onChange={(searchPlaceholder) => onChange({ ...v, searchPlaceholder })}
          />
          <PwaField
            label="All tab label"
            value={v.allLabel}
            onChange={(allLabel) => onChange({ ...v, allLabel })}
          />
          <PwaField
            label="No results (supports {query})"
            value={v.noResults}
            onChange={(noResults) => onChange({ ...v, noResults })}
          />
        </PwaGroup>

        <PwaGroup title="Reader">
          <PwaField
            label="Loading label (supports {pct})"
            value={v.loadingLabel}
            onChange={(loadingLabel) => onChange({ ...v, loadingLabel })}
          />
          <PwaField
            label="MB downloaded suffix"
            value={v.mbDownloaded}
            onChange={(mbDownloaded) => onChange({ ...v, mbDownloaded })}
          />
          <PwaField
            label="Error title"
            value={v.errorTitle}
            onChange={(errorTitle) => onChange({ ...v, errorTitle })}
          />
          <PwaField
            label="Open PDF directly link"
            value={v.openPdfDirectly}
            onChange={(openPdfDirectly) => onChange({ ...v, openPdfDirectly })}
          />
        </PwaGroup>
      </div>
    </div>
  );
}
