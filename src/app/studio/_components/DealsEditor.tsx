'use client';

import { Reorder, useDragControls } from 'framer-motion';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  GripVertical,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { makeBlankDeal, newDealSlug, type Deal, type DealsModuleConfig } from '@/lib/studio/schema';

import { type AiSuggestedItem } from '../_lib/api-client';

import { AiSuggestModal } from './AiSuggestModal';
import { EditorEmptyState } from './EditorEmptyState';
import { ImageField } from './ImageField';

export function DealsEditor({
  deals,
  onChange,
  kioskLocation,
}: {
  deals: DealsModuleConfig;
  onChange: (next: DealsModuleConfig) => void;
  /** Location del kiosk para AI suggest (#26 audit). */
  kioskLocation?: string;
}) {
  const [aiOpen, setAiOpen] = useState(false);
  const setDeals = (list: Deal[]) => onChange({ ...deals, deals: list });

  const updateDeal = (slug: string, patch: Partial<Deal>) => {
    setDeals(deals.deals.map((d) => (d.slug === slug ? { ...d, ...patch } : d)));
  };

  const removeDeal = (slug: string) => {
    setDeals(deals.deals.filter((d) => d.slug !== slug));
  };

  const cloneDeal = (slug: string) => {
    const idx = deals.deals.findIndex((d) => d.slug === slug);
    if (idx < 0) return;
    const orig = deals.deals[idx];
    const clone: Deal = {
      ...orig,
      slug: newDealSlug(orig.title),
      title: `${orig.title} (copy)`,
    };
    setDeals([...deals.deals.slice(0, idx + 1), clone, ...deals.deals.slice(idx + 1)]);
  };

  const addDeal = () => setDeals([...deals.deals, makeBlankDeal()]);

  const setFeatureCatalog = (catalog: string[]) => onChange({ ...deals, featureCatalog: catalog });

  return (
    <div className="space-y-7">
      {/* Module hero + label */}
      <Group title="Module" hint="Hero image of the Deals page header.">
        <Field label="Label">
          <input
            value={deals.label}
            onChange={(e) => onChange({ ...deals, label: e.target.value })}
            className={inputCls}
            maxLength={64}
          />
        </Field>
        <ImageField
          layout="compact"
          label="Hero image"
          hint="Header background · 1080×~600 · JPG/PNG"
          value={deals.heroImage || undefined}
          onChange={(v) => onChange({ ...deals, heroImage: v ?? '' })}
          accept="image/jpeg,image/png,image/webp"
          maxBytes={1.5 * 1024 * 1024}
        />
        <ImageField
          layout="compact"
          label="QR center logo (optional)"
          hint="Shown inside the redeem QR · SVG/PNG"
          value={deals.qrLogo}
          onChange={(v) => onChange({ ...deals, qrLogo: v })}
        />
      </Group>

      {/* Feature catalog */}
      <Group
        title="Filter tags"
        hint="Tags shown in the filter overlay. Each deal can pick from this list."
      >
        <TagsEditor tags={deals.featureCatalog} onChange={setFeatureCatalog} />
      </Group>

      {/* Deals list */}
      <section>
        <header className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Deals
            </h3>
            <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
              Drag to reorder · {deals.deals.length}/200 deals.
            </p>
          </div>
          {kioskLocation ? (
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-violet-300/60 bg-violet-50 px-2.5 py-1 text-[11.5px] font-medium text-violet-700 transition hover:bg-violet-100 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:bg-violet-950/50"
              title="Generate plausible deals for this kiosk's location with AI"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Suggest with AI
            </button>
          ) : null}
        </header>

        {deals.deals.length === 0 ? (
          <EditorEmptyState
            icon={Tag}
            headline="No deals yet"
            description="Promotions and discounts surfaced from the Deals tile in the Home grid. Operators usually start with 5–10 hero offers and expand from there."
            primaryAction={{ label: 'Add deal', onClick: addDeal }}
          />
        ) : (
          <Reorder.Group
            axis="y"
            values={deals.deals}
            onReorder={setDeals}
            className="flex flex-col gap-2"
          >
            {deals.deals.map((deal) => (
              <DealRow
                key={deal.slug}
                deal={deal}
                catalog={deals.featureCatalog}
                onUpdate={(patch) => updateDeal(deal.slug, patch)}
                onRemove={() => removeDeal(deal.slug)}
                onClone={() => cloneDeal(deal.slug)}
              />
            ))}
          </Reorder.Group>
        )}

        <button
          type="button"
          onClick={addDeal}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2.5 text-[12px] font-medium text-zinc-600 transition hover:border-sky-500/40 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Add deal
        </button>
      </section>

      <AiSuggestModal
        open={aiOpen}
        kind="deals"
        location={kioskLocation ?? ''}
        existingSlugs={deals.deals.map((d) => d.slug)}
        onClose={() => setAiOpen(false)}
        onConfirm={(items: AiSuggestedItem[]) => {
          // Map AI items → Deal skeletons. AI provee title/description/tags;
          // el operador completa cover/QR/expiresAt/promoCode después.
          const today = new Date();
          today.setMonth(today.getMonth() + 1);
          const expiresAt = today.toISOString().slice(0, 10);
          const newDeals: Deal[] = items.map((it) => ({
            slug: it.slug,
            title: it.title,
            shortDescription: it.description.slice(0, 280),
            headline: '',
            subtitle: '',
            longDescription: it.description,
            cover: '',
            expiresAt,
            qrUrl: '',
            features: it.tags ?? [],
          }));
          onChange({ ...deals, deals: [...newDeals, ...deals.deals] });
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Deal row                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function DealRow({
  deal,
  catalog,
  onUpdate,
  onRemove,
  onClone,
}: {
  deal: Deal;
  catalog: string[];
  onUpdate: (patch: Partial<Deal>) => void;
  onRemove: () => void;
  onClone: () => void;
}) {
  const dragControls = useDragControls();
  const [expanded, setExpanded] = useState(false);

  const expiringInDays = daysUntil(deal.expiresAt);
  const expired = expiringInDays !== null && expiringInDays < 0;

  return (
    <Reorder.Item
      value={deal}
      dragListener={false}
      dragControls={dragControls}
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-900 dark:bg-zinc-900/40"
    >
      {/* Header row */}
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-400 transition hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={`Drag ${deal.title}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="grid h-12 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          {deal.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={deal.cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-zinc-400">
              <Tag className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
            {deal.title || <em className="text-zinc-400">No title</em>}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-zinc-500 dark:text-zinc-500">
            <Calendar className="h-3 w-3" />
            {expired ? (
              <span className="font-medium text-red-600 dark:text-red-400">
                Expired {Math.abs(expiringInDays!)}d ago
              </span>
            ) : expiringInDays !== null ? (
              <span>Expires in {expiringInDays}d</span>
            ) : (
              <span>No expiry</span>
            )}
            {deal.promoCode && (
              <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                {deal.promoCode}
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
          aria-label="Duplicate deal"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
          aria-label="Remove deal"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="space-y-3 border-t border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-900 dark:bg-zinc-900/30">
          <ImageField
            layout="compact"
            label="Cover image"
            hint="Card image · 16:9 · JPG/PNG"
            value={deal.cover || undefined}
            onChange={(v) => onUpdate({ cover: v ?? '' })}
            accept="image/jpeg,image/png,image/webp"
            maxBytes={800 * 1024}
          />

          <Field label="Title">
            <input
              value={deal.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className={inputCls}
              maxLength={160}
            />
          </Field>

          <Field label="Short description (card)">
            <textarea
              value={deal.shortDescription}
              onChange={(e) => onUpdate({ shortDescription: e.target.value })}
              rows={2}
              className={`${inputCls} resize-none`}
              maxLength={280}
              placeholder="One-liner shown on the card"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Expires on">
              <input
                type="date"
                value={deal.expiresAt}
                onChange={(e) => onUpdate({ expiresAt: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Discount %">
              <input
                type="number"
                min={0}
                max={100}
                value={deal.discountValue ?? ''}
                onChange={(e) =>
                  onUpdate({
                    discountValue:
                      e.target.value === ''
                        ? undefined
                        : Math.max(0, Math.min(100, Number(e.target.value))),
                  })
                }
                className={inputCls}
                placeholder="—"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Original price">
              <input
                value={deal.originalPrice ?? ''}
                onChange={(e) => onUpdate({ originalPrice: e.target.value || undefined })}
                className={inputCls}
                maxLength={64}
                placeholder="$120"
              />
            </Field>
            <Field label="Promo code">
              <input
                value={deal.promoCode ?? ''}
                onChange={(e) => onUpdate({ promoCode: e.target.value.toUpperCase() || undefined })}
                className={`${inputCls} font-mono uppercase`}
                maxLength={64}
                placeholder="ZARA10"
              />
            </Field>
          </div>

          <Field label="Headline (modal)">
            <input
              value={deal.headline}
              onChange={(e) => onUpdate({ headline: e.target.value })}
              className={inputCls}
              maxLength={280}
            />
          </Field>

          <Field label="Subtitle (modal)">
            <input
              value={deal.subtitle}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              className={inputCls}
              maxLength={280}
            />
          </Field>

          <Field label="Long description (modal)">
            <textarea
              value={deal.longDescription}
              onChange={(e) => onUpdate({ longDescription: e.target.value })}
              rows={4}
              className={`${inputCls} resize-none`}
              maxLength={2000}
              placeholder="Body of the redeem modal. Can mention the promo code."
            />
          </Field>

          <Field label="QR redeem URL">
            <input
              type="url"
              value={deal.qrUrl}
              onChange={(e) => onUpdate({ qrUrl: e.target.value })}
              className={inputCls}
              placeholder="https://..."
            />
          </Field>

          {catalog.length > 0 && (
            <Field label="Tags (filter)">
              <FeatureChips
                catalog={catalog}
                selected={deal.features}
                onChange={(features) => onUpdate({ features })}
              />
            </Field>
          )}

          <div className="flex items-center justify-between border-t border-zinc-200 pt-2 dark:border-zinc-800">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-600">
              slug · {deal.slug}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-medium text-red-500 transition hover:bg-red-500/10"
            >
              <Trash2 className="h-3 w-3" />
              Delete deal
            </button>
          </div>
        </div>
      )}
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Feature chips (deal × catalog)                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function FeatureChips({
  catalog,
  selected,
  onChange,
}: {
  catalog: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) onChange(selected.filter((t) => t !== tag));
    else onChange([...selected, tag]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {catalog.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={
              'rounded-full border px-2.5 py-1 text-[11px] transition ' +
              (active
                ? 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400')
            }
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Catalog tags editor                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const submit = () => {
    const next = draft.trim();
    if (next.length === 0) return;
    if (tags.includes(next)) {
      setDraft('');
      return;
    }
    onChange([...tags, next]);
    setDraft('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="grid h-4 w-4 place-items-center rounded-full text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-[11px] text-zinc-400 dark:text-zinc-600">No tags yet.</span>
        )}
      </div>
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
          placeholder="Add a tag…"
          maxLength={64}
          className={inputCls}
        />
        <button
          type="button"
          onClick={submit}
          disabled={draft.trim().length === 0}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:border-sky-500/40 hover:bg-sky-500/5 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400"
          aria-label="Add tag"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function daysUntil(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + 'T00:00:00');
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

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
