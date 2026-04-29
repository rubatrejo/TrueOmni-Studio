'use client';

import { Reorder, useDragControls } from 'framer-motion';
import {
  Camera,
  Frame as FrameIcon,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Sticker as StickerIcon,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import {
  newPhotoBoothId,
  type PhotoBoothBackground,
  type PhotoBoothConfig,
  type PhotoBoothFilter,
  type PhotoBoothFrame,
  type PhotoBoothSticker,
} from '@/lib/studio/schema';

import { ImageField } from './ImageField';

type EditorTab = 'settings' | 'backgrounds' | 'frames' | 'filters' | 'stickers';

const TABS: Array<{ key: EditorTab; label: string; icon: typeof Camera }> = [
  { key: 'settings', label: 'Settings', icon: Camera },
  { key: 'backgrounds', label: 'Backgrounds', icon: ImageIcon },
  { key: 'frames', label: 'Frames', icon: FrameIcon },
  { key: 'filters', label: 'Filters', icon: Sparkles },
  { key: 'stickers', label: 'Stickers', icon: StickerIcon },
];

export function PhotoBoothEditor({
  photoBooth,
  onChange,
  onPreview,
}: {
  photoBooth: PhotoBoothConfig;
  onChange: (next: PhotoBoothConfig) => void;
  onPreview: () => void;
}) {
  const [tab, setTab] = useState<EditorTab>('settings');

  return (
    <div className="space-y-5">
      {/* Tab pills */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-900 dark:bg-zinc-900/40">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          const count =
            t.key === 'backgrounds'
              ? photoBooth.backgrounds.length
              : t.key === 'frames'
                ? photoBooth.frames.length
                : t.key === 'filters'
                  ? photoBooth.filters.length
                  : t.key === 'stickers'
                    ? photoBooth.stickers.length
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
              <Icon className="h-3.5 w-3.5" />
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

      {/* Preview button */}
      <button
        type="button"
        onClick={onPreview}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-[12px] font-medium text-sky-700 transition hover:bg-sky-500/20 dark:border-sky-400/30 dark:text-sky-300"
      >
        Preview Photo Booth
      </button>

      {tab === 'settings' && <SettingsTab photoBooth={photoBooth} onChange={onChange} />}
      {tab === 'backgrounds' && (
        <BackgroundsTab photoBooth={photoBooth} onChange={onChange} />
      )}
      {tab === 'frames' && <FramesTab photoBooth={photoBooth} onChange={onChange} />}
      {tab === 'filters' && <FiltersTab photoBooth={photoBooth} onChange={onChange} />}
      {tab === 'stickers' && <StickersTab photoBooth={photoBooth} onChange={onChange} />}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Settings                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function SettingsTab({
  photoBooth,
  onChange,
}: {
  photoBooth: PhotoBoothConfig;
  onChange: (next: PhotoBoothConfig) => void;
}) {
  const timer = photoBooth.timer ?? { enabled: true, default: 5, options: [3, 5, 10] };

  const setTimer = (patch: Partial<typeof timer>) =>
    onChange({ ...photoBooth, timer: { ...timer, ...patch } });

  const setSocial = (k: 'x' | 'facebook' | 'instagram', v: string) =>
    onChange({
      ...photoBooth,
      social: {
        ...(photoBooth.social ?? {}),
        [k]: v || undefined,
      },
    });

  return (
    <div className="space-y-6">
      <Group title="Timer" hint="Countdown shown before the camera fires.">
        <ToggleRow
          label="Enable timer"
          enabled={timer.enabled}
          onToggle={() => setTimer({ enabled: !timer.enabled })}
        />
        {timer.enabled && (
          <>
            <Field label="Available options (seconds)">
              <TimerOptionsEditor
                options={timer.options}
                defaultValue={timer.default}
                onChange={(opts, def) => setTimer({ options: opts, default: def })}
              />
            </Field>
          </>
        )}
      </Group>

      <Group title="Edge feather" hint="Smooths the green-screen mask edges (px).">
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-900 dark:bg-zinc-900/40">
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={photoBooth.edgeFeather ?? 3}
            onChange={(e) =>
              onChange({ ...photoBooth, edgeFeather: Number(e.target.value) })
            }
            className="flex-1 accent-sky-500"
          />
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-[11.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            {photoBooth.edgeFeather ?? 3}px
          </span>
        </div>
      </Group>

      <Group title="Share screen" hint="Customize the post-capture flow.">
        <Field label="Share URL template">
          <input
            value={photoBooth.shareUrlTemplate ?? ''}
            onChange={(e) =>
              onChange({
                ...photoBooth,
                shareUrlTemplate: e.target.value || undefined,
              })
            }
            placeholder="https://share.example.com/{id}"
            className={inputCls}
            maxLength={280}
          />
          <p className="mt-1 text-[10.5px] text-zinc-400 dark:text-zinc-600">
            <code>{'{id}'}</code> is replaced with the photo UUID at capture time.
          </p>
        </Field>

        <ImageField
          layout="compact"
          label="Share background"
          hint="Full-bleed bg of the share screen · 1080×1920"
          value={photoBooth.shareBackground}
          onChange={(v) => onChange({ ...photoBooth, shareBackground: v })}
          accept="image/jpeg,image/png,image/webp"
          maxBytes={1.5 * 1024 * 1024}
        />

        <ImageField
          layout="compact"
          label="Share card logo"
          hint="Branding inside the photo card · SVG/PNG"
          value={photoBooth.shareCardLogo}
          onChange={(v) => onChange({ ...photoBooth, shareCardLogo: v })}
        />
      </Group>

      <Group title="Social handles" hint="Shown in the Follow us strip on the share screen.">
        <Field label="Instagram">
          <input
            value={photoBooth.social?.instagram ?? ''}
            onChange={(e) => setSocial('instagram', e.target.value)}
            placeholder="@yourhandle"
            className={inputCls}
            maxLength={64}
          />
        </Field>
        <Field label="Facebook">
          <input
            value={photoBooth.social?.facebook ?? ''}
            onChange={(e) => setSocial('facebook', e.target.value)}
            placeholder="/yourpage"
            className={inputCls}
            maxLength={64}
          />
        </Field>
        <Field label="X / Twitter">
          <input
            value={photoBooth.social?.x ?? ''}
            onChange={(e) => setSocial('x', e.target.value)}
            placeholder="@yourhandle"
            className={inputCls}
            maxLength={64}
          />
        </Field>
      </Group>
    </div>
  );
}

function TimerOptionsEditor({
  options,
  defaultValue,
  onChange,
}: {
  options: number[];
  defaultValue: number;
  onChange: (opts: number[], def: number) => void;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const n = Number(draft);
    if (!Number.isInteger(n) || n < 0 || n > 60) return;
    if (options.includes(n)) {
      setDraft('');
      return;
    }
    const next = [...options, n].sort((a, b) => a - b);
    onChange(next, defaultValue);
    setDraft('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const isDefault = o === defaultValue;
          return (
            <span
              key={o}
              className={
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition ' +
                (isDefault
                  ? 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                  : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300')
              }
            >
              {!isDefault && (
                <button
                  type="button"
                  onClick={() => onChange(options, o)}
                  className="text-[10px] uppercase tracking-[0.14em] text-zinc-400 transition hover:text-sky-600 dark:hover:text-sky-300"
                >
                  default
                </button>
              )}
              <span className="font-mono">{o}s</span>
              <button
                type="button"
                onClick={() => {
                  const next = options.filter((x) => x !== o);
                  if (next.length === 0) return;
                  const def = next.includes(defaultValue) ? defaultValue : next[0];
                  onChange(next, def);
                }}
                disabled={options.length <= 1}
                className="grid h-4 w-4 place-items-center rounded-full text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={`Remove ${o}s`}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </span>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={60}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add seconds…"
          className={inputCls}
        />
        <button
          type="button"
          onClick={add}
          disabled={draft === ''}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:border-sky-500/40 hover:bg-sky-500/5 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400"
          aria-label="Add timer option"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Backgrounds                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function BackgroundsTab({
  photoBooth,
  onChange,
}: {
  photoBooth: PhotoBoothConfig;
  onChange: (next: PhotoBoothConfig) => void;
}) {
  const setList = (list: PhotoBoothBackground[]) =>
    onChange({ ...photoBooth, backgrounds: list });

  const update = (id: string, patch: Partial<PhotoBoothBackground>) =>
    setList(photoBooth.backgrounds.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const remove = (id: string) =>
    setList(photoBooth.backgrounds.filter((b) => b.id !== id));

  const add = () =>
    setList([
      ...photoBooth.backgrounds,
      {
        id: newPhotoBoothId('bg'),
        image: '',
        label: 'New background',
      },
    ]);

  return (
    <Group
      title="Backgrounds"
      hint="Green-screen replacement scenes shown in the carousel. The first one is &ldquo;Original&rdquo; (no image)."
    >
      <Reorder.Group axis="y" values={photoBooth.backgrounds} onReorder={setList} className="flex flex-col gap-2">
        {photoBooth.backgrounds.map((b) => (
          <ListReorderItem
            key={b.id}
            item={b}
            preview={b.image || undefined}
            previewKind="image"
            label={b.label}
            onRemove={photoBooth.backgrounds.length > 1 ? () => remove(b.id) : undefined}
            renderEditor={() => (
              <>
                <ImageField
                  layout="compact"
                  label="Image"
                  hint="JPG/PNG · empty = use original"
                  value={b.image || undefined}
                  onChange={(v) => update(b.id, { image: v ?? '' })}
                  accept="image/jpeg,image/png,image/webp"
                  maxBytes={1.5 * 1024 * 1024}
                />
                <Field label="Label">
                  <input
                    value={b.label}
                    onChange={(e) => update(b.id, { label: e.target.value })}
                    className={inputCls}
                    maxLength={64}
                  />
                </Field>
              </>
            )}
          />
        ))}
      </Reorder.Group>
      {photoBooth.backgrounds.length < 50 && (
        <AddButton label="Add background" onClick={add} />
      )}
    </Group>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Frames                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function FramesTab({
  photoBooth,
  onChange,
}: {
  photoBooth: PhotoBoothConfig;
  onChange: (next: PhotoBoothConfig) => void;
}) {
  const setList = (list: PhotoBoothFrame[]) => onChange({ ...photoBooth, frames: list });

  const update = (id: string, patch: Partial<PhotoBoothFrame>) =>
    setList(photoBooth.frames.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const remove = (id: string) => setList(photoBooth.frames.filter((f) => f.id !== id));

  const add = () =>
    setList([
      ...photoBooth.frames,
      {
        id: newPhotoBoothId('frame'),
        image: '',
        label: 'New frame',
      },
    ]);

  return (
    <Group
      title="Frames"
      hint="Transparent PNG overlays on top of the photo (1080×1920). Empty list hides the Frames tab."
    >
      {photoBooth.frames.length === 0 ? (
        <EmptyState text="No frames yet." />
      ) : (
        <Reorder.Group axis="y" values={photoBooth.frames} onReorder={setList} className="flex flex-col gap-2">
          {photoBooth.frames.map((f) => (
            <ListReorderItem
              key={f.id}
              item={f}
              preview={f.thumbnail ?? f.image ?? undefined}
              previewKind="image"
              label={f.label}
              onRemove={() => remove(f.id)}
              renderEditor={() => (
                <>
                  <ImageField
                    layout="compact"
                    label="Frame PNG"
                    hint="Transparent PNG · 1080×1920"
                    value={f.image || undefined}
                    onChange={(v) => update(f.id, { image: v ?? '' })}
                    accept="image/png"
                    maxBytes={1.5 * 1024 * 1024}
                  />
                  <ImageField
                    layout="compact"
                    label="Thumbnail (optional)"
                    hint="Square · shown in carousel"
                    value={f.thumbnail}
                    onChange={(v) => update(f.id, { thumbnail: v })}
                    accept="image/png,image/jpeg"
                    maxBytes={300 * 1024}
                  />
                  <Field label="Label">
                    <input
                      value={f.label}
                      onChange={(e) => update(f.id, { label: e.target.value })}
                      className={inputCls}
                      maxLength={64}
                    />
                  </Field>
                </>
              )}
            />
          ))}
        </Reorder.Group>
      )}
      {photoBooth.frames.length < 50 && <AddButton label="Add frame" onClick={add} />}
    </Group>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Filters                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

const FILTER_PRESETS: Array<{ label: string; cssFilter: string }> = [
  { label: 'Original', cssFilter: 'none' },
  { label: 'B&W', cssFilter: 'grayscale(1)' },
  { label: 'Sepia', cssFilter: 'sepia(0.8)' },
  { label: 'Warm', cssFilter: 'saturate(1.2) contrast(1.05)' },
  { label: 'Cool', cssFilter: 'hue-rotate(-15deg) saturate(1.05)' },
  { label: 'Vintage', cssFilter: 'sepia(0.4) contrast(1.05) brightness(0.95)' },
  { label: 'Vibrant', cssFilter: 'saturate(1.5) contrast(1.1)' },
  { label: 'Dramatic', cssFilter: 'contrast(1.25) brightness(0.92)' },
];

function FiltersTab({
  photoBooth,
  onChange,
}: {
  photoBooth: PhotoBoothConfig;
  onChange: (next: PhotoBoothConfig) => void;
}) {
  const setList = (list: PhotoBoothFilter[]) => onChange({ ...photoBooth, filters: list });

  const update = (id: string, patch: Partial<PhotoBoothFilter>) =>
    setList(photoBooth.filters.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const remove = (id: string) => setList(photoBooth.filters.filter((f) => f.id !== id));

  const addFromPreset = (p: (typeof FILTER_PRESETS)[number]) =>
    setList([
      ...photoBooth.filters,
      { id: newPhotoBoothId('filter'), label: p.label, cssFilter: p.cssFilter },
    ]);

  return (
    <div className="space-y-4">
      <Group
        title="Filters"
        hint="CSS filter strings applied to the photo. Empty list hides the Filters tab."
      >
        {photoBooth.filters.length === 0 ? (
          <EmptyState text="No filters yet — add one from the presets below." />
        ) : (
          <Reorder.Group axis="y" values={photoBooth.filters} onReorder={setList} className="flex flex-col gap-2">
            {photoBooth.filters.map((f) => (
              <ListReorderItem
                key={f.id}
                item={f}
                preview={f.cssFilter}
                previewKind="filter"
                label={f.label}
                onRemove={photoBooth.filters.length > 1 ? () => remove(f.id) : undefined}
                renderEditor={() => (
                  <>
                    <Field label="Label">
                      <input
                        value={f.label}
                        onChange={(e) => update(f.id, { label: e.target.value })}
                        className={inputCls}
                        maxLength={64}
                      />
                    </Field>
                    <Field label="CSS filter">
                      <input
                        value={f.cssFilter}
                        onChange={(e) => update(f.id, { cssFilter: e.target.value })}
                        placeholder="grayscale(1) contrast(1.1)"
                        className={`${inputCls} font-mono text-[11.5px]`}
                        maxLength={280}
                        spellCheck={false}
                      />
                    </Field>
                  </>
                )}
              />
            ))}
          </Reorder.Group>
        )}
      </Group>

      <Group title="Add from presets" hint="One-click add to the list above.">
        <div className="grid grid-cols-2 gap-1.5">
          {FILTER_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => addFromPreset(p)}
              className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-2 text-left transition hover:border-sky-500/40 hover:bg-sky-500/5 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-sky-500/5"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br from-zinc-300 to-zinc-500 text-[10px] font-bold text-white"
                style={{ filter: p.cssFilter === 'none' ? undefined : p.cssFilter }}
              >
                Aa
              </span>
              <div className="min-w-0">
                <div className="text-[12px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
                  {p.label}
                </div>
                <div className="truncate font-mono text-[10px] text-zinc-500 dark:text-zinc-500">
                  {p.cssFilter}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Group>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Stickers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function StickersTab({
  photoBooth,
  onChange,
}: {
  photoBooth: PhotoBoothConfig;
  onChange: (next: PhotoBoothConfig) => void;
}) {
  const setList = (list: PhotoBoothSticker[]) =>
    onChange({ ...photoBooth, stickers: list });

  const update = (id: string, patch: Partial<PhotoBoothSticker>) =>
    setList(photoBooth.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const remove = (id: string) =>
    setList(photoBooth.stickers.filter((s) => s.id !== id));

  const add = () =>
    setList([
      ...photoBooth.stickers,
      {
        id: newPhotoBoothId('sticker'),
        image: '',
        label: 'New sticker',
        defaultWidth: 200,
      },
    ]);

  return (
    <Group
      title="Stickers"
      hint="Tap-to-add stickers users can drag, resize and delete. Transparent PNG."
    >
      {photoBooth.stickers.length === 0 ? (
        <EmptyState text="No stickers yet." />
      ) : (
        <Reorder.Group axis="y" values={photoBooth.stickers} onReorder={setList} className="flex flex-col gap-2">
          {photoBooth.stickers.map((s) => (
            <ListReorderItem
              key={s.id}
              item={s}
              preview={s.image || undefined}
              previewKind="image"
              label={s.label}
              onRemove={() => remove(s.id)}
              renderEditor={() => (
                <>
                  <ImageField
                    layout="compact"
                    label="Sticker PNG"
                    hint="Transparent PNG"
                    value={s.image || undefined}
                    onChange={(v) => update(s.id, { image: v ?? '' })}
                    accept="image/png"
                    maxBytes={500 * 1024}
                  />
                  <Field label="Label">
                    <input
                      value={s.label}
                      onChange={(e) => update(s.id, { label: e.target.value })}
                      className={inputCls}
                      maxLength={64}
                    />
                  </Field>
                  <Field label="Default width (px @ 1080×1920)">
                    <input
                      type="number"
                      min={50}
                      max={800}
                      value={s.defaultWidth ?? 200}
                      onChange={(e) =>
                        update(s.id, {
                          defaultWidth: Math.max(
                            50,
                            Math.min(800, Number(e.target.value) || 200),
                          ),
                        })
                      }
                      className={inputCls}
                    />
                  </Field>
                </>
              )}
            />
          ))}
        </Reorder.Group>
      )}
      {photoBooth.stickers.length < 50 && <AddButton label="Add sticker" onClick={add} />}
    </Group>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Generic reorder list item                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

interface IdItem {
  id: string;
}

function ListReorderItem<T extends IdItem>({
  item,
  preview,
  previewKind,
  label,
  onRemove,
  renderEditor,
}: {
  item: T;
  preview?: string;
  previewKind: 'image' | 'filter';
  label: string;
  onRemove?: () => void;
  renderEditor: () => React.ReactNode;
}) {
  const dragControls = useDragControls();
  const [expanded, setExpanded] = useState(false);

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-900 dark:bg-zinc-900/40"
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-400 transition hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={`Drag ${label}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="grid h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          {previewKind === 'image' && preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : previewKind === 'filter' ? (
            <span
              className="grid h-full w-full place-items-center bg-gradient-to-br from-zinc-300 to-zinc-500 text-[9px] font-bold text-white"
              style={{ filter: preview === 'none' ? undefined : preview }}
            >
              Aa
            </span>
          ) : (
            <div className="grid h-full w-full place-items-center text-zinc-400">
              <ImageIcon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="truncate font-display text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
            {label || <em className="text-zinc-400">No label</em>}
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-600">
            id · {item.id}
          </div>
        </button>
        {onRemove && (
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
          {renderEditor()}
        </div>
      )}
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                    */
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

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-left transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <span className="text-[12px] text-zinc-700 dark:text-zinc-300">{label}</span>
      <span
        className={
          'relative flex h-5 w-9 shrink-0 items-center rounded-full transition ' +
          (enabled ? 'bg-sky-500/90' : 'bg-zinc-200 dark:bg-zinc-800')
        }
      >
        <span
          className={
            'h-4 w-4 transform rounded-full bg-white shadow-sm transition ' +
            (enabled ? 'translate-x-[18px]' : 'translate-x-0.5')
          }
        />
      </span>
    </button>
  );
}
