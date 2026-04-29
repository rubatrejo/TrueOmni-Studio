'use client';

import { useMemo, useState } from 'react';

import {
  type EventItem,
  type EventsModule,
  makeBlankEvent,
} from '@/lib/studio/schema';

import { CatalogItemForm, type FieldConfig } from './catalog/CatalogItemForm';
import { CatalogList } from './catalog/CatalogList';
import { CatalogToolbar } from './catalog/CatalogToolbar';
import { ImageUrlField } from './catalog/ImageUrlField';
import { TaxonomyEditor } from './catalog/TaxonomyEditor';

interface EventsEditorProps {
  value: EventsModule;
  onChange: (next: EventsModule) => void;
}

/**
 * Editor del módulo Events. Hero + 2 taxonomies (categories, venues) +
 * lista de eventos con form completo (date, startTime, endTime, etc.).
 */
export function EventsEditor({ value, onChange }: EventsEditorProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

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

  const handleItemDelete = (slug: string) =>
    update({ events: value.events.filter((e) => e.slug !== slug) });

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
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="font-display text-[20px] font-semibold text-zinc-100">Events</h2>
        <p className="text-[12px] text-zinc-500">
          Calendar-based events with date, time, venue, and optional ticket info.
        </p>
      </header>

      <ImageUrlField
        label="Hero image"
        value={value.heroImage}
        onChange={(next) => update({ heroImage: next ?? '' })}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
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
        filter={filter}
        onFilterChange={setFilter}
        filterOptions={value.categories.map((c) => ({ value: c, label: c }))}
        filterPlaceholder="All categories"
        count={value.events.length}
      />

      <CatalogList<EventItem>
        items={visible}
        onReorder={handleReorder}
        onItemChange={handleItemChange}
        onItemDelete={handleItemDelete}
        onItemDuplicate={handleItemDuplicate}
        renderRow={(item) => (
          <div className="flex items-center gap-2">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt=""
                className="h-10 w-10 shrink-0 rounded object-cover ring-1 ring-zinc-800"
              />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded bg-zinc-800 ring-1 ring-zinc-700" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium text-zinc-200">
                {item.title || <span className="italic text-zinc-500">Untitled</span>}
              </div>
              <div className="truncate text-[10.5px] text-zinc-500">
                {item.date} · {item.startTime}–{item.endTime} ·{' '}
                {item.category || '—'} · {item.priceMode}
              </div>
            </div>
          </div>
        )}
        renderForm={(item, onChangeItem) => (
          <CatalogItemForm<EventItem>
            item={item}
            fields={baseFields}
            onChange={onChangeItem}
            footer={
              item.priceMode === 'paid' ? (
                <PricePaidFields item={item} onChange={onChangeItem} />
              ) : null
            }
          />
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
      <div className="flex items-center justify-between">
        <h5 className="text-[11.5px] font-semibold uppercase tracking-wider text-amber-300">
          Ticket info (paid only)
        </h5>
      </div>

      <div className="space-y-1">
        <label className="block text-[12px] font-medium text-zinc-300">Price band</label>
        <select
          value={item.priceBand?.toString() ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            onChange({
              priceBand: raw ? (Number(raw) as 1 | 2 | 3 | 4) : undefined,
            });
          }}
          className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-[12px] text-zinc-100 focus:border-sky-500/60 focus:outline-none"
        >
          <option value="">—</option>
          <option value="1">$</option>
          <option value="2">$$</option>
          <option value="3">$$$</option>
          <option value="4">$$$$</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-[12px] font-medium text-zinc-300">
          Price display
        </label>
        <input
          type="text"
          value={ticket.priceDisplay}
          placeholder="e.g. $25 or $15–30"
          onChange={(e) => onChange({ ticket: { ...ticket, priceDisplay: e.target.value } })}
          className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-[12px] text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500/60 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[12px] font-medium text-zinc-300">Purchase URL</label>
        <input
          type="text"
          value={ticket.purchaseUrl}
          placeholder="https://…"
          onChange={(e) => onChange({ ticket: { ...ticket, purchaseUrl: e.target.value } })}
          className="w-full rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1.5 text-[12px] text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500/60 focus:outline-none"
        />
      </div>
    </div>
  );
}
