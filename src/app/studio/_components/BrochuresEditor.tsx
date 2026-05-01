'use client';

import { Reorder, useDragControls } from 'framer-motion';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  GripVertical,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';

import {
  makeBlankBrochure,
  newBrochureSlug,
  type BrochureItem,
  type BrochuresModuleConfig,
} from '@/lib/studio/schema';

import { EditorEmptyState } from './EditorEmptyState';
import { ImageField } from './ImageField';
import { PdfField } from './PdfField';

export function BrochuresEditor({
  brochures,
  onChange,
}: {
  brochures: BrochuresModuleConfig;
  onChange: (next: BrochuresModuleConfig) => void;
}) {
  const setList = (list: BrochureItem[]) => onChange({ ...brochures, brochures: list });

  const update = (slug: string, patch: Partial<BrochureItem>) =>
    setList(brochures.brochures.map((b) => (b.slug === slug ? { ...b, ...patch } : b)));

  const remove = (slug: string) =>
    setList(brochures.brochures.filter((b) => b.slug !== slug));

  const clone = (slug: string) => {
    const idx = brochures.brochures.findIndex((b) => b.slug === slug);
    if (idx < 0) return;
    const orig = brochures.brochures[idx];
    const copy: BrochureItem = {
      ...orig,
      slug: newBrochureSlug(orig.title),
      title: `${orig.title} (copy)`,
    };
    setList([
      ...brochures.brochures.slice(0, idx + 1),
      copy,
      ...brochures.brochures.slice(idx + 1),
    ]);
  };

  const add = () => {
    const cat = brochures.categories[0] ?? 'Uncategorized';
    setList([...brochures.brochures, makeBlankBrochure(cat)]);
  };

  const setCategories = (cats: string[]) => {
    // Si una categoría se borra y hay brochures con esa categoría, las
    // re-asignamos a la primera disponible (o "Uncategorized").
    const fallback = cats[0] ?? 'Uncategorized';
    const next = brochures.brochures.map((b) =>
      cats.includes(b.category) ? b : { ...b, category: fallback },
    );
    onChange({ ...brochures, categories: cats, brochures: next });
  };

  return (
    <div className="space-y-7">
      {/* Module hero + label */}
      <Group title="Module" hint="Hero image of the Digital Brochure header.">
        <Field label="Label">
          <input
            value={brochures.label}
            onChange={(e) => onChange({ ...brochures, label: e.target.value })}
            className={inputCls}
            maxLength={64}
          />
        </Field>
        <ImageField
          layout="compact"
          label="Hero image"
          hint="Header background · 1080×~600 · JPG/PNG"
          value={brochures.heroImage || undefined}
          onChange={(v) => onChange({ ...brochures, heroImage: v ?? '' })}
          accept="image/jpeg,image/png,image/webp"
          maxBytes={1.5 * 1024 * 1024}
        />
      </Group>

      {/* Categories */}
      <Group
        title="Categories"
        hint="Tabs shown above the brochure list. Removing a tab reassigns its brochures to the first one."
      >
        <CategoriesEditor categories={brochures.categories} onChange={setCategories} />
      </Group>

      {/* Brochures list */}
      <section>
        <header className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Brochures
            </h3>
            <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
              Drag to reorder · {brochures.brochures.length}/200 brochures.
            </p>
          </div>
        </header>

        {brochures.brochures.length === 0 ? (
          <EditorEmptyState
            icon={BookOpen}
            headline="No brochures yet"
            description="Flippable PDF brochures (visitor guides, restaurant menus, event programs) surface from the Digital Brochure tile. Each brochure renders a thumbnail and inline reader."
            primaryAction={{ label: 'Add brochure', onClick: add }}
          />
        ) : (
          <Reorder.Group
            axis="y"
            values={brochures.brochures}
            onReorder={setList}
            className="flex flex-col gap-2"
          >
            {brochures.brochures.map((b) => (
              <BrochureRow
                key={b.slug}
                brochure={b}
                categories={brochures.categories}
                onUpdate={(patch) => update(b.slug, patch)}
                onRemove={() => remove(b.slug)}
                onClone={() => clone(b.slug)}
              />
            ))}
          </Reorder.Group>
        )}

        <button
          type="button"
          onClick={add}
          disabled={brochures.categories.length === 0}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2.5 text-[12px] font-medium text-zinc-600 transition hover:border-sky-500/40 hover:bg-sky-500/5 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
        >
          <Plus className="h-3.5 w-3.5" />
          {brochures.categories.length === 0 ? 'Add a category first' : 'Add brochure'}
        </button>
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Brochure row                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function BrochureRow({
  brochure,
  categories,
  onUpdate,
  onRemove,
  onClone,
}: {
  brochure: BrochureItem;
  categories: string[];
  onUpdate: (patch: Partial<BrochureItem>) => void;
  onRemove: () => void;
  onClone: () => void;
}) {
  const dragControls = useDragControls();
  const [expanded, setExpanded] = useState(false);

  return (
    <Reorder.Item
      value={brochure}
      dragListener={false}
      dragControls={dragControls}
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-900 dark:bg-zinc-900/40"
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-400 transition hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={`Drag ${brochure.title}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="grid h-12 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          {brochure.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brochure.cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-zinc-400">
              <BookOpen className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
            {brochure.title || <em className="text-zinc-400">No title</em>}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-zinc-500 dark:text-zinc-500">
            <span className="rounded bg-zinc-100 px-1.5 py-0 font-mono uppercase tracking-[0.1em] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              {brochure.category}
            </span>
            <span>·</span>
            <span>{brochure.pageCount} pages</span>
            {brochure.publishedLabel && (
              <>
                <span>·</span>
                <span>{brochure.publishedLabel}</span>
              </>
            )}
            {!brochure.pdfUrl && (
              <span className="font-medium text-amber-600 dark:text-amber-400">
                · no PDF
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onClone}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-sky-600 dark:hover:bg-zinc-800"
          aria-label="Duplicate brochure"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
          aria-label="Remove brochure"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-900 dark:bg-zinc-900/30">
          <PdfField
            label="PDF"
            hint="Brochure PDF · max 8MB"
            value={brochure.pdfUrl || undefined}
            onChange={(v) => onUpdate({ pdfUrl: v ?? '' })}
            pageCount={brochure.pageCount}
            onPageCountChange={(n) => onUpdate({ pageCount: n })}
          />

          <ImageField
            layout="compact"
            label="Cover image"
            hint="Card image · portrait 9:13 · JPG/PNG"
            value={brochure.cover || undefined}
            onChange={(v) => onUpdate({ cover: v ?? '' })}
            accept="image/jpeg,image/png,image/webp"
            maxBytes={800 * 1024}
          />

          <Field label="Title">
            <input
              value={brochure.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className={inputCls}
              maxLength={160}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Category">
              <select
                value={brochure.category}
                onChange={(e) => onUpdate({ category: e.target.value })}
                className={inputCls}
              >
                {!categories.includes(brochure.category) && (
                  <option value={brochure.category}>{brochure.category}</option>
                )}
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Published">
              <input
                value={brochure.publishedLabel}
                onChange={(e) => onUpdate({ publishedLabel: e.target.value })}
                className={inputCls}
                maxLength={64}
                placeholder="June 2025"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={brochure.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={3}
              className={`${inputCls} resize-none`}
              maxLength={2000}
              placeholder="Body shown on the detail screen"
            />
          </Field>

          <Field label="Page count">
            <input
              type="number"
              min={1}
              max={500}
              value={brochure.pageCount}
              onChange={(e) =>
                onUpdate({
                  pageCount: Math.max(1, Math.min(500, Number(e.target.value) || 1)),
                })
              }
              className={inputCls}
            />
            <p className="mt-1 text-[10.5px] text-zinc-400 dark:text-zinc-600">
              Auto-detected from the PDF on upload. You can override if needed.
            </p>
          </Field>

          <div className="flex items-center justify-between border-t border-zinc-200 pt-2 dark:border-zinc-800">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-600">
              slug · {brochure.slug}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-medium text-red-500 transition hover:bg-red-500/10"
            >
              <Trash2 className="h-3 w-3" />
              Delete brochure
            </button>
          </div>
        </div>
      )}
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Categories editor                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

function CategoriesEditor({
  categories,
  onChange,
}: {
  categories: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const submit = () => {
    const next = draft.trim();
    if (next.length === 0) return;
    if (categories.includes(next)) {
      setDraft('');
      return;
    }
    onChange([...categories, next]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <Reorder.Group
        axis="x"
        values={categories}
        onReorder={onChange}
        className="flex flex-wrap gap-1.5"
      >
        {categories.map((c) => (
          <Reorder.Item
            key={c}
            value={c}
            className="inline-flex cursor-grab items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-700 active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300"
          >
            {c}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onChange(categories.filter((x) => x !== c))}
              className="grid h-4 w-4 place-items-center rounded-full text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
              aria-label={`Remove ${c}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Reorder.Item>
        ))}
        {categories.length === 0 && (
          <span className="text-[11px] text-zinc-400 dark:text-zinc-600">
            No categories yet — add one to enable brochures.
          </span>
        )}
      </Reorder.Group>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Add a category…"
          maxLength={64}
          className={inputCls}
        />
        <button
          type="button"
          onClick={submit}
          disabled={draft.trim().length === 0}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:border-sky-500/40 hover:bg-sky-500/5 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400"
          aria-label="Add category"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

const inputCls =
  'w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12.5px] text-zinc-800 outline-none transition focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100';

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-3">
        <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
        {hint && <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">{hint}</p>}
      </header>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}
