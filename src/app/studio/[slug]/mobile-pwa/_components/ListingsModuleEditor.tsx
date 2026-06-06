'use client';

import type { PwaListingsModuleConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaOptionList, PwaPanelHeader } from './pwa-ui';

/**
 * Editor genérico de un módulo "listings" de la PWA (Restaurants, Places to Stay,
 * Things to Do, Trails) — todos comparten `PwaListingsModuleConfig`. Edita los
 * textos white-label de las pantallas grid / list / filtros / detalle. La data
 * (categorías, listings, imágenes) viene del setup y no se edita aquí. Los
 * campos opcionales del detalle (`menu` / `bookNow` / `openDiningGuide`) y el
 * popup de menú solo se muestran si el módulo los trae en su seed.
 */

const EMPTY: PwaListingsModuleConfig = {
  title: '',
  searchPlaceholder: '',
  resultsLabel: '',
  distanceSuffix: '',
  openUntilPrefix: '',
  tabs: { listings: '', map: '' },
  categories: [],
  detail: {
    eyebrow: '',
    call: '',
    website: '',
    addFavorite: '',
    removeFavorite: '',
    seeDirections: '',
    description: '',
    openNowUntil: '',
    moreHours: '',
  },
  businessHours: { title: '', close: '', days: [] },
  filters: {
    title: '',
    features: '',
    category: '',
    priceRange: '',
    availability: '',
    openNow: '',
    clearAll: '',
    apply: '',
  },
};

export function ListingsModuleEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: PwaListingsModuleConfig | undefined;
  onChange: (next: PwaListingsModuleConfig) => void;
}) {
  const v: PwaListingsModuleConfig = {
    ...EMPTY,
    ...value,
    tabs: { ...EMPTY.tabs, ...value?.tabs },
    categories: value?.categories ?? [],
    detail: { ...EMPTY.detail, ...value?.detail },
    businessHours: {
      ...EMPTY.businessHours,
      ...value?.businessHours,
      days: value?.businessHours?.days ?? [],
    },
    filters: { ...EMPTY.filters, ...value?.filters },
  };

  const d = v.detail;
  const f = v.filters;
  const setDetail = (patch: Partial<PwaListingsModuleConfig['detail']>) =>
    onChange({ ...v, detail: { ...d, ...patch } });
  const setFilters = (patch: Partial<PwaListingsModuleConfig['filters']>) =>
    onChange({ ...v, filters: { ...f, ...patch } });

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title={title}
        description="White-label texts of the grid, list, filters and detail screens. Listings data comes from the setup."
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
            label="Results label (supports {count})"
            value={v.resultsLabel}
            onChange={(resultsLabel) => onChange({ ...v, resultsLabel })}
          />
          <PwaField
            label="Distance suffix"
            value={v.distanceSuffix}
            onChange={(distanceSuffix) => onChange({ ...v, distanceSuffix })}
          />
          <PwaField
            label="Open-until prefix"
            value={v.openUntilPrefix}
            onChange={(openUntilPrefix) => onChange({ ...v, openUntilPrefix })}
          />
        </PwaGroup>

        <PwaGroup title="Tabs">
          <PwaField
            label="Listings tab"
            value={v.tabs.listings}
            onChange={(listings) => onChange({ ...v, tabs: { ...v.tabs, listings } })}
          />
          <PwaField
            label="Map tab"
            value={v.tabs.map}
            onChange={(map) => onChange({ ...v, tabs: { ...v.tabs, map } })}
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
            label="Open now until"
            value={d.openNowUntil}
            onChange={(openNowUntil) => setDetail({ openNowUntil })}
          />
          <PwaField
            label="More hours"
            value={d.moreHours}
            onChange={(moreHours) => setDetail({ moreHours })}
          />
          {d.menu !== undefined ? (
            <PwaField label="Menu button" value={d.menu} onChange={(menu) => setDetail({ menu })} />
          ) : null}
          {d.bookNow !== undefined ? (
            <PwaField
              label="Book now button"
              value={d.bookNow}
              onChange={(bookNow) => setDetail({ bookNow })}
            />
          ) : null}
          {d.openDiningGuide !== undefined ? (
            <PwaField
              label="Open dining guide button"
              value={d.openDiningGuide}
              onChange={(openDiningGuide) => setDetail({ openDiningGuide })}
            />
          ) : null}
        </PwaGroup>

        <PwaGroup title="Business hours">
          <PwaField
            label="Title"
            value={v.businessHours.title}
            onChange={(t) => onChange({ ...v, businessHours: { ...v.businessHours, title: t } })}
          />
          <PwaField
            label="Closed label"
            value={v.businessHours.close}
            onChange={(close) => onChange({ ...v, businessHours: { ...v.businessHours, close } })}
          />
          <PwaOptionList
            label="Day"
            options={v.businessHours.days}
            onChange={(days) => onChange({ ...v, businessHours: { ...v.businessHours, days } })}
          />
        </PwaGroup>

        {v.menu !== undefined ? (
          <PwaGroup title="Menu popup">
            <PwaField
              label="Close button"
              value={v.menu.close}
              onChange={(close) => onChange({ ...v, menu: { ...v.menu, close } })}
            />
          </PwaGroup>
        ) : null}

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
            label="Price range heading"
            value={f.priceRange}
            onChange={(priceRange) => setFilters({ priceRange })}
          />
          <PwaField
            label="Availability heading"
            value={f.availability}
            onChange={(availability) => setFilters({ availability })}
          />
          <PwaField
            label="Open now"
            value={f.openNow}
            onChange={(openNow) => setFilters({ openNow })}
          />
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
