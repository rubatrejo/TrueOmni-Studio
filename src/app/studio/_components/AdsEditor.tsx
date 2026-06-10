'use client';

import {
  ChevronLeft,
  Copy,
  Download,
  Eye,
  EyeOff,
  Megaphone,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import type { ImportMode, ImportStats } from '@/app/studio/_lib/import-helpers';
import {
  AD_KINDS,
  AD_THEMES,
  type Ad,
  type AdKind,
  type AdsModule,
  makeBlankAd,
} from '@/lib/studio/schema';

import { downloadCatalog } from './catalog/export-utils';
import { ImageUrlField } from './catalog/ImageUrlField';
import { upsertById } from './catalog/import-utils';
import { ImportModal } from './catalog/ImportModal';
import { ImportToast } from './catalog/ImportToast';
import { EditorEmptyState } from './EditorEmptyState';
import { Select, TextInput, Textarea } from './ui';

interface AdsEditorProps {
  value: AdsModule;
  onChange: (next: AdsModule) => void;
  /** Rutas pre-seleccionables del picker. Default = rutas del kiosk (`/home/*`). */
  commonRoutes?: readonly string[];
  /** Dimensiones por tipo mostradas como ayuda. Default = dims del kiosk. */
  kindDimensions?: Record<AdKind, string>;
}

export function AdsEditor({
  value,
  onChange,
  commonRoutes = COMMON_ROUTES,
  kindDimensions = AD_KIND_DIMENSIONS,
}: AdsEditorProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'' | AdKind>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [lastImport, setLastImport] = useState<ImportStats | null>(null);

  const handleImport = (items: Ad[], mode: ImportMode, stats: ImportStats) => {
    const nextAds = mode === 'replace' ? items : upsertById(value.ads, items);
    onChange({ ads: nextAds });
    setLastImport(stats);
  };

  const handleExport = (format: 'csv' | 'json') => {
    downloadCatalog('ads', value.ads, format, 'ads');
  };

  const editingAd = useMemo(
    () => (editingId ? (value.ads.find((a) => a.id === editingId) ?? null) : null),
    [editingId, value.ads],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return value.ads.filter((ad) => {
      if (filter && ad.kind !== filter) return false;
      if (!q) return true;
      return (
        ad.id.toLowerCase().includes(q) ||
        (ad.alt ?? '').toLowerCase().includes(q) ||
        ad.routes.some((r) => r.toLowerCase().includes(q))
      );
    });
  }, [value.ads, search, filter]);

  const counts = useMemo(() => {
    const c: Record<AdKind, number> = { popup: 0, hero: 0, bottom: 0 };
    for (const ad of value.ads) c[ad.kind]++;
    return c;
  }, [value.ads]);

  const update = (next: AdsModule) => onChange(next);

  const handleAdd = () => {
    const ad = makeBlankAd(filter || 'popup');
    update({ ads: [ad, ...value.ads] });
    setEditingId(ad.id);
  };

  const handleDelete = (id: string) => {
    update({ ads: value.ads.filter((a) => a.id !== id) });
    if (editingId === id) setEditingId(null);
  };

  const handleDuplicate = (id: string) => {
    const original = value.ads.find((a) => a.id === id);
    if (!original) return;
    const dup: Ad = { ...original, id: `${original.id}-copy-${Date.now()}` };
    const idx = value.ads.findIndex((a) => a.id === id);
    const next = value.ads.slice();
    next.splice(idx + 1, 0, dup);
    update({ ads: next });
  };

  const handleItemChange = (id: string, patch: Partial<Ad>) =>
    update({
      ads: value.ads.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });

  if (editingAd) {
    return (
      <AdEditPanel
        ad={editingAd}
        otherIds={value.ads.filter((a) => a.id !== editingAd.id).map((a) => a.id)}
        onChange={(patch) => handleItemChange(editingAd.id, patch)}
        onBack={() => setEditingId(null)}
        onDelete={() => handleDelete(editingAd.id)}
        commonRoutes={commonRoutes}
        kindDimensions={kindDimensions}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="flex flex-1 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 dark:border-zinc-800 dark:bg-zinc-950">
          <Search className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search id, alt or route…"
            className="flex-1 bg-transparent py-1.5 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
          <span className="font-mono text-[10.5px] text-zinc-500">{value.ads.length}</span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as '' | AdKind)}
          aria-label="Filter by kind"
          className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[11.5px] text-zinc-700 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        >
          <option value="">All kinds</option>
          {AD_KINDS.map((k) => (
            <option key={k} value={k}>
              {k} ({counts[k]})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => handleExport('json')}
          disabled={value.ads.length === 0}
          className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          title="Download all ads as JSON"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
        >
          <Upload className="h-3.5 w-3.5" />
          Import
        </button>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 rounded-md bg-sky-500/15 px-2.5 py-1.5 text-[11.5px] font-medium text-sky-700 transition hover:bg-sky-500/25 dark:text-sky-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Add ad
        </button>
      </div>

      <ImportToast
        stats={lastImport}
        noun={lastImport && lastImport.total === 1 ? 'ad' : 'ads'}
        onDismiss={() => setLastImport(null)}
      />

      <ImportModal
        open={importOpen}
        kind="ads"
        existingItems={value.ads}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      {visible.length === 0 ? (
        value.ads.length === 0 ? (
          <EditorEmptyState
            icon={Megaphone}
            headline="No ads yet"
            description="Hero, bottom banner and popup interstitials. Schedule by date, frequency cap and target route — operators usually start with one popup and one bottom banner."
            primaryAction={{ label: 'Add ad', onClick: handleAdd }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/20">
            <Megaphone className="h-7 w-7 text-zinc-400" />
            <p className="text-[12px] italic text-zinc-500">No ads match the current filter.</p>
          </div>
        )
      ) : (
        <ul className="space-y-1.5">
          {visible.map((ad) => (
            <AdRow
              key={ad.id}
              ad={ad}
              dims={kindDimensions}
              onSelect={() => setEditingId(ad.id)}
              onToggle={() => handleItemChange(ad.id, { enabled: !ad.enabled })}
              onDuplicate={() => handleDuplicate(ad.id)}
              onDelete={() => handleDelete(ad.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AdRow({
  ad,
  dims,
  onSelect,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  ad: Ad;
  dims: Record<AdKind, string>;
  onSelect: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="group flex items-center gap-3 rounded-md border border-zinc-200 bg-white px-2 py-1.5 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
      <button type="button" onClick={onSelect} className="flex flex-1 items-center gap-3 text-left">
        {ad.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            src={ad.image}
            alt=""
            className="h-12 w-12 shrink-0 rounded object-contain ring-1 ring-zinc-200 dark:ring-zinc-800"
          />
        ) : (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
            <Megaphone className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-mono text-[11.5px] font-medium text-zinc-800 dark:text-zinc-200">
              {ad.id}
            </span>
            <KindBadge kind={ad.kind} dims={dims} />
            {!ad.enabled ? (
              <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                disabled
              </span>
            ) : null}
          </div>
          <div className="truncate text-[10.5px] text-zinc-500">
            {ad.routes.length > 0
              ? `${ad.routes.length} route${ad.routes.length === 1 ? '' : 's'} · ${ad.routes.slice(0, 2).join(', ')}${ad.routes.length > 2 ? '…' : ''}`
              : 'no routes — never shown'}
          </div>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
        <IconBtn label={ad.enabled ? 'Disable' : 'Enable'} onClick={onToggle}>
          {ad.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </IconBtn>
        <IconBtn label="Duplicate" onClick={onDuplicate}>
          <Copy className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn label="Delete" onClick={onDelete} danger>
          <Trash2 className="h-3.5 w-3.5" />
        </IconBtn>
      </div>
    </li>
  );
}

/**
 * Dimensiones físicas que cubre cada tipo de ad cuando se renderiza en el
 * kiosk 1080×1920. El operator necesita estas dims para preparar el asset
 * con el ratio correcto antes de subirlo. Sincronizado con:
 *  - `ad-hero.tsx` (1080×620 — hero header del módulo).
 *  - `ad-bottom.tsx` (height 185px — strip horizontal bottom).
 *  - `ad-popup.tsx` (865×960 modal centrado — interstitial con QR).
 */
export const AD_KIND_DIMENSIONS: Record<AdKind, string> = {
  hero: '1080×620',
  bottom: '1080×185',
  popup: '865×960',
};

/**
 * Rutas comunes pre-seleccionables del kiosk. El operator puede usar el
 * picker rápido o seguir editando el textarea libre con globs (`/home/*`).
 */
const COMMON_ROUTES = [
  '/home',
  '/home/restaurants',
  '/home/things-to-do',
  '/home/stay',
  '/home/events',
  '/home/tickets',
  '/home/passes',
  '/home/deals',
  '/home/trails',
  '/home/guestbook',
  '/home/photobooth',
  '/home/itinerary',
  '/home/social',
  '/home/map',
] as const;

function KindBadge({ kind, dims }: { kind: AdKind; dims: Record<AdKind, string> }) {
  const colorClass = {
    popup: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    hero: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
    bottom: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  }[kind];
  return (
    <span
      className={`rounded px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wide ${colorClass}`}
      title={`${kind.toUpperCase()} ad · ${dims[kind]}`}
    >
      {kind}
    </span>
  );
}

function IconBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const className = danger
    ? 'grid h-6 w-6 place-items-center rounded text-red-500 transition hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/40 dark:hover:text-red-300'
    : 'grid h-6 w-6 place-items-center rounded text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200';
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function AdEditPanel({
  ad,
  otherIds,
  onChange,
  onBack,
  onDelete,
  commonRoutes,
  kindDimensions,
}: {
  ad: Ad;
  /** IDs de los demás ads — para validar unicidad del ID (F-HUB-5). */
  otherIds: string[];
  onChange: (patch: Partial<Ad>) => void;
  onBack: () => void;
  onDelete: () => void;
  commonRoutes: readonly string[];
  kindDimensions: Record<AdKind, string>;
}) {
  const setField = <K extends keyof Ad>(key: K, value: Ad[K]) =>
    onChange({ [key]: value } as Partial<Ad>);

  // F-HUB-5: el dismissal/frequency-cap se trackea por ID → IDs colisionados
  // comparten estado. Avisamos inline si choca con otro ad o queda vacío.
  const idDuplicate = otherIds.includes(ad.id);
  const idEmpty = ad.id.trim().length === 0;

  const routesText = ad.routes.join('\n');
  const setRoutes = (text: string) => {
    const next = text
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    setField('routes', next);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to ads
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-[12px] font-medium text-red-700 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </header>

      <div className="space-y-4">
        <Field
          label="ID"
          hint="Stable identifier (kebab-case). Used internally and to track dismissals."
          error={
            idDuplicate
              ? 'Another ad already uses this ID — dismissals would collide.'
              : idEmpty
                ? 'ID is required.'
                : undefined
          }
        >
          <TextInput
            value={ad.id}
            onChange={(e) => setField('id', e.target.value.trim().toLowerCase())}
            spellCheck={false}
            className="font-mono"
            invalid={idDuplicate || idEmpty}
          />
        </Field>

        <Field
          label="Kind"
          hint={`Hero ${kindDimensions.hero} · Bottom ${kindDimensions.bottom} · Popup ${kindDimensions.popup}`}
        >
          <Select value={ad.kind} onChange={(e) => setField('kind', e.target.value as AdKind)}>
            {AD_KINDS.map((k) => (
              <option key={k} value={k}>
                {k} — {kindDimensions[k]}
              </option>
            ))}
          </Select>
        </Field>

        <ImageUrlField
          label="Image"
          value={ad.image}
          onChange={(v) => setField('image', v ?? '')}
          helpText={`Path or URL. Recommended size: ${kindDimensions[ad.kind]}. The QR (if any) must already be embedded in the asset.`}
        />

        <Field label="Alt text" hint="Description for accessibility. Shown to screen readers.">
          <TextInput value={ad.alt ?? ''} onChange={(e) => onChange({ alt: e.target.value })} />
        </Field>

        <Field
          label="Routes"
          hint="Pick the screens where this ad should show. Toggle multiple — the textarea below stays in sync. Use /home/* in the textarea for prefix matching."
        >
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {commonRoutes.map((route) => {
                const active = ad.routes.includes(route);
                return (
                  <button
                    key={route}
                    type="button"
                    onClick={() => {
                      const next = active
                        ? ad.routes.filter((r) => r !== route)
                        : [...ad.routes, route];
                      setField('routes', next);
                    }}
                    className={
                      'rounded-md border px-2 py-1 font-mono text-[10.5px] transition ' +
                      (active
                        ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800')
                    }
                  >
                    {route}
                  </button>
                );
              })}
            </div>
            <Textarea
              value={routesText}
              onChange={(e) => setRoutes(e.target.value)}
              rows={Math.max(3, Math.min(8, ad.routes.length + 1))}
              spellCheck={false}
              mono
              className="resize-y"
              placeholder="/home&#10;/home/restaurants/*"
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Theme" hint="Controls the X close button color.">
            <Select
              value={ad.theme}
              onChange={(e) => setField('theme', e.target.value as Ad['theme'])}
            >
              {AD_THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Enabled" hint="Disable to hide without deleting.">
            <label className="flex h-[34px] items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 dark:border-zinc-800 dark:bg-zinc-950">
              <input
                type="checkbox"
                checked={ad.enabled}
                onChange={(e) => setField('enabled', e.target.checked)}
                className="h-3.5 w-3.5 accent-sky-600"
              />
              <span className="text-[12px] text-zinc-700 dark:text-zinc-300">
                {ad.enabled ? 'Showing on matching routes' : 'Hidden everywhere'}
              </span>
            </label>
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  /** Mensaje de error (rojo, prevalece sobre hint cuando está set). */
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11.5px] font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[10.5px] leading-snug text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-[10.5px] leading-snug text-zinc-500 dark:text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}
