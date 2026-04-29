'use client';

import { useMemo, useState } from 'react';

import {
  makeBlankTrail,
  type TrailDifficulty,
  type TrailItem,
  type TrailType,
  type TrailsModule,
} from '@/lib/studio/schema';

import { CatalogItemForm, type FieldConfig } from './catalog/CatalogItemForm';
import { CatalogItemPanel } from './catalog/CatalogItemPanel';
import { CatalogList } from './catalog/CatalogList';
import { CatalogToolbar } from './catalog/CatalogToolbar';
import { ImageUrlField } from './catalog/ImageUrlField';
import { TaxonomyEditor } from './catalog/TaxonomyEditor';

const DIFFICULTY_OPTIONS: TrailDifficulty[] = ['Easy', 'Moderate', 'Hard'];
const TRAIL_TYPE_OPTIONS: TrailType[] = ['Loop', 'Out & Back', 'Point to Point'];

interface TrailsEditorProps {
  value: TrailsModule;
  onChange: (next: TrailsModule) => void;
}

export function TrailsEditor({ value, onChange }: TrailsEditorProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const editingItem = useMemo(
    () =>
      editingSlug ? value.trails.find((t) => t.slug === editingSlug) ?? null : null,
    [editingSlug, value.trails],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return value.trails.filter((t) => {
      if (filter && t.considerations.difficulty !== filter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.subcategory.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
      );
    });
  }, [value.trails, search, filter]);

  const update = (patch: Partial<TrailsModule>) => onChange({ ...value, ...patch });

  const handleAdd = () => {
    const item = makeBlankTrail();
    update({ trails: [item, ...value.trails] });
    setEditingSlug(item.slug);
  };

  const handleReorder = (next: TrailItem[]) => {
    const visibleSet = new Set(next.map((i) => i.slug));
    const hidden = value.trails.filter((i) => !visibleSet.has(i.slug));
    update({ trails: [...next, ...hidden] });
  };

  const handleItemChange = (slug: string, patch: Partial<TrailItem>) =>
    update({
      trails: value.trails.map((t) => (t.slug === slug ? { ...t, ...patch } : t)),
    });

  const handleItemDelete = (slug: string) => {
    update({ trails: value.trails.filter((t) => t.slug !== slug) });
    if (editingSlug === slug) setEditingSlug(null);
  };

  const handleItemDuplicate = (slug: string) => {
    const original = value.trails.find((t) => t.slug === slug);
    if (!original) return;
    const dup: TrailItem = {
      ...original,
      slug: `${original.slug}-copy-${Date.now()}`,
      title: `${original.title} (Copy)`,
    };
    const idx = value.trails.findIndex((t) => t.slug === slug);
    const next = value.trails.slice();
    next.splice(idx + 1, 0, dup);
    update({ trails: next });
  };

  if (editingItem) {
    const baseFields: FieldConfig<TrailItem>[] = [
      { kind: 'text', key: 'title', label: 'Title' },
      { kind: 'text', key: 'slug', label: 'Slug', helpText: 'Lowercase, hyphens.' },
      { kind: 'image', key: 'image', label: 'Cover image' },
      {
        kind: 'taxonomy-pick',
        key: 'subcategory',
        label: 'Subcategory',
        options: value.subcategories,
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
      { kind: 'text', key: 'hours', label: 'Hours', helpText: 'e.g. Sunrise – Sunset' },
      { kind: 'number', key: 'popularity', label: 'Popularity (0-100)', min: 0, max: 100 },
      { kind: 'latlng', key: 'coords', label: 'Trailhead coordinates' },
    ];
    return (
      <CatalogItemPanel
        title={editingItem.title}
        subtitle={`${editingItem.considerations.difficulty} · ${editingItem.considerations.distance || '—'}`}
        onBack={() => setEditingSlug(null)}
        onDelete={() => handleItemDelete(editingItem.slug)}
      >
        <CatalogItemForm<TrailItem>
          item={editingItem}
          fields={baseFields}
          onChange={(patch) => handleItemChange(editingItem.slug, patch)}
          footer={
            <>
              <ConsiderationsEditor
                considerations={editingItem.considerations}
                onChange={(next) =>
                  handleItemChange(editingItem.slug, { considerations: next })
                }
              />
              <TrailMapEditor
                trailMap={editingItem.trailMap}
                onChange={(next) =>
                  handleItemChange(editingItem.slug, { trailMap: next })
                }
              />
            </>
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
          label="Subcategories"
          items={value.subcategories}
          onChange={(next) => update({ subcategories: next })}
          getUsage={(item) =>
            value.trails.filter((t) => t.subcategory === item).length
          }
        />
        <TaxonomyEditor
          label="Features"
          items={value.features}
          onChange={(next) => update({ features: next })}
          getUsage={(item) =>
            value.trails.filter((t) => t.features.includes(item)).length
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <FilterEnumPicker
          label="Difficulties shown in filter"
          options={DIFFICULTY_OPTIONS}
          selected={value.difficulties}
          onChange={(next) => update({ difficulties: next })}
        />
        <FilterEnumPicker
          label="Trail types shown in filter"
          options={TRAIL_TYPE_OPTIONS}
          selected={value.trailTypes}
          onChange={(next) => update({ trailTypes: next })}
        />
      </div>

      <CatalogToolbar
        search={search}
        onSearchChange={setSearch}
        onAdd={handleAdd}
        addLabel="Add trail"
        filter={filter}
        onFilterChange={setFilter}
        filterOptions={DIFFICULTY_OPTIONS.map((d) => ({ value: d, label: d }))}
        filterPlaceholder="Any difficulty"
        count={value.trails.length}
      />

      <CatalogList<TrailItem>
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
                {item.considerations.difficulty} ·{' '}
                {item.considerations.distance || '—'}
                {item.subcategory ? ` · ${item.subcategory}` : ''}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}

function FilterEnumPicker<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: T[];
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  const toggle = (opt: T) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };
  return (
    <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30">
      <h4 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
        {label}
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                active
                  ? 'border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConsiderationsEditor({
  considerations,
  onChange,
}: {
  considerations: TrailItem['considerations'];
  onChange: (next: TrailItem['considerations']) => void;
}) {
  const update = <K extends keyof TrailItem['considerations']>(
    key: K,
    val: TrailItem['considerations'][K],
  ) => onChange({ ...considerations, [key]: val });

  return (
    <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <h5 className="text-[11.5px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
        Considerations
      </h5>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">Distance</span>
          <input
            type="text"
            value={considerations.distance}
            onChange={(e) => update('distance', e.target.value)}
            placeholder="e.g. 5.2 mi"
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
        </label>
        <label className="block space-y-1">
          <span className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">Difficulty</span>
          <select
            value={considerations.difficulty}
            onChange={(e) => update('difficulty', e.target.value as TrailDifficulty)}
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100"
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">Duration (optional)</span>
          <input
            type="text"
            value={considerations.duration ?? ''}
            onChange={(e) => update('duration', e.target.value || undefined)}
            placeholder="e.g. 2-3 hours"
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
        </label>
        <label className="block space-y-1">
          <span className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">Elevation gain (optional)</span>
          <input
            type="text"
            value={considerations.elevationGain ?? ''}
            onChange={(e) => update('elevationGain', e.target.value || undefined)}
            placeholder="e.g. 1,280 ft"
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
        </label>
        <label className="block space-y-1">
          <span className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">Trail type (optional)</span>
          <select
            value={considerations.trailType ?? ''}
            onChange={(e) =>
              update('trailType', (e.target.value as TrailType) || undefined)
            }
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100"
          >
            <option value="">—</option>
            {TRAIL_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[12px] text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={considerations.dogFriendly ?? false}
            onChange={(e) => update('dogFriendly', e.target.checked || undefined)}
            className="h-3.5 w-3.5 rounded border-zinc-300 bg-white text-sky-500 focus:ring-sky-500/40 dark:border-zinc-700 dark:bg-zinc-900"
          />
          Dog friendly
        </label>
      </div>
    </div>
  );
}

function TrailMapEditor({
  trailMap,
  onChange,
}: {
  trailMap: TrailItem['trailMap'];
  onChange: (next: TrailItem['trailMap']) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(trailMap.geojson.coordinates));
  const [error, setError] = useState<string | null>(null);

  const commit = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('must be a JSON array');
      const valid = parsed.every(
        (p) =>
          Array.isArray(p) &&
          p.length === 2 &&
          typeof p[0] === 'number' &&
          typeof p[1] === 'number',
      );
      if (!valid) throw new Error('expected array of [lng, lat] tuples');
      onChange({
        ...trailMap,
        geojson: { type: 'LineString', coordinates: parsed as [number, number][] },
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <h5 className="text-[11.5px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
        Trail map (GeoJSON)
      </h5>

      <label className="block space-y-1">
        <span className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
          Coordinates ([lng, lat] tuples)
        </span>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            commit(e.target.value);
          }}
          placeholder='[[-112.123,36.123],[-112.124,36.124]]'
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[11px] text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-600"
        />
        {error ? (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">{error}</p>
        ) : (
          <p className="text-[11px] text-zinc-500">
            {trailMap.geojson.coordinates.length} points.
          </p>
        )}
      </label>
    </div>
  );
}
