'use client';

import { ChevronDown, ChevronRight, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';

import '@/components/video-walls/templates/load-templates';
import type {
  VideoWallConfig,
  VideoWallSlide,
  VideoWallSlideSchedule,
  VideoWallSlotConfig,
} from '@/lib/video-walls/schema';

import { AddSlideModal } from './AddSlideModal';
import { PlaylistsBar } from './PlaylistsBar';
import { SchedulePopover } from './SchedulePopover';
import { SlideRowExpanded } from './SlideRowExpanded';

/**
 * `<PlaylistPanel>` (Video Walls) — orquestador editable del playlist.
 *
 * Soporta múltiples playlists con tabs estilo kiosk (PlaylistsBar):
 *  - `wall.playlists[]` + `wall.activePlaylistId` son la fuente de verdad.
 *  - `wall.playlist[]` se mantiene sincronizado con la playlist activa para
 *    retro-compat con clientes/runtime que aún no migraron al schema nuevo.
 *
 * Migración legacy → multi-playlist:
 *  - Si llega un wall sin `playlists[]`, sintetizamos `[{ id: 'main', name:
 *    'Main', slides: wall.playlist }]` y activamos esa playlist.
 *  - El operador puede añadir más playlists; persistimos ambos campos
 *    (`playlists[]` + `playlist[]` con la activa) en cada autosave.
 *
 * Compone `<AddSlideModal>` + `<SchedulePopover>` + `<SlideRowExpanded>`.
 * Drag/drop HTML5 nativo, autosave 800ms, navegación iframe `?slide=N`,
 * highlight del slide activo, expand/collapse y delete.
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

// ---------------------------------------------------------------------------
//  Helpers de normalización multi-playlist
// ---------------------------------------------------------------------------

/**
 * Devuelve un wall normalizado: con `playlists[]` siempre populado y
 * `activePlaylistId` válido. Mantiene `playlist` sincronizado con la activa.
 */
function normalizeWall(wall: VideoWallConfig): VideoWallConfig {
  const cloned: VideoWallConfig = { ...wall };
  let playlists = cloned.playlists ?? [];
  if (playlists.length === 0) {
    playlists = [{ id: 'main', name: 'Main', slides: cloned.playlist ?? [] }];
    cloned.activePlaylistId = 'main';
  } else if (!cloned.activePlaylistId || !playlists.some((p) => p.id === cloned.activePlaylistId)) {
    cloned.activePlaylistId = playlists[0].id;
  }
  cloned.playlists = playlists;
  const active = playlists.find((p) => p.id === cloned.activePlaylistId);
  cloned.playlist = active ? [...active.slides] : [];
  return cloned;
}

/** Actualiza la playlist activa y mantiene `playlist` sincronizado. */
function withActiveSlides(wall: VideoWallConfig, nextSlides: VideoWallSlide[]): VideoWallConfig {
  const playlists = (wall.playlists ?? []).map((p) =>
    p.id === wall.activePlaylistId ? { ...p, slides: nextSlides } : p,
  );
  return { ...wall, playlists, playlist: nextSlides };
}

function getActiveSlides(wall: VideoWallConfig): VideoWallSlide[] {
  const active = (wall.playlists ?? []).find((p) => p.id === wall.activePlaylistId);
  return active?.slides ?? wall.playlist ?? [];
}

function makePlaylistId(existing: { id: string }[]): string {
  let i = existing.length + 1;
  let id = `pl-${i}`;
  while (existing.some((p) => p.id === id)) {
    i += 1;
    id = `pl-${i}`;
  }
  return id;
}

// ---------------------------------------------------------------------------
//  PlaylistPanel
// ---------------------------------------------------------------------------

export function PlaylistPanel({
  clientSlug,
  wall,
  onWallChange,
  activeSlideId,
  onSelectSlide,
}: PlaylistPanelProps) {
  const [draft, setDraft] = useState<VideoWallConfig>(() => normalizeWall(wall));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [scheduleOpenForId, setScheduleOpenForId] = useState<string | null>(null);
  const [scheduleAnchor, setScheduleAnchor] = useState<DOMRect | null>(null);

  // Sync desde props (e.g. cambio de grid externo). `normalizeWall` garantiza
  // que `playlists[]` esté populado aunque el wall venga legacy.
  useEffect(() => {
    setDraft(normalizeWall(wall));
  }, [wall]);

  // Autosave 800ms (debounce inline — mismo patrón que SettingsPanel).
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

  // ---------------------------------------------------------------------------
  //  Slide ops — siempre operan sobre la playlist activa.
  // ---------------------------------------------------------------------------

  const addSlide = (slide: VideoWallSlide) => {
    updateDraft((d) => withActiveSlides(d, [...getActiveSlides(d), slide]));
  };

  const removeSlide = (id: string) => {
    updateDraft((d) =>
      withActiveSlides(
        d,
        getActiveSlides(d).filter((s) => s.id !== id),
      ),
    );
  };

  const reorderSlides = (fromIdx: number, toIdx: number) => {
    updateDraft((d) => {
      const slides = getActiveSlides(d);
      if (fromIdx < 0 || fromIdx >= slides.length) return d;
      if (toIdx < 0 || toIdx >= slides.length) return d;
      const next = [...slides];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return withActiveSlides(d, next);
    });
  };

  const updateSlide = (id: string, mut: (s: VideoWallSlide) => VideoWallSlide) => {
    updateDraft((d) =>
      withActiveSlides(
        d,
        getActiveSlides(d).map((s) => (s.id === id ? mut(s) : s)),
      ),
    );
  };

  // ---------------------------------------------------------------------------
  //  Playlist ops — add / rename / remove / select playlist.
  // ---------------------------------------------------------------------------

  const setActivePlaylist = (id: string) => {
    updateDraft((d) => {
      if (!d.playlists?.some((p) => p.id === id)) return d;
      const active = d.playlists.find((p) => p.id === id);
      return { ...d, activePlaylistId: id, playlist: active ? [...active.slides] : [] };
    });
  };

  const addPlaylist = (name: string): string => {
    let createdId = '';
    updateDraft((d) => {
      const existing = d.playlists ?? [];
      const id = makePlaylistId(existing);
      createdId = id;
      const trimmed = name.trim() || `Playlist ${existing.length + 1}`;
      const playlists = [...existing, { id, name: trimmed, slides: [] }];
      return { ...d, playlists, activePlaylistId: id, playlist: [] };
    });
    return createdId;
  };

  const renamePlaylist = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateDraft((d) => {
      const playlists = (d.playlists ?? []).map((p) => (p.id === id ? { ...p, name: trimmed } : p));
      return { ...d, playlists };
    });
  };

  const removePlaylist = (id: string) => {
    updateDraft((d) => {
      const playlists = (d.playlists ?? []).filter((p) => p.id !== id);
      if (playlists.length === 0) return d; // no borrar la última
      let activePlaylistId = d.activePlaylistId;
      if (activePlaylistId === id) {
        activePlaylistId = playlists[0].id;
      }
      const active = playlists.find((p) => p.id === activePlaylistId);
      return {
        ...d,
        playlists,
        activePlaylistId,
        playlist: active ? [...active.slides] : [],
      };
    });
  };

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

  const activeSlides = useMemo(() => getActiveSlides(draft), [draft]);
  const playlists = draft.playlists ?? [];
  const activePlaylistId = draft.activePlaylistId ?? null;

  const scheduleSlide = scheduleOpenForId
    ? activeSlides.find((s) => s.id === scheduleOpenForId)
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Playlist selector — tabs estilo kiosk con add/rename/delete inline. */}
      <PlaylistsBar
        playlists={playlists}
        activeId={activePlaylistId}
        onSelect={setActivePlaylist}
        onAdd={addPlaylist}
        onRename={renamePlaylist}
        onRemove={removePlaylist}
      />

      {/* Header con count + saving indicator + Add */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-white">Slides</h3>
          <p className="text-[11px] text-zinc-500">
            {activeSlides.length} slide{activeSlides.length === 1 ? '' : 's'} · drag to reorder
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          {saving && (
            <span className="inline-flex items-center gap-1 text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving
            </span>
          )}
          {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-3 w-3" strokeWidth={2.5} />
            Add slide
          </button>
        </div>
      </div>

      {/* Lista de slides */}
      <div className="flex-1 overflow-auto">
        {activeSlides.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-[12px] italic text-zinc-400 dark:border-zinc-800">
            No slides — click <strong>Add slide</strong> to create one.
          </p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {activeSlides.map((slide, idx) => (
              <SlideRow
                key={slide.id}
                index={idx + 1}
                slide={slide}
                grid={draft.grid}
                defaultTransition={draft.settings.defaultTransition}
                isDraggingThis={dragFromIdx === idx}
                isDragOver={dragOverIdx === idx && dragFromIdx !== null && dragFromIdx !== idx}
                isActiveInPreview={activeSlideId === slide.id}
                expanded={expandedIds.has(slide.id)}
                onToggleExpand={() => toggleExpand(slide.id)}
                onJumpToPreview={onSelectSlide ? () => onSelectSlide(slide.id) : undefined}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(idx, e)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                onUpdate={(patch) => updateSlide(slide.id, (s) => ({ ...s, ...patch }))}
                onUpdateSlots={(slots) => updateSlide(slide.id, (s) => ({ ...s, slots }))}
                onRemove={() => removeSlide(slide.id)}
                onOpenSchedule={(rect) => {
                  setScheduleAnchor(rect);
                  setScheduleOpenForId(slide.id);
                }}
              />
            ))}
          </ol>
        )}
      </div>

      <AddSlideModal
        open={showAdd}
        grid={draft.grid}
        defaultTransition={draft.settings.defaultTransition}
        defaultDurationMs={draft.settings.defaultDurationMs}
        onClose={() => setShowAdd(false)}
        onConfirm={addSlide}
      />

      {scheduleSlide ? (
        <SchedulePopover
          schedule={scheduleSlide.schedule}
          anchorRect={scheduleAnchor}
          onApply={(schedule) => updateSlide(scheduleSlide.id, (s) => ({ ...s, schedule }))}
          onClose={() => setScheduleOpenForId(null)}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  SlideRow — fila individual del playlist con drag/expand/edit inline.
// ---------------------------------------------------------------------------

interface SlideRowProps {
  index: number;
  slide: VideoWallSlide;
  grid: VideoWallConfig['grid'];
  defaultTransition: Transition;
  isDraggingThis: boolean;
  isDragOver: boolean;
  isActiveInPreview: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onJumpToPreview?: () => void;
  onDragStart: () => void;
  onDragOver: (e: DragEvent<HTMLLIElement>) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onUpdate: (patch: Partial<VideoWallSlide>) => void;
  onUpdateSlots: (slots: VideoWallSlotConfig[]) => void;
  onRemove: () => void;
  onOpenSchedule: (rect: DOMRect) => void;
}

function SlideRow({
  index,
  slide,
  grid,
  defaultTransition,
  isDraggingThis,
  isDragOver,
  isActiveInPreview,
  expanded,
  onToggleExpand,
  onJumpToPreview,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onUpdate,
  onUpdateSlots,
  onRemove,
  onOpenSchedule,
}: SlideRowProps) {
  const transition = slide.transition ?? defaultTransition;
  const scheduleLabel = describeSchedule(slide.schedule);
  const scheduleBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group rounded-lg border bg-white px-3 py-2.5 transition dark:bg-zinc-900/40 ${
        isDraggingThis
          ? 'border-zinc-400 opacity-50 dark:border-zinc-600'
          : isDragOver
            ? 'border-sky-400 ring-2 ring-sky-200 dark:border-sky-500 dark:ring-sky-500/30'
            : isActiveInPreview
              ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-500/20 dark:border-sky-400 dark:bg-sky-500/10 dark:ring-sky-400/20'
              : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center gap-2">
        <GripVertical
          className="h-3.5 w-3.5 cursor-grab text-zinc-400 active:cursor-grabbing dark:text-zinc-600"
          strokeWidth={2}
        />
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={expanded ? 'Collapse slot configurator' : 'Expand slot configurator'}
          title={expanded ? 'Hide slots' : 'Configure slots'}
          className="grid h-6 w-6 shrink-0 place-items-center rounded text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          )}
        </button>
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-zinc-100 font-mono text-[10.5px] font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {index}
        </span>
        {onJumpToPreview ? (
          <button
            type="button"
            onClick={onJumpToPreview}
            title={`Jump preview to ${formatTemplateLabel(slide.templateId)}`}
            className="flex-1 truncate text-left text-[12.5px] font-medium text-zinc-800 transition hover:text-sky-600 dark:text-zinc-200 dark:hover:text-sky-400"
          >
            {formatTemplateLabel(slide.templateId)}
          </button>
        ) : (
          <span className="flex-1 truncate text-[12.5px] font-medium text-zinc-800 dark:text-zinc-200">
            {formatTemplateLabel(slide.templateId)}
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Delete slide ${index}`}
          title="Delete slide"
          className="grid h-6 w-6 place-items-center rounded text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <label className="flex items-center gap-1 text-zinc-500">
          <span>duration</span>
          <input
            type="number"
            min="1"
            max="600"
            step="0.5"
            value={(slide.durationMs / 1000).toString()}
            onChange={(e) => {
              const seconds = parseFloat(e.target.value);
              if (Number.isNaN(seconds)) return;
              onUpdate({
                durationMs: Math.round(Math.min(Math.max(seconds, 1), 600) * 1000),
              });
            }}
            className="w-16 rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          />
          <span>s</span>
        </label>
        <select
          value={transition}
          onChange={(e) => onUpdate({ transition: e.target.value as Transition })}
          className={`rounded border bg-white px-1.5 py-0.5 font-mono text-[10.5px] dark:bg-zinc-900 ${
            slide.transition
              ? 'border-sky-200 text-sky-700 dark:border-sky-500/40 dark:text-sky-400'
              : 'border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300'
          }`}
          title={slide.transition ? 'override' : 'inherits default'}
        >
          {TRANSITION_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          ref={scheduleBtnRef}
          onClick={() => {
            const rect = scheduleBtnRef.current?.getBoundingClientRect();
            if (rect) onOpenSchedule(rect);
          }}
          title="Edit schedule"
          className={`rounded border px-1.5 py-0.5 font-mono text-[10.5px] transition dark:bg-zinc-900 ${
            slide.schedule.kind === 'always'
              ? 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300'
              : 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400'
          }`}
        >
          {slide.schedule.kind === 'always' ? 'always' : (scheduleLabel ?? 'schedule')}
        </button>
      </div>

      {expanded ? (
        <div className="mt-3">
          <SlideRowExpanded
            templateId={slide.templateId}
            grid={grid}
            slots={slide.slots}
            onSlotsChange={onUpdateSlots}
          />
        </div>
      ) : null}
    </li>
  );
}

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

/**
 * "02-video-image-ad" → "Video/Image + Ad". Quita el prefijo numérico,
 * fusiona duplicados y une con " + ".
 */
function formatTemplateLabel(templateId: string): string {
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

function describeSchedule(schedule: VideoWallSlideSchedule): string | null {
  if (schedule.kind === 'always') return null;
  if (schedule.kind === 'hours') {
    return `${schedule.startTime ?? '??'}–${schedule.endTime ?? '??'}`;
  }
  if (schedule.kind === 'date-range') {
    return `${schedule.startDate ?? '??'} → ${schedule.endDate ?? '??'}`;
  }
  return null;
}
