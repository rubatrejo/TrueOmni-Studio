'use client';

import { Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { ImportMode, ImportStats } from '@/app/studio/_lib/import-helpers';
import {
  type ListingItem,
  type ListingsCatalog,
  type ListingsCatalogEntry,
  type ListingsModule,
  makeBlankListing,
} from '@/lib/studio/schema';

import { type AiSuggestKind, type AiSuggestedItem } from '../_lib/api-client';

import { AiSuggestModal } from './AiSuggestModal';
import { CatalogItemForm, type FieldConfig } from './catalog/CatalogItemForm';
import { CatalogItemPanel } from './catalog/CatalogItemPanel';
import { CatalogList } from './catalog/CatalogList';
import { CatalogToolbar } from './catalog/CatalogToolbar';
import { downloadCatalog } from './catalog/export-utils';
import { ImageUrlField } from './catalog/ImageUrlField';
import { mergeTaxonomy, upsertBySlug } from './catalog/import-utils';
import { ImportModal } from './catalog/ImportModal';
import { ImportToast } from './catalog/ImportToast';
import { TaxonomyEditor } from './catalog/TaxonomyEditor';
import { EditorEmptyState } from './EditorEmptyState';
import { useToast } from './Toast';

interface ListingsEditorProps {
  value: ListingsModule;
  onChange: (next: ListingsModule) => void;
  /** Location del kiosk ("Davenport, FL") para AI suggest (#26). */
  kioskLocation: string;
}

/**
 * Editor del módulo Listings — sub-tabs dinámicos uno por entry del array.
 * Las entries se pueden duplicar / borrar / añadir desde la tab Modules.
 */
export function ListingsEditor({ value, onChange, kioskLocation }: ListingsEditorProps) {
  const [activeKey, setActiveKey] = useState<string>(value[0]?.key ?? '');

  // Si el active key se borra desde Modules, saltamos al primero disponible.
  useEffect(() => {
    if (!value.find((e) => e.key === activeKey) && value.length > 0) {
      setActiveKey(value[0].key);
    }
  }, [value, activeKey]);

  if (value.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/20">
        <p className="text-[12px] italic text-zinc-500">
          No listing modules yet. Add one from the <strong>Modules</strong> tab (Listing modules
          section) to start filling its catalog.
        </p>
      </div>
    );
  }

  const activeIdx = Math.max(
    0,
    value.findIndex((e) => e.key === activeKey),
  );
  const activeEntry = value[activeIdx];

  const updateEntry = (patch: Partial<ListingsCatalogEntry>) => {
    onChange(value.map((e, i) => (i === activeIdx ? { ...e, ...patch } : e)));
  };

  const updateCatalog = (patch: Partial<ListingsCatalog>) => {
    updateEntry({ catalog: { ...activeEntry.catalog, ...patch } });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/40">
        {value.map((entry) => {
          const active = entry.key === activeKey;
          const count = entry.catalog.listings.length;
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => setActiveKey(entry.key)}
              className={`min-w-fit flex-1 rounded px-2 py-1.5 text-[12px] font-medium transition ${
                active
                  ? 'bg-sky-500/20 text-sky-700 dark:text-sky-200'
                  : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200'
              } ${entry.enabled ? '' : 'opacity-50'}`}
              title={entry.enabled ? entry.label : `${entry.label} (disabled)`}
            >
              {entry.label}
              <span className="ml-1.5 font-mono text-[10px] text-zinc-500">{count}</span>
            </button>
          );
        })}
      </div>

      <ListingsCatalogEditor
        key={activeEntry.key}
        entry={activeEntry}
        onEntryChange={updateEntry}
        onCatalogChange={updateCatalog}
        kioskLocation={kioskLocation}
      />
    </div>
  );
}

function ListingsCatalogEditor({
  entry,
  onEntryChange,
  onCatalogChange,
  kioskLocation,
}: {
  entry: ListingsCatalogEntry;
  onEntryChange: (patch: Partial<ListingsCatalogEntry>) => void;
  onCatalogChange: (patch: Partial<ListingsCatalog>) => void;
  kioskLocation: string;
}) {
  const { show } = useToast();
  const catalog = entry.catalog;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [lastImport, setLastImport] = useState<ImportStats | null>(null);

  const handleImport = (items: ListingItem[], mode: ImportMode, stats: ImportStats) => {
    const nextListings = mode === 'replace' ? items : upsertBySlug(catalog.listings, items);
    onCatalogChange({
      listings: nextListings,
      subcategories: mergeTaxonomy(catalog.subcategories, items, (i) => i.subcategory),
      features: mergeTaxonomy(catalog.features, items, (i) => i.features),
    });
    setLastImport(stats);
  };

  const handleExport = (format: 'csv' | 'json') => {
    downloadCatalog('listings', catalog.listings, format, entry.key);
  };

  const editingItem = useMemo(
    () => (editingSlug ? (catalog.listings.find((l) => l.slug === editingSlug) ?? null) : null),
    [editingSlug, catalog.listings],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.listings.filter((l) => {
      if (filter && l.subcategory !== filter) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.subcategory.toLowerCase().includes(q)
      );
    });
  }, [catalog.listings, search, filter]);

  const handleAdd = () => {
    const item = makeBlankListing();
    onCatalogChange({ listings: [item, ...catalog.listings] });
    setEditingSlug(item.slug);
  };

  // AI suggest (#26 audit) — el kind se infiere del entry.key activo. Si el
  // operador customizó la key del catálogo (eg. 'food-drink' en lugar de
  // 'restaurants'), caemos a 'things-to-do' como default seguro.
  const [aiOpen, setAiOpen] = useState(false);
  const aiKind: AiSuggestKind = (() => {
    const k = entry.key.toLowerCase();
    if (k === 'restaurants' || k === 'food-drink' || k === 'food') return 'restaurants';
    if (k === 'stay' || k === 'hotels' || k === 'lodging') return 'stay';
    return 'things-to-do';
  })();
  const handleAiAccept = (items: AiSuggestedItem[]) => {
    const newListings: ListingItem[] = items.map((it) => ({
      ...makeBlankListing(),
      slug: it.slug,
      title: it.title,
      description: it.description,
      address: it.address,
      features: it.tags ?? [],
    }));
    onCatalogChange({ listings: [...newListings, ...catalog.listings] });
  };

  const handleReorder = (next: ListingItem[]) => {
    const visibleSet = new Set(next.map((i) => i.slug));
    const hidden = catalog.listings.filter((i) => !visibleSet.has(i.slug));
    onCatalogChange({ listings: [...next, ...hidden] });
  };

  const handleItemChange = (slug: string, patch: Partial<ListingItem>) =>
    onCatalogChange({
      listings: catalog.listings.map((l) => (l.slug === slug ? { ...l, ...patch } : l)),
    });

  const handleItemDelete = (slug: string) => {
    // F-KIOSK-9: delete reversible — guardamos el array previo y ofrecemos Undo.
    const prevListings = catalog.listings;
    const removed = prevListings.find((l) => l.slug === slug);
    onCatalogChange({ listings: prevListings.filter((l) => l.slug !== slug) });
    if (editingSlug === slug) setEditingSlug(null);
    show(`Deleted "${removed?.title ?? slug}"`, {
      variant: 'info',
      durationMs: 6000,
      action: { label: 'Undo', onClick: () => onCatalogChange({ listings: prevListings }) },
    });
  };

  const handleItemDuplicate = (slug: string) => {
    const original = catalog.listings.find((l) => l.slug === slug);
    if (!original) return;
    const dup: ListingItem = {
      ...original,
      slug: `${original.slug}-copy-${Date.now()}`,
      title: `${original.title} (Copy)`,
    };
    const idx = catalog.listings.findIndex((l) => l.slug === slug);
    const next = catalog.listings.slice();
    next.splice(idx + 1, 0, dup);
    onCatalogChange({ listings: next });
  };

  const handleBulkDelete = (slugs: string[]) => {
    if (slugs.length === 0) return;
    // F-KIOSK-9: confirm para bulk grande (≥3) + Undo siempre (delete reversible).
    if (
      slugs.length >= 3 &&
      !window.confirm(`Delete ${slugs.length} listings? You can undo right after.`)
    ) {
      return;
    }
    const prevListings = catalog.listings;
    const set = new Set(slugs);
    onCatalogChange({ listings: prevListings.filter((l) => !set.has(l.slug)) });
    if (editingSlug && set.has(editingSlug)) setEditingSlug(null);
    show(`Deleted ${slugs.length} listing${slugs.length === 1 ? '' : 's'}`, {
      variant: 'info',
      durationMs: 6000,
      action: { label: 'Undo', onClick: () => onCatalogChange({ listings: prevListings }) },
    });
  };

  const handleBulkDuplicate = (slugs: string[]) => {
    const set = new Set(slugs);
    const next = catalog.listings.slice();
    let inserted = 0;
    catalog.listings.forEach((listing, idx) => {
      if (!set.has(listing.slug)) return;
      const dup: ListingItem = {
        ...listing,
        slug: `${listing.slug}-copy-${Date.now()}-${inserted}`,
        title: `${listing.title} (Copy)`,
      };
      next.splice(idx + 1 + inserted, 0, dup);
      inserted += 1;
    });
    onCatalogChange({ listings: next });
  };

  if (editingItem) {
    const fields: FieldConfig<ListingItem>[] = [
      { kind: 'text', key: 'title', label: 'Title' },
      { kind: 'text', key: 'slug', label: 'Slug', helpText: 'Lowercase, hyphens. Used in URLs.' },
      { kind: 'image', key: 'image', label: 'Cover image' },
      {
        kind: 'taxonomy-pick',
        key: 'subcategory',
        label: 'Subcategory',
        options: catalog.subcategories,
      },
      {
        kind: 'taxonomy-pick',
        key: 'features',
        label: 'Features',
        options: catalog.features,
        multiple: true,
      },
      { kind: 'textarea', key: 'description', label: 'Description', rows: 4 },
      { kind: 'text', key: 'address', label: 'Address' },
      { kind: 'text', key: 'phone', label: 'Phone' },
      { kind: 'text', key: 'website', label: 'Website' },
      {
        kind: 'text',
        key: 'reserveUrl',
        label: 'Reserve URL',
        helpText: 'Optional — used for the "Reserve now" CTA.',
      },
      { kind: 'text', key: 'hours', label: 'Hours', helpText: 'e.g. 7 am – 11 pm' },
      {
        kind: 'select',
        key: 'priceRange',
        label: 'Price range',
        options: [
          { value: '1', label: '$' },
          { value: '2', label: '$$' },
          { value: '3', label: '$$$' },
          { value: '4', label: '$$$$' },
        ],
      },
      { kind: 'number', key: 'popularity', label: 'Popularity (0-100)', min: 0, max: 100 },
      { kind: 'latlng', key: 'coords', label: 'Coordinates' },
    ];
    return (
      <CatalogItemPanel
        title={editingItem.title}
        subtitle={editingItem.slug}
        onBack={() => setEditingSlug(null)}
        onDelete={() => handleItemDelete(editingItem.slug)}
      >
        <CatalogItemForm<ListingItem>
          item={editingItem}
          fields={fields}
          onChange={(patch) => {
            if (patch.priceRange !== undefined) {
              const num = Number(patch.priceRange) as 1 | 2 | 3 | 4;
              handleItemChange(editingItem.slug, { ...patch, priceRange: num });
            } else {
              handleItemChange(editingItem.slug, patch);
            }
          }}
        />
      </CatalogItemPanel>
    );
  }

  return (
    <section className="space-y-4">
      <label className="block space-y-1">
        <span className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
          Module label
        </span>
        <input
          type="text"
          value={entry.label}
          onChange={(e) => onEntryChange({ label: e.target.value })}
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100"
        />
      </label>

      <ImageUrlField
        label="Hero image"
        value={catalog.heroImage}
        onChange={(next) => onCatalogChange({ heroImage: next ?? '' })}
        helpText="Top hero shown above the listings grid."
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TaxonomyEditor
          label="Subcategories"
          items={catalog.subcategories}
          onChange={(next) => onCatalogChange({ subcategories: next })}
          getUsage={(item) => catalog.listings.filter((l) => l.subcategory === item).length}
        />
        <TaxonomyEditor
          label="Features"
          items={catalog.features}
          onChange={(next) => onCatalogChange({ features: next })}
          getUsage={(item) => catalog.listings.filter((l) => l.features.includes(item)).length}
        />
      </div>

      <CatalogToolbar
        search={search}
        onSearchChange={setSearch}
        onAdd={handleAdd}
        addLabel="Add listing"
        onImport={() => setImportOpen(true)}
        onExport={handleExport}
        exportEnabled={catalog.listings.length > 0}
        filter={filter}
        onFilterChange={setFilter}
        filterOptions={catalog.subcategories.map((s) => ({ value: s, label: s }))}
        filterPlaceholder="All subcategories"
        count={catalog.listings.length}
        onAiSuggest={() => setAiOpen(true)}
      />

      <AiSuggestModal
        open={aiOpen}
        kind={aiKind}
        location={kioskLocation}
        existingSlugs={catalog.listings.map((l) => l.slug)}
        onClose={() => setAiOpen(false)}
        onConfirm={handleAiAccept}
      />

      <ImportToast
        stats={lastImport}
        noun={lastImport && lastImport.total === 1 ? 'listing' : 'listings'}
        onDismiss={() => setLastImport(null)}
      />

      <ImportModal
        open={importOpen}
        kind="listings"
        existingItems={catalog.listings}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      <CatalogList<ListingItem>
        items={visible}
        onReorder={handleReorder}
        onItemDelete={handleItemDelete}
        onItemDuplicate={handleItemDuplicate}
        onItemsBulkDelete={handleBulkDelete}
        onItemsBulkDuplicate={handleBulkDuplicate}
        itemNoun="listing"
        onItemSelect={setEditingSlug}
        emptyState={
          catalog.listings.length === 0 ? (
            <EditorEmptyState
              icon={Sparkles}
              headline={`No ${entry.label.toLowerCase()} yet`}
              description="Listings power the dynamic Home tiles like Food & Drink, Things to Do or Stay. Each listing has a hero image, description, hours and an optional reservation CTA."
              primaryAction={{ label: 'Add listing', onClick: handleAdd }}
            />
          ) : undefined
        }
        renderRow={(item) => (
          <div className="flex items-center gap-2">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt=""
                className="h-10 w-10 shrink-0 rounded object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
              />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium text-zinc-800 dark:text-zinc-200">
                {item.title || <span className="italic text-zinc-500">Untitled</span>}
              </div>
              <div className="truncate text-[10.5px] text-zinc-500">
                {item.subcategory || '—'}
                {item.features.length > 0 ? ` · ${item.features.length} features` : ''}
              </div>
            </div>
          </div>
        )}
      />
    </section>
  );
}
