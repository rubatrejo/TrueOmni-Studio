'use client';

import { Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { ImportMode, ImportStats } from '@/app/studio/_lib/import-helpers';
import { type EventItem, type EventsModule, makeBlankEvent } from '@/lib/studio/schema';

import { type AiSuggestedItem } from '../_lib/api-client';

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

interface EventsEditorProps {
  value: EventsModule;
  onChange: (next: EventsModule) => void;
  /** Location del kiosk para AI suggest (#26 audit). */
  kioskLocation?: string;
}

export function EventsEditor({ value, onChange, kioskLocation }: EventsEditorProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [lastImport, setLastImport] = useState<ImportStats | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const handleImport = (items: EventItem[], mode: ImportMode, stats: ImportStats) => {
    const nextEvents = mode === 'replace' ? items : upsertBySlug(value.events, items);
    onChange({
      ...value,
      events: nextEvents,
      categories: mergeTaxonomy(value.categories, items, (i) => i.category),
      venues: mergeTaxonomy(value.venues, items, (i) => i.venue),
      features: mergeTaxonomy(value.features, items, (i) => i.features),
    });
    setLastImport(stats);
  };

  const handleExport = (format: 'csv' | 'json') => {
    downloadCatalog('events', value.events, format, 'events');
  };

  const editingItem = useMemo(
    () => (editingSlug ? (value.events.find((e) => e.slug === editingSlug) ?? null) : null),
    [editingSlug, value.events],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return value.events.filter((ev) => {
      if (filter && ev.category !== filter) return false;
      if (!q) return true;
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.venue.toLowerCase().includes(q) ||
        ev.category.toLowerCase().includes(q)
      );
    });
  }, [value.events, search, filter]);

  const update = (patch: Partial<EventsModule>) => onChange({ ...value, ...patch });

  const handleAdd = () => {
    const item = makeBlankEvent();
    update({ events: [item, ...value.events] });
    setEditingSlug(item.slug);
  };

  const handleReorder = (next: EventItem[]) => {
    const visibleSet = new Set(next.map((i) => i.slug));
    const hidden = value.events.filter((i) => !visibleSet.has(i.slug));
    update({ events: [...next, ...hidden] });
  };

  const handleItemChange = (slug: string, patch: Partial<EventItem>) =>
    update({
      events: value.events.map((e) => (e.slug === slug ? { ...e, ...patch } : e)),
    });

  const handleItemDelete = (slug: string) => {
    update({ events: value.events.filter((e) => e.slug !== slug) });
    if (editingSlug === slug) setEditingSlug(null);
  };

  const handleItemDuplicate = (slug: string) => {
    const original = value.events.find((e) => e.slug === slug);
    if (!original) return;
    const dup: EventItem = {
      ...original,
      slug: `${original.slug}-copy-${Date.now()}`,
      title: `${original.title} (Copy)`,
    };
    const idx = value.events.findIndex((e) => e.slug === slug);
    const next = value.events.slice();
    next.splice(idx + 1, 0, dup);
    update({ events: next });
  };

  const handleBulkDelete = (slugs: string[]) => {
    const set = new Set(slugs);
    update({ events: value.events.filter((e) => !set.has(e.slug)) });
    if (editingSlug && set.has(editingSlug)) setEditingSlug(null);
  };

  const handleBulkDuplicate = (slugs: string[]) => {
    const set = new Set(slugs);
    const next = value.events.slice();
    // Iteramos sobre el original para duplicar respetando el orden actual.
    let inserted = 0;
    value.events.forEach((event, idx) => {
      if (!set.has(event.slug)) return;
      const dup: EventItem = {
        ...event,
        slug: `${event.slug}-copy-${Date.now()}-${inserted}`,
        title: `${event.title} (Copy)`,
      };
      next.splice(idx + 1 + inserted, 0, dup);
      inserted += 1;
    });
    update({ events: next });
  };

  if (editingItem) {
    const baseFields: FieldConfig<EventItem>[] = [
      { kind: 'text', key: 'title', label: 'Title' },
      { kind: 'text', key: 'slug', label: 'Slug', helpText: 'Lowercase, hyphens.' },
      { kind: 'image', key: 'image', label: 'Cover image' },
      {
        kind: 'taxonomy-pick',
        key: 'category',
        label: 'Category',
        options: value.categories,
      },
      { kind: 'text', key: 'date', label: 'Date', helpText: 'YYYY-MM-DD' },
      { kind: 'text', key: 'startTime', label: 'Start time', helpText: 'HH:MM (24h)' },
      { kind: 'text', key: 'endTime', label: 'End time', helpText: 'HH:MM (24h)' },
      {
        kind: 'taxonomy-pick',
        key: 'venue',
        label: 'Venue',
        options: value.venues,
      },
      {
        kind: 'select',
        key: 'priceMode',
        label: 'Price mode',
        options: [
          { value: 'free', label: 'Free' },
          { value: 'paid', label: 'Paid' },
        ],
      },
      {
        kind: 'taxonomy-pick',
        key: 'features',
        label: 'Features',
        options: value.features,
        multiple: true,
      },
      { kind: 'textarea', key: 'description', label: 'Description', rows: 4 },
      { kind: 'text', key: 'address', label: 'Address' },
      { kind: 'text', key: 'phone', label: 'Phone' },
      { kind: 'text', key: 'website', label: 'Website' },
      {
        kind: 'text',
        key: 'ticketsUrl',
        label: 'Tickets URL',
        helpText: 'Optional — used by the "GET TICKETS" CTA.',
      },
      { kind: 'number', key: 'popularity', label: 'Popularity (0-100)', min: 0, max: 100 },
      { kind: 'latlng', key: 'coords', label: 'Coordinates' },
    ];
    return (
      <CatalogItemPanel
        title={editingItem.title}
        subtitle={`${editingItem.date} · ${editingItem.startTime}–${editingItem.endTime}`}
        onBack={() => setEditingSlug(null)}
        onDelete={() => handleItemDelete(editingItem.slug)}
      >
        <CatalogItemForm<EventItem>
          item={editingItem}
          fields={baseFields}
          onChange={(patch) => handleItemChange(editingItem.slug, patch)}
          footer={
            editingItem.priceMode === 'paid' ? (
              <PricePaidFields
                item={editingItem}
                onChange={(patch) => handleItemChange(editingItem.slug, patch)}
              />
            ) : null
          }
        />
      </CatalogItemPanel>
    );
  }

  return (
    <div className="space-y-4">
      <ImageUrlField
        label="Hero image"
        value={value.heroImage}
        onChange={(next) => update({ heroImage: next ?? '' })}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TaxonomyEditor
          label="Categories"
          items={value.categories}
          onChange={(next) => update({ categories: next })}
          getUsage={(item) => value.events.filter((e) => e.category === item).length}
        />
        <TaxonomyEditor
          label="Venues"
          items={value.venues}
          onChange={(next) => update({ venues: next })}
          getUsage={(item) => value.events.filter((e) => e.venue === item).length}
        />
        <TaxonomyEditor
          label="Features"
          items={value.features}
          onChange={(next) => update({ features: next })}
          getUsage={(item) => value.events.filter((e) => e.features.includes(item)).length}
        />
      </div>

      <CatalogToolbar
        search={search}
        onSearchChange={setSearch}
        onAdd={handleAdd}
        addLabel="Add event"
        onImport={() => setImportOpen(true)}
        onExport={handleExport}
        exportEnabled={value.events.length > 0}
        filter={filter}
        onFilterChange={setFilter}
        filterOptions={value.categories.map((c) => ({ value: c, label: c }))}
        filterPlaceholder="All categories"
        count={value.events.length}
        onAiSuggest={kioskLocation ? () => setAiOpen(true) : undefined}
      />

      <AiSuggestModal
        open={aiOpen}
        kind="events"
        location={kioskLocation ?? ''}
        existingSlugs={value.events.map((e) => e.slug)}
        onClose={() => setAiOpen(false)}
        onConfirm={(items: AiSuggestedItem[]) => {
          // Map AI items to EventItem skeletons. Title/description/address
          // del AI; el resto (date/time/venue/etc.) lo completa el operador.
          const newEvents: EventItem[] = items.map((it) => ({
            ...makeBlankEvent(),
            slug: it.slug,
            title: it.title,
            description: it.description,
            venue: it.address,
            features: it.tags ?? [],
          }));
          onChange({ ...value, events: [...newEvents, ...value.events] });
        }}
      />

      <ImportToast
        stats={lastImport}
        noun={lastImport && lastImport.total === 1 ? 'event' : 'events'}
        onDismiss={() => setLastImport(null)}
      />

      <ImportModal
        open={importOpen}
        kind="events"
        existingItems={value.events}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      <CatalogList<EventItem>
        items={visible}
        onReorder={handleReorder}
        onItemDelete={handleItemDelete}
        onItemDuplicate={handleItemDuplicate}
        onItemsBulkDelete={handleBulkDelete}
        onItemsBulkDuplicate={handleBulkDuplicate}
        itemNoun="event"
        onItemSelect={setEditingSlug}
        emptyState={
          value.events.length === 0 ? (
            <EditorEmptyState
              icon={Calendar}
              headline="No events yet"
              description="Concerts, festivals, exhibitions and recurring activities. Each event becomes a card on the Events tile and can drive ticket conversions."
              primaryAction={{ label: 'Add event', onClick: handleAdd }}
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
                {item.date} · {item.startTime}–{item.endTime} · {item.category || '—'} ·{' '}
                {item.priceMode}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}

function PricePaidFields({
  item,
  onChange,
}: {
  item: EventItem;
  onChange: (patch: Partial<EventItem>) => void;
}) {
  const ticket = item.ticket ?? { priceDisplay: '', purchaseUrl: '' };
  return (
    <div className="space-y-3 rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
      <h5 className="text-[11.5px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">
        Ticket info (paid only)
      </h5>

      <label className="block space-y-1">
        <span className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
          Price band
        </span>
        <select
          value={item.priceBand?.toString() ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            onChange({
              priceBand: raw ? (Number(raw) as 1 | 2 | 3 | 4) : undefined,
            });
          }}
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100"
        >
          <option value="">—</option>
          <option value="1">$</option>
          <option value="2">$$</option>
          <option value="3">$$$</option>
          <option value="4">$$$$</option>
        </select>
      </label>

      <label className="block space-y-1">
        <span className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
          Price display
        </span>
        <input
          type="text"
          value={ticket.priceDisplay}
          placeholder="e.g. $25 or $15–30"
          onChange={(e) => onChange({ ticket: { ...ticket, priceDisplay: e.target.value } })}
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-600"
        />
      </label>

      <label className="block space-y-1">
        <span className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
          Purchase URL
        </span>
        <input
          type="text"
          value={ticket.purchaseUrl}
          placeholder="https://…"
          onChange={(e) => onChange({ ticket: { ...ticket, purchaseUrl: e.target.value } })}
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-600"
        />
      </label>
    </div>
  );
}
