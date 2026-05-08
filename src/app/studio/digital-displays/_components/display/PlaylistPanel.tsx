'use client';

import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

import type {
  SignageSlide,
  SignageSlideSchedule,
  SignageSlotConfig,
} from '@/lib/signage/schema';

import { useDisplayEditStore } from '../../_lib/display-edit-store';
import { useSignageJumpToSlide } from '../../_lib/signage-editor-context';

import { AddSlideModal } from './AddSlideModal';
import { SchedulePopover } from './SchedulePopover';
import { SlideRowExpanded } from './SlideRowExpanded';

/**
 * `<PlaylistPanel>` editable (DSS4).
 *
 * Drag-to-reorder con HTML5 native drag (sin lib externa). Cada slide row
 * tiene `draggable={true}`; durante el drag mostramos una barra azul
 * indicando la posición destino.
 *
 * Acciones por slide:
 *  - Inline edit: duration (input) + transition (select).
 *  - Click en pill schedule → abre `<SchedulePopover>`.
 *  - Trash icon → `removeSlide`.
 *
 * Botón "Add slide" abre `<AddSlideModal>`.
 */
export function PlaylistPanel() {
  const playlist = useDisplayEditStore((s) => s.draft?.playlist ?? []);
  const defaultTransition = useDisplayEditStore(
    (s) => s.draft?.settings.defaultTransition ?? 'cut',
  );
  const reorderSlides = useDisplayEditStore((s) => s.reorderSlides);
  const removeSlide = useDisplayEditStore((s) => s.removeSlide);
  const updateSlide = useDisplayEditStore((s) => s.updateSlide);
  const addSlide = useDisplayEditStore((s) => s.addSlide);
  const jumpToSlide = useSignageJumpToSlide();

  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [scheduleOpenForId, setScheduleOpenForId] = useState<string | null>(null);
  const [scheduleAnchor, setScheduleAnchor] = useState<DOMRect | null>(null);
  const [expandedSlideId, setExpandedSlideId] = useState<string | null>(null);

  function handleDragStart(idx: number) {
    setDragFromIdx(idx);
  }
  function handleDragOver(idx: number, e: React.DragEvent) {
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

  const scheduleSlide = scheduleOpenForId
    ? playlist.find((s) => s.id === scheduleOpenForId)
    : null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-[14px] font-semibold text-zinc-900 dark:text-white">
            Playlist
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-500">
            {playlist.length} slide{playlist.length === 1 ? '' : 's'} · drag to reorder
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          Add slide
        </button>
      </header>

      {playlist.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-[12px] italic text-zinc-400 dark:border-zinc-800">
          No slides — click <strong>Add slide</strong> to create one.
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {playlist.map((slide, idx) => (
            <SlideRow
              key={slide.id}
              index={idx + 1}
              slide={slide}
              defaultTransition={defaultTransition}
              isDraggingThis={dragFromIdx === idx}
              isDragOver={dragOverIdx === idx && dragFromIdx !== null && dragFromIdx !== idx}
              expanded={expandedSlideId === slide.id}
              onToggleExpand={() =>
                setExpandedSlideId(expandedSlideId === slide.id ? null : slide.id)
              }
              onJumpToPreview={
                jumpToSlide ? () => jumpToSlide(slide.id) : undefined
              }
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(idx, e)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              onUpdate={(patch) => updateSlide(slide.id, patch)}
              onUpdateSlots={(slots) => updateSlide(slide.id, { slots })}
              onRemove={() => removeSlide(slide.id)}
              onOpenSchedule={(rect) => {
                setScheduleAnchor(rect);
                setScheduleOpenForId(slide.id);
              }}
            />
          ))}
        </ol>
      )}

      <AddSlideModal
        open={showAdd}
        defaultTransition={defaultTransition}
        onClose={() => setShowAdd(false)}
        onConfirm={(slide) => addSlide(slide)}
      />

      {scheduleSlide ? (
        <SchedulePopover
          schedule={scheduleSlide.schedule}
          anchorRect={scheduleAnchor}
          onApply={(schedule) =>
            updateSlide(scheduleSlide.id, { schedule })
          }
          onClose={() => setScheduleOpenForId(null)}
        />
      ) : null}
    </section>
  );
}

interface SlideRowProps {
  index: number;
  slide: SignageSlide;
  defaultTransition: string;
  isDraggingThis: boolean;
  isDragOver: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onJumpToPreview?: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onUpdate: (patch: Partial<SignageSlide>) => void;
  onUpdateSlots: (slots: SignageSlotConfig[]) => void;
  onRemove: () => void;
  onOpenSchedule: (rect: DOMRect) => void;
}

function SlideRow({
  index,
  slide,
  defaultTransition,
  isDraggingThis,
  isDragOver,
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
                durationMs: Math.round(
                  Math.min(Math.max(seconds, 1), 600) * 1000,
                ),
              });
            }}
            className="w-16 rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          />
          <span>s</span>
        </label>
        <select
          value={transition}
          onChange={(e) =>
            onUpdate({
              transition: e.target.value as
                | 'cut'
                | 'fade'
                | 'slide-left'
                | 'slide-up',
            })
          }
          className={`rounded border bg-white px-1.5 py-0.5 font-mono text-[10.5px] dark:bg-zinc-900 ${
            slide.transition
              ? 'border-sky-200 text-sky-700 dark:border-sky-500/40 dark:text-sky-400'
              : 'border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300'
          }`}
          title={slide.transition ? 'override' : 'inherits default'}
        >
          <option value="cut">cut</option>
          <option value="fade">fade</option>
          <option value="slide-left">slide-left</option>
          <option value="slide-up">slide-up</option>
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
            slots={slide.slots}
            onSlotsChange={onUpdateSlots}
          />
        </div>
      ) : null}
    </li>
  );
}

/**
 * Formatea el `templateId` técnico (`01-full-events`, `06-video-news-ad`) en un
 * label amigable: "Full Events", "Video News Ad". Quita el prefijo numérico,
 * los guiones y capitaliza cada palabra.
 */
function formatTemplateLabel(templateId: string): string {
  const stripped = templateId.replace(/^\d+[-_]?/, '');
  if (!stripped) return templateId;
  return stripped
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function describeSchedule(schedule: SignageSlideSchedule): string | null {
  if (schedule.kind === 'always') return null;
  if (schedule.kind === 'hours') {
    return `${schedule.startTime ?? '??'}–${schedule.endTime ?? '??'}`;
  }
  if (schedule.kind === 'date-range') {
    return `${schedule.startDate ?? '??'} → ${schedule.endDate ?? '??'}`;
  }
  return null;
}
