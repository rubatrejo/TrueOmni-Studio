'use client';

import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { getTemplatesForGrid } from '@/components/video-walls/templates/registry';
import '@/components/video-walls/templates/load-templates';
import type {
  VideoWallConfig,
  VideoWallModuleInstance,
  VideoWallSlide,
  VideoWallSlotConfig,
} from '@/lib/video-walls/schema';

/**
 * VW6 — Editor de playlist del wall. CRUD básico de slides:
 *   - Add slide: elige template del grid; auto-inicializa slots con
 *     módulos vacíos del primer kind aceptado por cada slot.
 *   - Remove slide.
 *   - Move up/down.
 *   - Edit slide: pick template / change module per slot.
 *
 * Persiste vía PUT /api/studio/video-walls/walls/[c]/[w] con debounce 800ms.
 *
 * Drag-drop reordering: queda fuera de v1 (los botones up/down son
 * suficientes para playlists < 20 slides; signage añadirá drag-drop
 * cuando un cliente real lo pida).
 */
export interface PlaylistPanelProps {
  clientSlug: string;
  wall: VideoWallConfig;
  onWallChange: (next: VideoWallConfig) => void;
  /** Slide actualmente visible en el iframe preview. Resaltado en la lista. */
  activeSlideId?: string | null;
  /** Click en una slide → notifica al editor para sync con iframe preview. */
  onSelectSlide?: (slideId: string) => void;
}

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

  useEffect(() => {
    setDraft(wall);
  }, [wall]);

  // Autosave debounce
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

  const moveSlide = (id: string, dir: -1 | 1) => {
    updateDraft((d) => {
      const i = d.playlist.findIndex((s) => s.id === id);
      if (i < 0) return d;
      const j = i + dir;
      if (j < 0 || j >= d.playlist.length) return d;
      const next = [...d.playlist];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...d, playlist: next };
    });
  };

  const setSlotModuleUrl = (slideId: string, slotKey: string, url: string) => {
    updateDraft((d) => ({
      ...d,
      playlist: d.playlist.map((s) =>
        s.id === slideId
          ? {
              ...s,
              slots: s.slots.map((sl) =>
                sl.slotKey === slotKey ? { ...sl, module: setUrlOf(sl.module, url) } : sl,
              ),
            }
          : s,
      ),
    }));
  };

  const templates = getTemplatesForGrid(wall.grid).filter((t) => t.category !== 'placeholder');

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">
          {draft.playlist.length} slide{draft.playlist.length === 1 ? '' : 's'}
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

      <div className="flex-1 overflow-auto p-3">
        {draft.playlist.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-[12px] text-zinc-500 dark:border-zinc-700">
            No slides yet. Pick a template below to add one.
          </div>
        ) : (
          <ul className="space-y-2">
            {draft.playlist.map((slide, i) => {
              const isActive = activeSlideId === slide.id;
              return (
                <li
                  key={slide.id}
                  className={`rounded-lg border p-3 text-[12px] transition ${
                    isActive
                      ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/20 dark:border-sky-500/70 dark:bg-sky-500/10 dark:ring-sky-500/30'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectSlide?.(slide.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div
                        className={`font-semibold ${isActive ? 'text-sky-900 dark:text-sky-100' : 'text-zinc-900 dark:text-white'}`}
                      >
                        {i + 1}. {slide.templateId}
                      </div>
                      <div className="text-[10.5px] text-zinc-500">
                        {slide.slots.length} slot{slide.slots.length === 1 ? '' : 's'} ·{' '}
                        {(slide.durationMs / 1000).toFixed(1)}s
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <IconBtn onClick={() => moveSlide(slide.id, -1)} label="Move up">
                        <ArrowUp className="h-3 w-3" />
                      </IconBtn>
                      <IconBtn onClick={() => moveSlide(slide.id, 1)} label="Move down">
                        <ArrowDown className="h-3 w-3" />
                      </IconBtn>
                      <IconBtn onClick={() => removeSlide(slide.id)} label="Remove" tone="danger">
                        <Trash2 className="h-3 w-3" />
                      </IconBtn>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {slide.slots.map((slot) => (
                      <SlotEditor
                        key={slot.slotKey}
                        slot={slot}
                        onUrlChange={(url) => setSlotModuleUrl(slide.id, slot.slotKey, url)}
                      />
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
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
  onUrlChange: (url: string) => void;
}) {
  const kind = slot.module.kind;
  const hasUrl = kind === 'video-image' || kind === 'ads';
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 truncate font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {slot.slotKey}
      </span>
      <span className="w-20 shrink-0 truncate rounded bg-zinc-100 px-1.5 py-0.5 text-center font-mono text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        {kind}
      </span>
      {hasUrl ? (
        <input
          type="text"
          value={
            (slot.module.kind === 'video-image' || slot.module.kind === 'ads'
              ? slot.module.asset.url
              : '') ?? ''
          }
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="asset URL or path"
          className="min-w-0 flex-1 rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[10.5px] text-zinc-800 outline-none focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
        />
      ) : (
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
      )}
    </div>
  );
}

function IconBtn({
  onClick,
  label,
  tone = 'neutral',
  children,
}: {
  onClick: () => void;
  label: string;
  tone?: 'neutral' | 'danger';
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-6 w-6 place-items-center rounded transition ${
        tone === 'danger'
          ? 'text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400'
          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
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

function setUrlOf(module: VideoWallModuleInstance, url: string): VideoWallModuleInstance {
  if (module.kind === 'video-image') {
    return { ...module, asset: { ...module.asset, url } };
  }
  if (module.kind === 'ads') {
    return { ...module, asset: { ...module.asset, url } };
  }
  return module;
}
