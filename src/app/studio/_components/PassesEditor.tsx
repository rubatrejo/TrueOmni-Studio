'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  makeBlankPass,
  makeBlankPassActivity,
  type PassActivity,
  type PassItem,
  type PassesModule,
} from '@/lib/studio/schema';

import { CatalogItemForm, type FieldConfig } from './catalog/CatalogItemForm';
import { CatalogItemPanel } from './catalog/CatalogItemPanel';
import { CatalogList } from './catalog/CatalogList';
import { CatalogToolbar } from './catalog/CatalogToolbar';
import { ImageUrlField } from './catalog/ImageUrlField';

interface PassesEditorProps {
  value: PassesModule;
  onChange: (next: PassesModule) => void;
}

export function PassesEditor({ value, onChange }: PassesEditorProps) {
  const [search, setSearch] = useState('');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const editingItem = useMemo(
    () =>
      editingSlug ? value.passes.find((p) => p.slug === editingSlug) ?? null : null,
    [editingSlug, value.passes],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return value.passes.filter((p) => {
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.tagline ?? '').toLowerCase().includes(q)
      );
    });
  }, [value.passes, search]);

  const update = (patch: Partial<PassesModule>) => onChange({ ...value, ...patch });

  const handleAdd = () => {
    const item = makeBlankPass();
    update({ passes: [item, ...value.passes] });
    setEditingSlug(item.slug);
  };

  const handleReorder = (next: PassItem[]) => {
    const visibleSet = new Set(next.map((i) => i.slug));
    const hidden = value.passes.filter((i) => !visibleSet.has(i.slug));
    update({ passes: [...next, ...hidden] });
  };

  const handleItemChange = (slug: string, patch: Partial<PassItem>) =>
    update({
      passes: value.passes.map((p) => (p.slug === slug ? { ...p, ...patch } : p)),
    });

  const handleItemDelete = (slug: string) => {
    update({ passes: value.passes.filter((p) => p.slug !== slug) });
    if (editingSlug === slug) setEditingSlug(null);
  };

  const handleItemDuplicate = (slug: string) => {
    const original = value.passes.find((p) => p.slug === slug);
    if (!original) return;
    const dup: PassItem = {
      ...original,
      slug: `${original.slug}-copy-${Date.now()}`,
      title: `${original.title} (Copy)`,
    };
    const idx = value.passes.findIndex((p) => p.slug === slug);
    const next = value.passes.slice();
    next.splice(idx + 1, 0, dup);
    update({ passes: next });
  };

  if (editingItem) {
    const baseFields: FieldConfig<PassItem>[] = [
      { kind: 'text', key: 'title', label: 'Title' },
      { kind: 'text', key: 'slug', label: 'Slug', helpText: 'Lowercase, hyphens.' },
      { kind: 'image', key: 'cover', label: 'Cover image' },
      { kind: 'text', key: 'tagline', label: 'Tagline', helpText: 'Optional short tagline.' },
      {
        kind: 'text',
        key: 'bandwangoUrl',
        label: 'Bandwango URL',
        helpText: 'Used as the QR target in the share modal.',
      },
    ];
    return (
      <CatalogItemPanel
        title={editingItem.title}
        subtitle={editingItem.tagline ?? editingItem.slug}
        onBack={() => setEditingSlug(null)}
        onDelete={() => handleItemDelete(editingItem.slug)}
      >
        <CatalogItemForm<PassItem>
          item={editingItem}
          fields={baseFields}
          onChange={(patch) => handleItemChange(editingItem.slug, patch)}
          footer={
            <PassActivitiesEditor
              activities={editingItem.activities}
              onChange={(next) => handleItemChange(editingItem.slug, { activities: next })}
            />
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

      <ImageUrlField
        label="Module QR logo"
        value={value.qrLogo ?? ''}
        onChange={(next) => update({ qrLogo: next })}
        helpText="Optional logo centered in every pass QR (level H allows ~30% obstruction)."
      />

      <CatalogToolbar
        search={search}
        onSearchChange={setSearch}
        onAdd={handleAdd}
        addLabel="Add pass"
        count={value.passes.length}
      />

      <CatalogList<PassItem>
        items={visible}
        onReorder={handleReorder}
        onItemDelete={handleItemDelete}
        onItemDuplicate={handleItemDuplicate}
        onItemSelect={setEditingSlug}
        renderRow={(item) => (
          <div className="flex items-center gap-2">
            {item.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.cover}
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
                {item.activities.length} activit
                {item.activities.length === 1 ? 'y' : 'ies'}
                {item.tagline ? ` · ${item.tagline}` : ''}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}

function PassActivitiesEditor({
  activities,
  onChange,
}: {
  activities: PassActivity[];
  onChange: (next: PassActivity[]) => void;
}) {
  const handleAdd = () => onChange([...activities, makeBlankPassActivity()]);

  const handleChange = (slug: string, patch: Partial<PassActivity>) =>
    onChange(activities.map((a) => (a.slug === slug ? { ...a, ...patch } : a)));

  const handleDelete = (slug: string) =>
    onChange(activities.filter((a) => a.slug !== slug));

  return (
    <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex items-center justify-between">
        <h5 className="text-[11.5px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          Activities ({activities.length})
        </h5>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 rounded-md bg-sky-500/15 px-2 py-1 text-[11px] font-medium text-sky-700 transition hover:bg-sky-500/25 dark:text-sky-300"
        >
          <Plus className="h-3 w-3" />
          Add activity
        </button>
      </div>

      {activities.length === 0 ? (
        <p className="text-[11px] italic text-zinc-500">
          No activities yet. Activities appear in the pass detail screen.
        </p>
      ) : (
        <ul className="space-y-2">
          {activities.map((a) => (
            <li
              key={a.slug}
              className="space-y-2 rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800/80 dark:bg-zinc-900/40"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={a.title}
                  onChange={(e) => handleChange(a.slug, { title: e.target.value })}
                  placeholder="Activity title"
                  className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(a.slug)}
                  aria-label="Delete activity"
                  className="grid h-7 w-7 place-items-center rounded text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <ImageUrlField
                label="Image"
                value={a.image}
                onChange={(next) => handleChange(a.slug, { image: next ?? '' })}
              />
              <label className="block space-y-1">
                <span className="block text-[11.5px] font-medium text-zinc-700 dark:text-zinc-300">Description</span>
                <textarea
                  rows={2}
                  value={a.description}
                  onChange={(e) => handleChange(a.slug, { description: e.target.value })}
                  className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-[12px] text-zinc-900 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
              <label className="block space-y-1">
                <span className="block text-[11.5px] font-medium text-zinc-700 dark:text-zinc-300">Website</span>
                <input
                  type="text"
                  value={a.website}
                  onChange={(e) => handleChange(a.slug, { website: e.target.value })}
                  placeholder="https://…"
                  className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                />
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
