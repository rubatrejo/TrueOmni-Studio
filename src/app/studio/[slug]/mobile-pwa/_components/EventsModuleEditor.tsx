'use client';

import type { PwaEventsModuleConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

/**
 * Editor del módulo "Events" de la PWA. La pantalla primaria es una timeline
 * cronológica (`EventsTimelineScreen`) y el detalle reutiliza
 * `ListingsDetailScreen`. Edita solo los textos white-label de
 * `PwaEventsModuleConfig`; los eventos vienen del setup (`home.modules.events`).
 */

const EMPTY: PwaEventsModuleConfig = {
  title: '',
  searchPlaceholder: '',
  locationLabel: '',
  emptyState: '',
  distanceSuffix: '',
  detail: {
    eyebrow: '',
    call: '',
    website: '',
    addFavorite: '',
    removeFavorite: '',
    seeDirections: '',
    description: '',
    getTickets: '',
  },
  filters: {
    title: '',
    features: '',
    category: '',
    venue: '',
    priceRange: '',
    free: '',
    clearAll: '',
    apply: '',
  },
};

export function EventsModuleEditor({
  value,
  onChange,
}: {
  value: PwaEventsModuleConfig | undefined;
  onChange: (next: PwaEventsModuleConfig) => void;
}) {
  const v: PwaEventsModuleConfig = {
    ...EMPTY,
    ...value,
    detail: { ...EMPTY.detail, ...value?.detail },
    filters: { ...EMPTY.filters, ...value?.filters },
  };
  const d = v.detail;
  const f = v.filters;
  const setDetail = (patch: Partial<PwaEventsModuleConfig['detail']>) =>
    onChange({ ...v, detail: { ...d, ...patch } });
  const setFilters = (patch: Partial<PwaEventsModuleConfig['filters']>) =>
    onChange({ ...v, filters: { ...f, ...patch } });

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Events"
        description="White-label texts of the events timeline, filters and detail screen. Events data comes from the setup."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="General">
          <PwaField label="Title" value={v.title} onChange={(title) => onChange({ ...v, title })} />
          <PwaField
            label="Search placeholder"
            value={v.searchPlaceholder}
            onChange={(searchPlaceholder) => onChange({ ...v, searchPlaceholder })}
          />
          <PwaField
            label="Location line (supports {client_name})"
            value={v.locationLabel}
            onChange={(locationLabel) => onChange({ ...v, locationLabel })}
          />
          <PwaField
            label="Empty state"
            value={v.emptyState}
            onChange={(emptyState) => onChange({ ...v, emptyState })}
          />
          <PwaField
            label="Distance suffix"
            value={v.distanceSuffix}
            onChange={(distanceSuffix) => onChange({ ...v, distanceSuffix })}
          />
        </PwaGroup>

        <PwaGroup title="Detail">
          <PwaField
            label="Eyebrow"
            value={d.eyebrow}
            onChange={(eyebrow) => setDetail({ eyebrow })}
          />
          <PwaField label="Call" value={d.call} onChange={(call) => setDetail({ call })} />
          <PwaField
            label="Website"
            value={d.website}
            onChange={(website) => setDetail({ website })}
          />
          <PwaField
            label="Add to favorites"
            value={d.addFavorite}
            onChange={(addFavorite) => setDetail({ addFavorite })}
          />
          <PwaField
            label="Remove from favorites"
            value={d.removeFavorite}
            onChange={(removeFavorite) => setDetail({ removeFavorite })}
          />
          <PwaField
            label="See directions"
            value={d.seeDirections}
            onChange={(seeDirections) => setDetail({ seeDirections })}
          />
          <PwaField
            label="Description heading"
            value={d.description}
            onChange={(description) => setDetail({ description })}
          />
          <PwaField
            label="Get tickets button"
            value={d.getTickets}
            onChange={(getTickets) => setDetail({ getTickets })}
          />
        </PwaGroup>

        <PwaGroup title="Filters">
          <PwaField label="Title" value={f.title} onChange={(title) => setFilters({ title })} />
          <PwaField
            label="Features heading"
            value={f.features}
            onChange={(features) => setFilters({ features })}
          />
          <PwaField
            label="Category heading"
            value={f.category}
            onChange={(category) => setFilters({ category })}
          />
          <PwaField
            label="Venue heading"
            value={f.venue}
            onChange={(venue) => setFilters({ venue })}
          />
          <PwaField
            label="Price range heading"
            value={f.priceRange}
            onChange={(priceRange) => setFilters({ priceRange })}
          />
          <PwaField label="Free toggle" value={f.free} onChange={(free) => setFilters({ free })} />
          <PwaField
            label="Clear all"
            value={f.clearAll}
            onChange={(clearAll) => setFilters({ clearAll })}
          />
          <PwaField label="Apply" value={f.apply} onChange={(apply) => setFilters({ apply })} />
        </PwaGroup>
      </div>
    </div>
  );
}
