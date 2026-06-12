'use client';

import { ImageIcon, Plus, X } from 'lucide-react';
import Link from 'next/link';

import type { PwaListingCategory, PwaListingsModuleConfig } from '@/lib/config';

import { ImageUrlField } from '../../../_components/catalog/ImageUrlField';

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
  slug,
  value,
  onChange,
}: {
  title: string;
  /** Slug del cliente para el deeplink a Kiosk → Listings (fotos compartidas). */
  slug: string;
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

  // Tiles del grid de categorías (foto + label). `subcategory` (opcional) es el
  // nombre de la sub-categoría del kiosk a la que filtra la lista al tocar la
  // tile; vacío = lista completa.
  const setCategory = (idx: number, patch: Partial<PwaListingCategory>) =>
    onChange({
      ...v,
      categories: v.categories.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    });
  const removeCategory = (idx: number) =>
    onChange({ ...v, categories: v.categories.filter((_, i) => i !== idx) });
  const addCategory = () => {
    const key = `category-${v.categories.length + 1}`;
    onChange({ ...v, categories: [...v.categories, { key, label: '', image: '' }] });
  };

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

        <PwaGroup title="Categories (grid tiles)">
          <div className="flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50/70 p-2.5 text-[11.5px] leading-relaxed text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300">
            <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              The grid shows the kiosk subcategories and their photos when the module has any. Edit
              those shared photos in{' '}
              <Link
                href={`/studio/${slug}/kiosk`}
                className="font-semibold underline underline-offset-2 hover:text-sky-600"
              >
                Kiosk → Listings
              </Link>
              . The categories below are a fallback for modules without subcategories.
            </p>
          </div>
          {v.categories.length === 0 ? (
            <p className="text-[11px] italic text-zinc-500">No categories yet.</p>
          ) : (
            <div className="space-y-3">
              {v.categories.map((c, idx) => (
                <div
                  key={c.key}
                  className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10.5px] text-zinc-400">{c.key}</span>
                    <button
                      type="button"
                      onClick={() => removeCategory(idx)}
                      aria-label={`Remove ${c.label || c.key}`}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <PwaField
                    label="Label"
                    value={c.label}
                    onChange={(label) => setCategory(idx, { label })}
                  />
                  <ImageUrlField
                    label="Tile photo"
                    value={c.image}
                    onChange={(image) => setCategory(idx, { image: image ?? '' })}
                  />
                  <PwaField
                    label="Filters to subcategory"
                    value={c.subcategory ?? ''}
                    onChange={(subcategory) => setCategory(idx, { subcategory })}
                  />
                  <p className="text-[11px] text-zinc-500">
                    Kiosk subcategory name this tile filters to (must match exactly). Empty = full
                    list.
                  </p>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addCategory}
            className="flex items-center gap-1.5 rounded-md bg-sky-500/15 px-2.5 py-1.5 text-[12px] font-medium text-sky-600 transition hover:bg-sky-500/25 dark:text-sky-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Add category
          </button>
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
