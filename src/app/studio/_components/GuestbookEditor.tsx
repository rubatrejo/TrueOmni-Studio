'use client';

import { Reorder, useDragControls } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Globe,
  GripVertical,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';

import {
  makeBlankPinOption,
  makeBlankSeedPin,
  newGuestbookId,
  type GuestbookConfig,
  type GuestbookCountry,
  type GuestbookPinOption,
  type GuestbookSeedPin,
} from '@/lib/studio/schema';

import { ImageField } from './ImageField';

type EditorTab = 'module' | 'pins' | 'seed-pins' | 'countries';

const TABS: Array<{ key: EditorTab; label: string }> = [
  { key: 'module', label: 'Module' },
  { key: 'pins', label: 'Pin catalog' },
  { key: 'seed-pins', label: 'Seed pins' },
  { key: 'countries', label: 'Countries' },
];

export function GuestbookEditor({
  guestbook,
  onChange,
}: {
  guestbook: GuestbookConfig;
  onChange: (next: GuestbookConfig) => void;
}) {
  const [tab, setTab] = useState<EditorTab>('module');

  return (
    <div className="space-y-5">
      {/* Tab pills */}
      <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-900 dark:bg-zinc-900/40">
        {TABS.map((t) => {
          const active = tab === t.key;
          const count =
            t.key === 'pins'
              ? guestbook.pinCatalog.length
              : t.key === 'seed-pins'
                ? guestbook.seedPins.length
                : t.key === 'countries'
                  ? guestbook.countries.length
                  : null;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition ' +
                (active
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200')
              }
            >
              {t.label}
              {count !== null && (
                <span className="rounded-full bg-zinc-100 px-1.5 py-0 font-mono text-[10px] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'module' && <ModuleTab guestbook={guestbook} onChange={onChange} />}
      {tab === 'pins' && <PinsTab guestbook={guestbook} onChange={onChange} />}
      {tab === 'seed-pins' && <SeedPinsTab guestbook={guestbook} onChange={onChange} />}
      {tab === 'countries' && <CountriesTab guestbook={guestbook} onChange={onChange} />}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Module tab                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function ModuleTab({
  guestbook,
  onChange,
}: {
  guestbook: GuestbookConfig;
  onChange: (next: GuestbookConfig) => void;
}) {
  const earth = guestbook.earthStart ?? { center: { lat: 30, lng: 0 }, zoom: 1.5 };
  return (
    <div className="space-y-6">
      <Group title="Module" hint="Hero, label, and Earth start view.">
        <Field label="Label">
          <input
            value={guestbook.label}
            onChange={(e) => onChange({ ...guestbook, label: e.target.value })}
            className={inputCls}
            maxLength={64}
          />
        </Field>
        <ImageField
          layout="compact"
          label="Hero image"
          hint="Top of the Start screen · 1080×~600 · JPG/PNG"
          value={guestbook.heroImage || undefined}
          onChange={(v) => onChange({ ...guestbook, heroImage: v ?? '' })}
          accept="image/jpeg,image/png,image/webp"
          maxBytes={1.5 * 1024 * 1024}
        />
      </Group>

      <Group title="Earth start view" hint="Center and zoom of the globe at start.">
        <div className="grid grid-cols-3 gap-2">
          <Field label="Center lat">
            <input
              type="number"
              step={0.001}
              min={-90}
              max={90}
              value={earth.center.lat}
              onChange={(e) =>
                onChange({
                  ...guestbook,
                  earthStart: {
                    ...earth,
                    center: { ...earth.center, lat: Number(e.target.value) || 0 },
                  },
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Center lng">
            <input
              type="number"
              step={0.001}
              min={-180}
              max={180}
              value={earth.center.lng}
              onChange={(e) =>
                onChange({
                  ...guestbook,
                  earthStart: {
                    ...earth,
                    center: { ...earth.center, lng: Number(e.target.value) || 0 },
                  },
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Zoom">
            <input
              type="number"
              step={0.1}
              min={0}
              max={20}
              value={earth.zoom}
              onChange={(e) =>
                onChange({
                  ...guestbook,
                  earthStart: {
                    ...earth,
                    zoom: Math.max(0, Math.min(20, Number(e.target.value) || 0)),
                  },
                })
              }
              className={inputCls}
            />
          </Field>
        </div>
      </Group>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Pin catalog tab                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function PinsTab({
  guestbook,
  onChange,
}: {
  guestbook: GuestbookConfig;
  onChange: (next: GuestbookConfig) => void;
}) {
  const setList = (list: GuestbookPinOption[]) => onChange({ ...guestbook, pinCatalog: list });

  const update = (id: string, patch: Partial<GuestbookPinOption>) =>
    setList(guestbook.pinCatalog.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const remove = (id: string) => setList(guestbook.pinCatalog.filter((p) => p.id !== id));

  const add = () => setList([...guestbook.pinCatalog, makeBlankPinOption()]);

  return (
    <Group
      title="Pin catalog"
      hint="The 5 pins users can drag onto the map. Each one is a PNG with circle + pointer."
    >
      <Reorder.Group
        axis="y"
        values={guestbook.pinCatalog}
        onReorder={setList}
        className="flex flex-col gap-2"
      >
        {guestbook.pinCatalog.map((pin) => (
          <PinOptionRow
            key={pin.id}
            pin={pin}
            canRemove={guestbook.pinCatalog.length > 1}
            onUpdate={(patch) => update(pin.id, patch)}
            onRemove={() => remove(pin.id)}
          />
        ))}
      </Reorder.Group>
      {guestbook.pinCatalog.length < 20 && <AddButton label="Add pin option" onClick={add} />}
    </Group>
  );
}

function PinOptionRow({
  pin,
  canRemove,
  onUpdate,
  onRemove,
}: {
  pin: GuestbookPinOption;
  canRemove: boolean;
  onUpdate: (patch: Partial<GuestbookPinOption>) => void;
  onRemove: () => void;
}) {
  const dragControls = useDragControls();
  const [expanded, setExpanded] = useState(false);
  return (
    <Reorder.Item
      value={pin}
      dragListener={false}
      dragControls={dragControls}
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-900 dark:bg-zinc-900/40"
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-400 transition hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={`Drag ${pin.label}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="grid h-12 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          {pin.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              loading="lazy"
              src={pin.image}
              alt=""
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-zinc-400">
              <MapPin className="h-4 w-4" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="truncate font-display text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
            {pin.label || <em className="text-zinc-400">No label</em>}
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-600">
            id · {pin.id}
            {!pin.image && <span className="ml-2 text-amber-600">· no image</span>}
          </div>
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
            aria-label="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {expanded && (
        <div className="space-y-3 border-t border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-900 dark:bg-zinc-900/30">
          <ImageField
            layout="compact"
            label="Pin image"
            hint="PNG transparent · circle + pointer"
            value={pin.image || undefined}
            onChange={(v) => onUpdate({ image: v ?? '' })}
            accept="image/png,image/svg+xml"
            maxBytes={300 * 1024}
          />
          <ImageField
            layout="compact"
            label="Circle-only image (optional)"
            hint="Used inside the popup avatar"
            value={pin.circleImage}
            onChange={(v) => onUpdate({ circleImage: v })}
            accept="image/png,image/svg+xml"
            maxBytes={300 * 1024}
          />
          <Field label="Label">
            <input
              value={pin.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className={inputCls}
              maxLength={64}
            />
          </Field>
        </div>
      )}
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Seed pins tab                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function SeedPinsTab({
  guestbook,
  onChange,
}: {
  guestbook: GuestbookConfig;
  onChange: (next: GuestbookConfig) => void;
}) {
  const setList = (list: GuestbookSeedPin[]) => onChange({ ...guestbook, seedPins: list });

  const update = (id: string, patch: Partial<GuestbookSeedPin>) =>
    setList(guestbook.seedPins.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const remove = (id: string) => setList(guestbook.seedPins.filter((p) => p.id !== id));

  const clone = (id: string) => {
    const idx = guestbook.seedPins.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const orig = guestbook.seedPins[idx];
    const copy: GuestbookSeedPin = { ...orig, id: newGuestbookId('seed') };
    setList([...guestbook.seedPins.slice(0, idx + 1), copy, ...guestbook.seedPins.slice(idx + 1)]);
  };

  const add = () => setList([...guestbook.seedPins, makeBlankSeedPin()]);

  return (
    <Group
      title="Seed pins"
      hint="Pre-placed visitor pins shown on the map (the kiosk renders these alongside live ones)."
    >
      {guestbook.seedPins.length === 0 ? (
        <EmptyState text="No seed pins yet. Add one to make the map feel populated from day one." />
      ) : (
        <Reorder.Group
          axis="y"
          values={guestbook.seedPins}
          onReorder={setList}
          className="flex flex-col gap-2"
        >
          {guestbook.seedPins.map((pin) => (
            <SeedPinRow
              key={pin.id}
              pin={pin}
              onUpdate={(patch) => update(pin.id, patch)}
              onRemove={() => remove(pin.id)}
              onClone={() => clone(pin.id)}
            />
          ))}
        </Reorder.Group>
      )}
      {guestbook.seedPins.length < 500 && <AddButton label="Add seed pin" onClick={add} />}
    </Group>
  );
}

function SeedPinRow({
  pin,
  onUpdate,
  onRemove,
  onClone,
}: {
  pin: GuestbookSeedPin;
  onUpdate: (patch: Partial<GuestbookSeedPin>) => void;
  onRemove: () => void;
  onClone: () => void;
}) {
  const dragControls = useDragControls();
  const [expanded, setExpanded] = useState(false);
  return (
    <Reorder.Item
      value={pin}
      dragListener={false}
      dragControls={dragControls}
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-900 dark:bg-zinc-900/40"
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-400 transition hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={`Drag ${pin.authorName}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="grid h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          {pin.pinImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" src={pin.pinImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-zinc-400">
              <MapPin className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
            {pin.authorName}
          </div>
          <div className="mt-0.5 truncate text-[10.5px] text-zinc-500 dark:text-zinc-500">
            {pin.address || pin.zipCode}
            {' · '}
            {pin.dateLabel}
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
          aria-label="Duplicate"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
          aria-label="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && (
        <div className="space-y-3 border-t border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-900 dark:bg-zinc-900/30">
          <ImageField
            layout="compact"
            label="Pin avatar"
            hint="Image drawn at lat/lng"
            value={pin.pinImage || undefined}
            onChange={(v) => onUpdate({ pinImage: v ?? '' })}
            accept="image/png,image/jpeg,image/webp"
            maxBytes={300 * 1024}
          />
          <Field label="Author name">
            <input
              value={pin.authorName}
              onChange={(e) => onUpdate({ authorName: e.target.value })}
              className={inputCls}
              maxLength={120}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Zip code">
              <input
                value={pin.zipCode}
                onChange={(e) => onUpdate({ zipCode: e.target.value })}
                className={inputCls}
                maxLength={20}
              />
            </Field>
            <Field label="Date label">
              <input
                value={pin.dateLabel}
                onChange={(e) => onUpdate({ dateLabel: e.target.value })}
                className={inputCls}
                maxLength={64}
                placeholder="Today / Jan 14"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Latitude">
              <input
                type="number"
                step={0.0001}
                min={-90}
                max={90}
                value={pin.coords.lat}
                onChange={(e) =>
                  onUpdate({
                    coords: { ...pin.coords, lat: Number(e.target.value) || 0 },
                  })
                }
                className={inputCls}
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number"
                step={0.0001}
                min={-180}
                max={180}
                value={pin.coords.lng}
                onChange={(e) =>
                  onUpdate({
                    coords: { ...pin.coords, lng: Number(e.target.value) || 0 },
                  })
                }
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Address">
            <input
              value={pin.address}
              onChange={(e) => onUpdate({ address: e.target.value })}
              className={inputCls}
              maxLength={280}
            />
          </Field>
          <Field label="Comment (optional)">
            <textarea
              value={pin.comment ?? ''}
              onChange={(e) => onUpdate({ comment: e.target.value || undefined })}
              rows={2}
              className={`${inputCls} resize-none`}
              maxLength={1000}
            />
          </Field>
        </div>
      )}
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Countries tab                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function CountriesTab({
  guestbook,
  onChange,
}: {
  guestbook: GuestbookConfig;
  onChange: (next: GuestbookConfig) => void;
}) {
  const setList = (list: GuestbookCountry[]) => onChange({ ...guestbook, countries: list });

  const [draftCode, setDraftCode] = useState('');
  const [draftName, setDraftName] = useState('');

  const submit = () => {
    const code = draftCode.trim().toUpperCase();
    const name = draftName.trim();
    if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) return;
    if (name.length === 0) return;
    if (guestbook.countries.some((c) => c.code === code)) return;
    setList([...guestbook.countries, { code, name }]);
    setDraftCode('');
    setDraftName('');
  };

  return (
    <Group
      title="Countries"
      hint="ISO 3166-1 alpha-2 codes shown in the form dropdown for the form step."
    >
      <Reorder.Group
        axis="y"
        values={guestbook.countries}
        onReorder={setList}
        className="flex flex-col gap-1.5"
      >
        {guestbook.countries.map((c) => (
          <Reorder.Item
            key={c.code}
            value={c}
            className="flex cursor-grab items-center gap-2 rounded-md border border-zinc-200 bg-white px-2 py-1.5 active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <Globe className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <span className="rounded bg-zinc-100 px-1.5 py-0 font-mono text-[10.5px] font-bold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {c.code}
            </span>
            <span className="flex-1 text-[12.5px] text-zinc-700 dark:text-zinc-300">{c.name}</span>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setList(guestbook.countries.filter((x) => x.code !== c.code))}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
              aria-label={`Remove ${c.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-900/20">
        <input
          value={draftCode}
          onChange={(e) => setDraftCode(e.target.value.toUpperCase().slice(0, 2))}
          placeholder="US"
          className={`${inputCls} max-w-[60px] text-center font-mono uppercase`}
          maxLength={2}
        />
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="United States"
          className={inputCls}
          maxLength={64}
        />
        <button
          type="button"
          onClick={submit}
          disabled={
            draftCode.length !== 2 ||
            draftName.trim().length === 0 ||
            guestbook.countries.some((c) => c.code === draftCode)
          }
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:border-sky-500/40 hover:bg-sky-500/5 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400"
          aria-label="Add country"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </Group>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2.5 text-[12px] font-medium text-zinc-600 transition hover:border-sky-500/40 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-4 text-center text-[12px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/20">
      {text}
    </div>
  );
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
