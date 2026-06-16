'use client';

import { Reorder } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { isTextFrame } from '@/lib/studio/photobooth-frame-meta';
import {
  newPhotoBoothId,
  type PhotoBoothBackground,
  type PhotoBoothConfig,
  type PhotoBoothFilter,
  type PhotoBoothFrame,
  type PhotoBoothSticker,
} from '@/lib/studio/schema';

import { useStudioSlug } from '../../_lib/slug-context';
import { ImageField } from '../ImageField';

import {
  AddButton,
  ChromaPreview,
  EmptyState,
  Field,
  Group,
  ListReorderItem,
  ToggleRow,
  inputCls,
} from './shared';

/* ────────────────────────────────────────────────────────────────────────── */
/* PhotoBooth — tabs (F-QA-1: extraídos de PhotoBoothEditor).                  */
/* ────────────────────────────────────────────────────────────────────────── */

export function SettingsTab({
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
            onChange={(e) => onChange({ ...photoBooth, edgeFeather: Number(e.target.value) })}
            className="flex-1 accent-sky-500"
          />
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-[11.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            {photoBooth.edgeFeather ?? 3}px
          </span>
        </div>
        <ChromaPreview photoBooth={photoBooth} />
      </Group>

      <Group
        title="Camera zoom"
        hint="Values >1× crop in (digital zoom). Values <1× request a wider field of view via the WebRTC zoom constraint — only takes effect on PTZ/wide-angle cameras that support it. With a regular webcam, <1× has no visual effect (the kiosk frame stays intact). >1× always works."
      >
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-900 dark:bg-zinc-900/40">
          <span className="font-mono text-[10.5px] text-zinc-400 dark:text-zinc-600">0.5×</span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.05}
            value={photoBooth.cameraZoom ?? 1}
            onChange={(e) => onChange({ ...photoBooth, cameraZoom: Number(e.target.value) })}
            className="flex-1 accent-sky-500"
            aria-label="Camera zoom"
          />
          <span className="font-mono text-[10.5px] text-zinc-400 dark:text-zinc-600">2×</span>
          <span className="min-w-[48px] rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-center font-mono text-[11.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            {(photoBooth.cameraZoom ?? 1).toFixed(2)}×
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { v: 0.6, label: 'Group (0.6×)' },
            { v: 0.8, label: 'Wide (0.8×)' },
            { v: 1, label: 'Default (1×)' },
            { v: 1.3, label: 'Portrait (1.3×)' },
          ].map((preset) => (
            <button
              key={preset.v}
              type="button"
              onClick={() => onChange({ ...photoBooth, cameraZoom: preset.v })}
              className={
                'rounded-md border px-2 py-1 text-[11px] font-medium transition ' +
                (Math.abs((photoBooth.cameraZoom ?? 1) - preset.v) < 0.01
                  ? 'border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800')
              }
            >
              {preset.label}
            </button>
          ))}
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
    // Un timer de 0s no tiene sentido (la cámara dispararía sin cuenta atrás).
    if (!Number.isInteger(n) || n < 1 || n > 60) return;
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
          min={1}
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

export function BackgroundsTab({
  photoBooth,
  onChange,
}: {
  photoBooth: PhotoBoothConfig;
  onChange: (next: PhotoBoothConfig) => void;
}) {
  const setList = (list: PhotoBoothBackground[]) => onChange({ ...photoBooth, backgrounds: list });

  const update = (id: string, patch: Partial<PhotoBoothBackground>) =>
    setList(photoBooth.backgrounds.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const remove = (id: string) => setList(photoBooth.backgrounds.filter((b) => b.id !== id));

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
      <Reorder.Group
        axis="y"
        values={photoBooth.backgrounds}
        onReorder={setList}
        className="flex flex-col gap-2"
      >
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
      {photoBooth.backgrounds.length < 50 && <AddButton label="Add background" onClick={add} />}
    </Group>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Frames                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export function FramesTab({
  photoBooth,
  onChange,
}: {
  photoBooth: PhotoBoothConfig;
  onChange: (next: PhotoBoothConfig) => void;
}) {
  const slug = useStudioSlug();
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Regenera los frames branded en el server (escribe el cfg en KV). Tras éxito
  // recargamos para traer los frames nuevos (mismo patrón que el revert de
  // Versions). No pisa los frames subidos a mano (source !== 'branded-auto').
  const generateBranded = async () => {
    if (!slug || generating) return;
    setGenerating(true);
    setGenError(null);
    try {
      // Manda los textos ACTUALES del editor (por templateId) para que el cambio
      // se hornee aunque el config no se haya guardado todavía en KV.
      const text: Record<string, string> = {};
      for (const f of photoBooth.frames) {
        if (f.source === 'branded-auto' && f.templateId && typeof f.text === 'string') {
          text[f.templateId] = f.text;
        }
      }
      const res = await fetch(`/api/studio/clients/${slug}/content/photobooth-frames`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        frames?: PhotoBoothFrame[];
      };
      if (!res.ok) {
        throw new Error(body.error ?? `Generation failed (${res.status})`);
      }
      // Refresca los frames en el estado SIN recargar (recargar mandaba el
      // preview al idle y sacaba al operador de la pantalla). El bridge propaga
      // el nuevo config al preview en vivo.
      if (body.frames) {
        lastBakedText.current = JSON.stringify(
          body.frames
            .filter((f) => f.source === 'branded-auto' && f.templateId)
            .map((f) => [f.templateId, f.text ?? '']),
        );
        onChange({ ...photoBooth, frames: body.frames });
      }
      setGenerating(false);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Generation failed');
      setGenerating(false);
    }
  };

  // Auto-regenera los frames branded cuando cambia su TEXTO (el texto va horneado
  // en el PNG → hay que re-renderizar para que se vea). Debounce tras dejar de
  // escribir; el `ref` guarda el último estado horneado para no regenerar al
  // montar ni en bucle. (Fix: "cambio el texto y no se refleja en el frame".)
  const textSig = JSON.stringify(
    photoBooth.frames
      .filter((f) => f.source === 'branded-auto' && f.templateId)
      .map((f) => [f.templateId, f.text ?? '']),
  );
  const lastBakedText = useRef<string | null>(null);
  useEffect(() => {
    if (lastBakedText.current === null) {
      lastBakedText.current = textSig; // montaje: ya está horneado, no regenerar
      return;
    }
    if (lastBakedText.current === textSig) return;
    const t = setTimeout(() => {
      lastBakedText.current = textSig;
      void generateBranded();
    }, 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textSig]);

  // El botón "Generate" solo aparece la PRIMERA vez (mientras no haya frames
  // branded-auto). Una vez generados, se oculta (feedback Rubén): regenerar a
  // mano desincronizaba el estado y reintroducía los frames viejos. Editar el
  // texto de un frame lo re-hornea automáticamente (no necesita el botón).
  const hasBrandedAuto = photoBooth.frames.some((f) => f.source === 'branded-auto');

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
        // Subido a mano → 'custom': "Generate branded frames" lo conserva
        // (a diferencia de los del theme o los branded-auto, que se reemplazan).
        source: 'custom',
      },
    ]);

  return (
    <Group
      title="Frames"
      hint="Transparent PNG overlays on top of the photo (1080×1920). Empty list hides the Frames tab."
    >
      <div className="mb-3 space-y-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5">
        {hasBrandedAuto ? (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Branded frames were generated from this client&apos;s brand colors, logo and website
            photo{generating ? ' · re-baking…' : ''}. Edit a frame&apos;s text below to re-bake it
            automatically. Frames you uploaded by hand are kept.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={generateBranded}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
            >
              {generating ? 'Generating…' : 'Generate branded frames'}
            </button>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Auto-creates frames from this client&apos;s brand colors, logo and website photo. Each
              frame&apos;s text (phrase / hashtag) is editable below once generated. Frames you
              uploaded by hand are kept.
            </p>
          </>
        )}
        {genError ? <p className="text-[11px] text-red-500">{genError}</p> : null}
      </div>
      {photoBooth.frames.length === 0 ? (
        <EmptyState text="No frames yet." />
      ) : (
        <Reorder.Group
          axis="y"
          values={photoBooth.frames}
          onReorder={setList}
          className="flex flex-col gap-2"
        >
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
                  {f.source === 'branded-auto' && isTextFrame(f.templateId) ? (
                    <Field label="Text (phrase / hashtag)">
                      <input
                        value={f.text ?? ''}
                        onChange={(e) => update(f.id, { text: e.target.value })}
                        className={inputCls}
                        maxLength={160}
                        placeholder="Visit DeKalb"
                      />
                      <p className="mt-1 text-[10.5px] text-zinc-400 dark:text-zinc-600">
                        Re-bakes the frame automatically a moment after you stop typing.
                      </p>
                    </Field>
                  ) : null}
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

export function FiltersTab({
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
          <Reorder.Group
            axis="y"
            values={photoBooth.filters}
            onReorder={setList}
            className="flex flex-col gap-2"
          >
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

export function StickersTab({
  photoBooth,
  onChange,
}: {
  photoBooth: PhotoBoothConfig;
  onChange: (next: PhotoBoothConfig) => void;
}) {
  const setList = (list: PhotoBoothSticker[]) => onChange({ ...photoBooth, stickers: list });

  const update = (id: string, patch: Partial<PhotoBoothSticker>) =>
    setList(photoBooth.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const remove = (id: string) => setList(photoBooth.stickers.filter((s) => s.id !== id));

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
        <Reorder.Group
          axis="y"
          values={photoBooth.stickers}
          onReorder={setList}
          className="flex flex-col gap-2"
        >
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
                          defaultWidth: Math.max(50, Math.min(800, Number(e.target.value) || 200)),
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
