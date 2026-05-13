'use client';

import { ChevronDown, ChevronRight, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState, type DragEvent } from 'react';

import { SignageMediaField } from '@/app/studio/digital-displays/_components/display/modules/SignageMediaField';
import { getTemplatesForGrid } from '@/components/video-walls/templates/registry';
import '@/components/video-walls/templates/load-templates';
import type {
  VideoWallConfig,
  VideoWallModuleInstance,
  VideoWallSlide,
  VideoWallSlotConfig,
} from '@/lib/video-walls/schema';

/**
 * `<PlaylistPanel>` (Video Walls) — clone funcional del PlaylistPanel del
 * Digital Displays adaptado al schema `VideoWallSlide`.
 *
 * Features (paridad funcional con DD):
 *   - Lista de slides con drag handle + chevron expand/collapse + número
 *     + label del template + trash.
 *   - Slide row colapsada: duration input (segundos) + transition select
 *     (cut/fade/slide-left/slide-up) + schedule pill ("always").
 *   - Slide row expandida: lista de slots con kind + asset URL editable
 *     (video-image / ads) o placeholder (events/social/news heredan data).
 *   - Drag-drop para reordenar (HTML5 nativo, sin librería externa).
 *   - Highlight del slide activo (mismo color que el iframe preview).
 *   - Click en una slide row → navega iframe a ese slide (`?slide=N`).
 *   - Autosave KV 800ms después del último cambio.
 */
export interface PlaylistPanelProps {
  clientSlug: string;
  wall: VideoWallConfig;
  onWallChange: (next: VideoWallConfig) => void;
  activeSlideId?: string | null;
  onSelectSlide?: (slideId: string) => void;
}

type Transition = NonNullable<VideoWallSlide['transition']>;

const TRANSITION_OPTIONS: { value: Transition; label: string }[] = [
  { value: 'cut', label: 'cut' },
  { value: 'fade', label: 'fade' },
  { value: 'slide-left', label: 'slide-left' },
  { value: 'slide-up', label: 'slide-up' },
];

export function PlaylistPanel({
  clientSlug,
  wall,
  onWallChange,
  activeSlideId,
  onSelectSlide,
}: PlaylistPanelProps) {
  const [draft, setDraft] = useState<VideoWallConfig>(wall);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    setDraft(wall);
  }, [wall]);

  useEffect(() => {
    if (draft === wall) return;
    const t = window.setTimeout(async () => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch(`/api/studio/video-walls/walls/${clientSlug}/${wall.slug}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ wall: draft }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        onWallChange(draft);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed');
      } finally {
        setSaving(false);
      }
    }, 800);
    return () => window.clearTimeout(t);
  }, [draft, wall, clientSlug, onWallChange]);

  const updateDraft = useCallback(
    (mut: (d: VideoWallConfig) => VideoWallConfig) => setDraft((d) => mut(d)),
    [],
  );

  const toggleExpand = (id: string) =>
    setExpandedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addSlide = (templateId: string) => {
    const template = getTemplatesForGrid(wall.grid).find((t) => t.id === templateId);
    if (!template) return;
    const slots: VideoWallSlotConfig[] = template.slots.map((s) => ({
      slotKey: s.key,
      module: defaultModuleFor(s.acceptedModules[0] ?? 'video-image'),
    }));
    const newSlide: VideoWallSlide = {
      id: `slide-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      templateId,
      slots,
      durationMs: wall.settings.defaultDurationMs,
      schedule: { kind: 'always', hideOutsideSchedule: true },
    };
    updateDraft((d) => ({ ...d, playlist: [...d.playlist, newSlide] }));
  };

  const removeSlide = (id: string) => {
    updateDraft((d) => ({ ...d, playlist: d.playlist.filter((s) => s.id !== id) }));
  };

  const reorderSlides = (fromIdx: number, toIdx: number) => {
    updateDraft((d) => {
      if (fromIdx < 0 || fromIdx >= d.playlist.length) return d;
      if (toIdx < 0 || toIdx >= d.playlist.length) return d;
      const next = [...d.playlist];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return { ...d, playlist: next };
    });
  };

  const updateSlide = (id: string, mut: (s: VideoWallSlide) => VideoWallSlide) => {
    updateDraft((d) => ({
      ...d,
      playlist: d.playlist.map((s) => (s.id === id ? mut(s) : s)),
    }));
  };

  const setSlotModuleUrl = (
    slideId: string,
    slotKey: string,
    url: string,
    kind?: 'image' | 'video',
  ) => {
    updateSlide(slideId, (s) => ({
      ...s,
      slots: s.slots.map((sl) =>
        sl.slotKey === slotKey ? { ...sl, module: setUrlOf(sl.module, url, kind) } : sl,
      ),
    }));
  };

  const templates = getTemplatesForGrid(wall.grid).filter((t) => t.category !== 'placeholder');

  function handleDragStart(idx: number) {
    setDragFromIdx(idx);
  }
  function handleDragOver(idx: number, e: DragEvent<HTMLLIElement>) {
    e.preventDefault();
    if (dragFromIdx === null) return;
    setDragOverIdx(idx);
  }
  function handleDrop(idx: number) {
    if (dragFromIdx !== null && dragFromIdx !== idx) {
      reorderSlides(dragFromIdx, idx);
    }
    setDragFromIdx(null);
    setDragOverIdx(null);
  }
  function handleDragEnd() {
    setDragFromIdx(null);
    setDragOverIdx(null);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header con count + saving indicator */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-white">Slides</h3>
          <p className="text-[11px] text-zinc-500">
            {draft.playlist.length} slide{draft.playlist.length === 1 ? '' : 's'} · drag to reorder
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          {saving && (
            <span className="inline-flex items-center gap-1 text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving
            </span>
          )}
          {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
        </div>
      </div>

      {/* Lista de slides */}
      <div className="flex-1 overflow-auto">
        {draft.playlist.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-[12px] text-zinc-500 dark:border-zinc-700">
            No slides yet. Pick a template below to add one.
          </div>
        ) : (
          <ul className="space-y-2">
            {draft.playlist.map((slide, i) => {
              const isActive = activeSlideId === slide.id;
              const isExpanded = expandedIds.has(slide.id);
              const isDragOver = dragOverIdx === i && dragFromIdx !== i;
              return (
                <li
                  key={slide.id}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(i, e)}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={handleDragEnd}
                  className={`rounded-lg border text-[12px] transition ${
                    isActive
                      ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/20 dark:border-sky-500/70 dark:bg-sky-500/10 dark:ring-sky-500/30'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700'
                  } ${isDragOver ? 'border-t-4 border-t-sky-500' : ''}`}
                >
                  {/* Row 1: drag handle + chevron + index + label + delete */}
                  <div className="flex items-center gap-1.5 px-2.5 py-2">
                    <button
                      type="button"
                      className="cursor-grab text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:hover:text-zinc-200"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(slide.id)}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      className="grid h-5 w-5 place-items-center rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectSlide?.(slide.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-semibold ${
                          isActive
                            ? 'bg-sky-500 text-white'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`min-w-0 flex-1 truncate font-medium ${
                          isActive
                            ? 'text-sky-900 dark:text-sky-100'
                            : 'text-zinc-900 dark:text-white'
                        }`}
                      >
                        {labelFromTemplate(slide.templateId)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlide(slide.id)}
                      aria-label="Remove slide"
                      title="Remove slide"
                      className="grid h-6 w-6 place-items-center rounded text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Row 2: duration + transition + schedule */}
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-200 px-2.5 py-2 text-[11px] dark:border-zinc-800">
                    <label className="inline-flex items-center gap-1 text-zinc-500">
                      duration
                      <input
                        type="number"
                        min={1}
                        max={600}
                        step={1}
                        value={Math.round(slide.durationMs / 1000)}
                        onChange={(e) => {
                          const sec = Math.max(
                            1,
                            Math.min(600, Number.parseInt(e.target.value, 10) || 1),
                          );
                          updateSlide(slide.id, (s) => ({ ...s, durationMs: sec * 1000 }));
                        }}
                        className="w-12 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-center font-mono text-[11px] text-zinc-700 outline-none focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                      />
                      <span>s</span>
                    </label>
                    <select
                      value={slide.transition ?? draft.settings.defaultTransition}
                      onChange={(e) => {
                        const v = e.target.value as Transition;
                        updateSlide(slide.id, (s) => ({ ...s, transition: v }));
                      }}
                      className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[11px] text-sky-600 outline-none focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-sky-300"
                    >
                      {TRANSITION_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <span
                      className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[10.5px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                      title="Schedule (always = active 24/7)"
                    >
                      {slide.schedule.kind}
                    </span>
                  </div>

                  {/* Expanded: slot editor */}
                  {isExpanded ? (
                    <div className="space-y-1.5 border-t border-zinc-200 px-2.5 py-2 dark:border-zinc-800">
                      {slide.slots.map((slot) => (
                        <SlotEditor
                          key={slot.slotKey}
                          slot={slot}
                          onUrlChange={(url, kind) =>
                            setSlotModuleUrl(slide.id, slot.slotKey, url, kind)
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add slide */}
      <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <div className="mb-2 text-[10.5px] uppercase tracking-wider text-zinc-500">
          Add slide ({wall.grid})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => addSlide(t.id)}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-sky-500/60 dark:hover:bg-sky-500/10 dark:hover:text-sky-200"
            >
              <Plus className="h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlotEditor({
  slot,
  onUrlChange,
}: {
  slot: VideoWallSlotConfig;
  onUrlChange: (url: string, kind?: 'image' | 'video') => void;
}) {
  const kind = slot.module.kind;
  const currentUrl =
    slot.module.kind === 'video-image' || slot.module.kind === 'ads' ? slot.module.asset.url : '';
  const currentAssetKind =
    slot.module.kind === 'video-image' || slot.module.kind === 'ads'
      ? slot.module.asset.kind
      : 'image';

  if (kind === 'video-image' || kind === 'ads') {
    return (
      <div className="rounded border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {slot.slotKey}
          </span>
          <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {kind}
          </span>
        </div>
        <SignageMediaField
          label="Asset"
          hint={
            kind === 'ads'
              ? 'Imagen o video del ad. Sube un archivo (≤5MB) o pega un path/URL.'
              : 'Imagen o video. Sube un archivo (≤5MB) o pega un path/URL.'
          }
          aspect="16/9"
          value={currentUrl || undefined}
          kind={currentAssetKind}
          onChange={(next: { src: string; kind: 'image' | 'video' } | undefined) => {
            if (next) {
              onUrlChange(next.src, next.kind);
            } else {
              onUrlChange('', 'image');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 truncate font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {slot.slotKey}
      </span>
      <span className="w-20 shrink-0 truncate rounded bg-zinc-100 px-1.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        {kind}
      </span>
      <span className="flex-1 truncate text-[10.5px] text-zinc-500">
        uses client data (
        {kind === 'events'
          ? 'events.json'
          : kind === 'social'
            ? 'social.json'
            : kind === 'news'
              ? 'news.json'
              : 'client config'}
        )
      </span>
    </div>
  );
}

function defaultModuleFor(kind: VideoWallModuleInstance['kind']): VideoWallModuleInstance {
  switch (kind) {
    case 'video-image':
      return { kind: 'video-image', asset: { url: '', kind: 'image' }, loop: true, fit: 'cover' };
    case 'ads':
      return { kind: 'ads', asset: { url: '', kind: 'image' }, weight: 1 };
    case 'events':
      return { kind: 'events', layout: 'hero-grid', maxItems: 5 };
    case 'social':
      return {
        kind: 'social',
        layout: 'grid-tweet',
        maxPosts: 9,
        rotationIntervalSec: 8,
      };
    case 'news':
      return { kind: 'news', layout: 'icon-headline-body' };
    case 'weather':
      return { kind: 'weather', layout: 'compact' };
    default:
      return { kind: 'video-image', asset: { url: '', kind: 'image' }, loop: true, fit: 'cover' };
  }
}

function setUrlOf(
  module: VideoWallModuleInstance,
  url: string,
  kind?: 'image' | 'video',
): VideoWallModuleInstance {
  if (module.kind === 'video-image') {
    return { ...module, asset: { ...module.asset, url, kind: kind ?? module.asset.kind } };
  }
  if (module.kind === 'ads') {
    return { ...module, asset: { ...module.asset, url, kind: kind ?? module.asset.kind } };
  }
  return module;
}

/** "02-video-image-ad" → "Video/Image + Ad". */
function labelFromTemplate(templateId: string): string {
  const stripped = templateId.replace(/^\d+-/, '');
  return stripped
    .split('-')
    .map((part) => {
      if (part === 'video' || part === 'image') return 'Video/Image';
      if (part === 'ad' || part === 'ads') return 'Ad';
      if (part === 'social' || part === 'wall') return 'Social';
      if (part === 'events') return 'Events';
      if (part === 'full') return 'Full';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .join(' + ');
}
