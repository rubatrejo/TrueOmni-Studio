'use client';

import { Footprints } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { ImportMode, ImportStats } from '@/app/studio/_lib/import-helpers';
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
import { downloadCatalog } from './catalog/export-utils';
import { ImageUrlField } from './catalog/ImageUrlField';
import { mergeTaxonomy, upsertBySlug } from './catalog/import-utils';
import { ImportModal } from './catalog/ImportModal';
import { ImportToast } from './catalog/ImportToast';
import { TaxonomyEditor } from './catalog/TaxonomyEditor';
import { EditorEmptyState } from './EditorEmptyState';
import { TrailGeoJsonField } from './TrailGeoJsonField';
import { Checkbox, Field, Select, TextInput } from './ui';

const DIFFICULTY_OPTIONS: TrailDifficulty[] = ['Easy', 'Moderate', 'Hard'];
const TRAIL_TYPE_OPTIONS: TrailType[] = ['Loop', 'Out & Back', 'Point to Point'];

interface TrailsEditorProps {
  value: TrailsModule;
  onChange: (next: TrailsModule) => void;
  /** Mapbox token (de `integrations.mapbox.token`) — habilita el draw editor. */
  mapboxToken?: string;
}

export function TrailsEditor({ value, onChange, mapboxToken = '' }: TrailsEditorProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [lastImport, setLastImport] = useState<ImportStats | null>(null);

  const handleImport = (items: TrailItem[], mode: ImportMode, stats: ImportStats) => {
    const nextTrails = mode === 'replace' ? items : upsertBySlug(value.trails, items);
    onChange({
      ...value,
      trails: nextTrails,
      subcategories: mergeTaxonomy(value.subcategories, items, (i) => i.subcategory),
      features: mergeTaxonomy(value.features, items, (i) => i.features),
    });
    setLastImport(stats);
  };

  const handleExport = (format: 'csv' | 'json') => {
    downloadCatalog('trails', value.trails, format, 'trails');
  };

  const editingItem = useMemo(
    () => (editingSlug ? (value.trails.find((t) => t.slug === editingSlug) ?? null) : null),
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

  const handleBulkDelete = (slugs: string[]) => {
    const set = new Set(slugs);
    update({ trails: value.trails.filter((t) => !set.has(t.slug)) });
    if (editingSlug && set.has(editingSlug)) setEditingSlug(null);
  };

  const handleBulkDuplicate = (slugs: string[]) => {
    const set = new Set(slugs);
    const next = value.trails.slice();
    let inserted = 0;
    value.trails.forEach((trail, idx) => {
      if (!set.has(trail.slug)) return;
      const dup: TrailItem = {
        ...trail,
        slug: `${trail.slug}-copy-${Date.now()}-${inserted}`,
        title: `${trail.title} (Copy)`,
      };
      next.splice(idx + 1 + inserted, 0, dup);
      inserted += 1;
    });
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
                onChange={(next) => handleItemChange(editingItem.slug, { considerations: next })}
              />
              <TrailMapEditor
                trailMap={editingItem.trailMap}
                trailheadCoords={editingItem.coords}
                mapboxToken={mapboxToken}
                onChange={(next) => handleItemChange(editingItem.slug, { trailMap: next })}
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
          getUsage={(item) => value.trails.filter((t) => t.subcategory === item).length}
        />
        <TaxonomyEditor
          label="Features"
          items={value.features}
          onChange={(next) => update({ features: next })}
          getUsage={(item) => value.trails.filter((t) => t.features.includes(item)).length}
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
        onImport={() => setImportOpen(true)}
        onExport={handleExport}
        exportEnabled={value.trails.length > 0}
        filter={filter}
        onFilterChange={setFilter}
        filterOptions={DIFFICULTY_OPTIONS.map((d) => ({ value: d, label: d }))}
        filterPlaceholder="Any difficulty"
        count={value.trails.length}
      />

      <ImportToast
        stats={lastImport}
        noun={lastImport && lastImport.total === 1 ? 'trail' : 'trails'}
        onDismiss={() => setLastImport(null)}
      />

      <ImportModal
        open={importOpen}
        kind="trails"
        existingItems={value.trails}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      <CatalogList<TrailItem>
        items={visible}
        onReorder={handleReorder}
        onItemDelete={handleItemDelete}
        onItemDuplicate={handleItemDuplicate}
        onItemsBulkDelete={handleBulkDelete}
        onItemsBulkDuplicate={handleBulkDuplicate}
        itemNoun="trail"
        onItemSelect={setEditingSlug}
        emptyState={
          value.trails.length === 0 ? (
            <EditorEmptyState
              icon={Footprints}
              headline="No trails yet"
              description="Hiking, walking and biking trails surface on the Trails tile with difficulty, length and a map preview. Useful for outdoor-leaning kiosks."
              primaryAction={{ label: 'Add trail', onClick: handleAdd }}
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
                {item.considerations.difficulty} · {item.considerations.distance || '—'}
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
        <Field label="Distance">
          <TextInput
            value={considerations.distance}
            onChange={(e) => update('distance', e.target.value)}
            placeholder="e.g. 5.2 mi"
          />
        </Field>
        <Field label="Difficulty">
          <Select
            value={considerations.difficulty}
            onChange={(e) => update('difficulty', e.target.value as TrailDifficulty)}
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Duration (optional)">
          <TextInput
            value={considerations.duration ?? ''}
            onChange={(e) => update('duration', e.target.value || undefined)}
            placeholder="e.g. 2-3 hours"
          />
        </Field>
        <Field label="Elevation gain (optional)">
          <TextInput
            value={considerations.elevationGain ?? ''}
            onChange={(e) => update('elevationGain', e.target.value || undefined)}
            placeholder="e.g. 1,280 ft"
          />
        </Field>
        <Field label="Trail type (optional)">
          <Select
            value={considerations.trailType ?? ''}
            onChange={(e) => update('trailType', (e.target.value as TrailType) || undefined)}
          >
            <option value="">—</option>
            {TRAIL_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Checkbox
            label="Dog friendly"
            checked={considerations.dogFriendly ?? false}
            onChange={(next) => update('dogFriendly', next || undefined)}
          />
        </div>
      </div>
    </div>
  );
}

function TrailMapEditor({
  trailMap,
  trailheadCoords,
  mapboxToken,
  onChange,
}: {
  trailMap: TrailItem['trailMap'];
  trailheadCoords: TrailItem['coords'];
  mapboxToken: string;
  onChange: (next: TrailItem['trailMap']) => void;
}) {
  return (
    <TrailGeoJsonField
      coordinates={trailMap.geojson.coordinates as [number, number][]}
      fallbackCenter={
        trailheadCoords.lat || trailheadCoords.lng
          ? { lat: trailheadCoords.lat, lng: trailheadCoords.lng }
          : undefined
      }
      mapboxToken={mapboxToken}
      onChange={(next) =>
        onChange({
          ...trailMap,
          geojson: { type: 'LineString', coordinates: next },
        })
      }
    />
  );
}
