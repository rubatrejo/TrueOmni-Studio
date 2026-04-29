'use client';

import { useMemo, useState } from 'react';

import {
  type ListingItem,
  type ListingsCatalog,
  type ListingsModule,
  makeBlankListing,
} from '@/lib/studio/schema';

import { CatalogItemForm, type FieldConfig } from './catalog/CatalogItemForm';
import { CatalogItemPanel } from './catalog/CatalogItemPanel';
import { CatalogList } from './catalog/CatalogList';
import { CatalogToolbar } from './catalog/CatalogToolbar';
import { ImageUrlField } from './catalog/ImageUrlField';
import { TaxonomyEditor } from './catalog/TaxonomyEditor';

const TABS: { key: keyof ListingsModule; label: string }[] = [
  { key: 'restaurants', label: 'Restaurants' },
  { key: 'thingsToDo', label: 'Things to Do' },
  { key: 'stay', label: 'Stay' },
];

interface ListingsEditorProps {
  value: ListingsModule;
  onChange: (next: ListingsModule) => void;
}

export function ListingsEditor({ value, onChange }: ListingsEditorProps) {
  const [tab, setTab] = useState<keyof ListingsModule>('restaurants');
  const catalog = value[tab];

  const updateCatalog = (patch: Partial<ListingsCatalog>) => {
    onChange({ ...value, [tab]: { ...catalog, ...patch } });
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="font-display text-[20px] font-semibold text-zinc-900 dark:text-zinc-100">
          Listings
        </h2>
        <p className="text-[12px] text-zinc-500">
          Three catalogs under one home tile group: places to eat, things to do, and stays.
        </p>
      </header>

      <div className="flex gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/40">
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          const count = value[key]?.listings.length ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 rounded px-2 py-1.5 text-[12px] font-medium transition ${
                active
                  ? 'bg-sky-500/20 text-sky-700 dark:text-sky-200'
                  : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200'
              }`}
            >
              {label}
              <span className="ml-1.5 font-mono text-[10px] text-zinc-500">{count}</span>
            </button>
          );
        })}
      </div>

      <ListingsCatalogEditor
        key={tab as string}
        catalog={catalog}
        onChange={updateCatalog}
      />
    </div>
  );
}

function ListingsCatalogEditor({
  catalog,
  onChange,
}: {
  catalog: ListingsCatalog;
  onChange: (patch: Partial<ListingsCatalog>) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const editingItem = useMemo(
    () =>
      editingSlug ? catalog.listings.find((l) => l.slug === editingSlug) ?? null : null,
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
    onChange({ listings: [item, ...catalog.listings] });
    setEditingSlug(item.slug);
  };

  const handleReorder = (next: ListingItem[]) => {
    const visibleSet = new Set(next.map((i) => i.slug));
    const hidden = catalog.listings.filter((i) => !visibleSet.has(i.slug));
    onChange({ listings: [...next, ...hidden] });
  };

  const handleItemChange = (slug: string, patch: Partial<ListingItem>) =>
    onChange({
      listings: catalog.listings.map((l) =>
        l.slug === slug ? { ...l, ...patch } : l,
      ),
    });

  const handleItemDelete = (slug: string) => {
    onChange({ listings: catalog.listings.filter((l) => l.slug !== slug) });
    if (editingSlug === slug) setEditingSlug(null);
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
    onChange({ listings: next });
  };

  // Edit-mode (full-screen takeover dentro del editor pane).
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
      { kind: 'text', key: 'reserveUrl', label: 'Reserve URL', helpText: 'Optional — used for the "Reserve now" CTA.' },
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

  // List-mode (default).
  return (
    <section className="space-y-4">
      <ImageUrlField
        label="Hero image"
        value={catalog.heroImage}
        onChange={(next) => onChange({ heroImage: next ?? '' })}
        helpText="Top hero shown above the listings grid."
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TaxonomyEditor
          label="Subcategories"
          items={catalog.subcategories}
          onChange={(next) => onChange({ subcategories: next })}
          getUsage={(item) =>
            catalog.listings.filter((l) => l.subcategory === item).length
          }
        />
        <TaxonomyEditor
          label="Features"
          items={catalog.features}
          onChange={(next) => onChange({ features: next })}
          getUsage={(item) =>
            catalog.listings.filter((l) => l.features.includes(item)).length
          }
        />
      </div>

      <CatalogToolbar
        search={search}
        onSearchChange={setSearch}
        onAdd={handleAdd}
        addLabel="Add listing"
        filter={filter}
        onFilterChange={setFilter}
        filterOptions={catalog.subcategories.map((s) => ({ value: s, label: s }))}
        filterPlaceholder="All subcategories"
        count={catalog.listings.length}
      />

      <CatalogList<ListingItem>
        items={visible}
        onReorder={handleReorder}
        onItemDelete={handleItemDelete}
        onItemDuplicate={handleItemDuplicate}
        onItemSelect={setEditingSlug}
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
