'use client';

import type { PwaMapModuleConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

/**
 * Editor del módulo "Map" de la PWA (`PwaMapScreen`): list+map agregado sobre
 * varios módulos del kiosk. Edita los textos white-label de `PwaMapModuleConfig`
 * y la etiqueta (`label`) de cada categoría agregada; la fuente (`source`) y la
 * `key` de cada categoría vienen del setup y no se tocan. El detalle reutiliza el
 * texto del módulo de origen, no de Map.
 */

const EMPTY: PwaMapModuleConfig = {
  title: '',
  tabs: { listings: '', map: '' },
  resultsLabel: '',
  distanceSuffix: '',
  allLabel: '',
  categories: [],
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

export function MapModuleEditor({
  value,
  onChange,
}: {
  value: PwaMapModuleConfig | undefined;
  onChange: (next: PwaMapModuleConfig) => void;
}) {
  const v: PwaMapModuleConfig = {
    ...EMPTY,
    ...value,
    tabs: { ...EMPTY.tabs, ...value?.tabs },
    categories: value?.categories ?? [],
    filters: { ...EMPTY.filters, ...value?.filters },
  };
  const f = v.filters;
  const setFilters = (patch: Partial<PwaMapModuleConfig['filters']>) =>
    onChange({ ...v, filters: { ...f, ...patch } });
  const setCategoryLabel = (i: number, label: string) =>
    onChange({
      ...v,
      categories: v.categories.map((c, idx) => (idx === i ? { ...c, label } : c)),
    });

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Map"
        description="White-label texts of the aggregated map (tabs, results, filters) and the label of each category chip. Listings come from their source modules."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="General">
          <PwaField label="Title" value={v.title} onChange={(title) => onChange({ ...v, title })} />
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
            label="All chip label"
            value={v.allLabel}
            onChange={(allLabel) => onChange({ ...v, allLabel })}
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

        {v.categories.length > 0 ? (
          <PwaGroup title="Category chips">
            {v.categories.map((c, i) => (
              <PwaField
                key={c.key}
                label={`Chip · ${c.source}`}
                value={c.label}
                onChange={(label) => setCategoryLabel(i, label)}
              />
            ))}
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
