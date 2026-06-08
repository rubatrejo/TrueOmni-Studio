'use client';

import type { PwaTrailsModuleConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

/**
 * Editor del módulo "Trails" de la PWA. Trails comparte el flujo de 3 niveles de
 * los listings (grid → lista+mapa → detalle) pero NO su tipo: tiene su propio
 * `PwaTrailsModuleConfig` con el panel "Considerations", los tabs del mapa del
 * detalle (mapa normal / ruta) y filtros por dificultad / tipo de ruta en vez de
 * categoría / precio / disponibilidad. Por eso vive aparte del
 * `ListingsModuleEditor` genérico. Edita solo los textos white-label; las
 * categorías, los trails, las imágenes y el GeoJSON vienen del setup.
 */

const EMPTY: PwaTrailsModuleConfig = {
  title: '',
  searchPlaceholder: '',
  resultsLabel: '',
  distanceSuffix: '',
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
    mapTabs: { default: '', trail: '' },
    considerations: {
      title: '',
      distance: '',
      difficulty: '',
      duration: '',
      elevation: '',
      type: '',
      dogFriendly: '',
      dogYes: '',
      dogNo: '',
    },
  },
  filters: {
    title: '',
    features: '',
    difficulty: '',
    trailType: '',
    clearAll: '',
    apply: '',
  },
};

export function TrailsModuleEditor({
  value,
  onChange,
}: {
  value: PwaTrailsModuleConfig | undefined;
  onChange: (next: PwaTrailsModuleConfig) => void;
}) {
  const v: PwaTrailsModuleConfig = {
    ...EMPTY,
    ...value,
    tabs: { ...EMPTY.tabs, ...value?.tabs },
    categories: value?.categories ?? [],
    detail: {
      ...EMPTY.detail,
      ...value?.detail,
      mapTabs: { ...EMPTY.detail.mapTabs, ...value?.detail?.mapTabs },
      considerations: { ...EMPTY.detail.considerations, ...value?.detail?.considerations },
    },
    filters: { ...EMPTY.filters, ...value?.filters },
  };

  const d = v.detail;
  const c = d.considerations;
  const f = v.filters;
  const setDetail = (patch: Partial<PwaTrailsModuleConfig['detail']>) =>
    onChange({ ...v, detail: { ...d, ...patch } });
  const setMapTabs = (patch: Partial<PwaTrailsModuleConfig['detail']['mapTabs']>) =>
    onChange({ ...v, detail: { ...d, mapTabs: { ...d.mapTabs, ...patch } } });
  const setConsiderations = (patch: Partial<PwaTrailsModuleConfig['detail']['considerations']>) =>
    onChange({ ...v, detail: { ...d, considerations: { ...c, ...patch } } });
  const setFilters = (patch: Partial<PwaTrailsModuleConfig['filters']>) =>
    onChange({ ...v, filters: { ...f, ...patch } });

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Trails"
        description="White-label texts of the grid, list, filters and detail screens (including the Considerations panel). Trails data comes from the setup."
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
        </PwaGroup>

        <PwaGroup title="Detail · Map tabs">
          <PwaField
            label="Default map tab"
            value={d.mapTabs.default}
            onChange={(value) => setMapTabs({ default: value })}
          />
          <PwaField
            label="Trail map tab"
            value={d.mapTabs.trail}
            onChange={(trail) => setMapTabs({ trail })}
          />
        </PwaGroup>

        <PwaGroup title="Detail · Considerations">
          <PwaField
            label="Panel title"
            value={c.title}
            onChange={(title) => setConsiderations({ title })}
          />
          <PwaField
            label="Distance"
            value={c.distance}
            onChange={(distance) => setConsiderations({ distance })}
          />
          <PwaField
            label="Difficulty"
            value={c.difficulty}
            onChange={(difficulty) => setConsiderations({ difficulty })}
          />
          <PwaField
            label="Duration"
            value={c.duration}
            onChange={(duration) => setConsiderations({ duration })}
          />
          <PwaField
            label="Elevation gain"
            value={c.elevation}
            onChange={(elevation) => setConsiderations({ elevation })}
          />
          <PwaField
            label="Trail type"
            value={c.type}
            onChange={(type) => setConsiderations({ type })}
          />
          <PwaField
            label="Dog friendly"
            value={c.dogFriendly}
            onChange={(dogFriendly) => setConsiderations({ dogFriendly })}
          />
          <PwaField
            label="Dog friendly · Yes"
            value={c.dogYes}
            onChange={(dogYes) => setConsiderations({ dogYes })}
          />
          <PwaField
            label="Dog friendly · No"
            value={c.dogNo}
            onChange={(dogNo) => setConsiderations({ dogNo })}
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
            label="Difficulty heading"
            value={f.difficulty}
            onChange={(difficulty) => setFilters({ difficulty })}
          />
          <PwaField
            label="Trail type heading"
            value={f.trailType}
            onChange={(trailType) => setFilters({ trailType })}
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
