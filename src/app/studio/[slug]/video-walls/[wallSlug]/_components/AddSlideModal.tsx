'use client';

import { useEffect, useMemo, useState } from 'react';

import { getTemplatesForGrid } from '@/components/video-walls/templates/registry';
import '@/components/video-walls/templates/load-templates';
import { defaultModuleFor } from '@/lib/signage/template-catalog';
import type { GridConfig } from '@/lib/video-walls/dimensions';
import type {
  VideoWallSettings,
  VideoWallSlide,
  VideoWallSlotConfig,
} from '@/lib/video-walls/schema';

/**
 * `<AddSlideModal>` (Video Walls) — modal para añadir un slide al wall.
 *
 * Lista los templates disponibles para `wall.grid` (filtra `placeholder`).
 * Cada template se renderiza como card con label + slot count + kinds.
 */
export interface AddSlideModalProps {
  open: boolean;
  grid: GridConfig;
  defaultTransition: VideoWallSettings['defaultTransition'];
  defaultDurationMs: VideoWallSettings['defaultDurationMs'];
  onClose: () => void;
  onConfirm: (slide: VideoWallSlide) => void;
}

type Transition = NonNullable<VideoWallSlide['transition']>;

interface DraftState {
  templateId: string;
  durationS: number;
  transition: Transition;
}

export function AddSlideModal({
  open,
  grid,
  defaultTransition,
  defaultDurationMs,
  onClose,
  onConfirm,
}: AddSlideModalProps) {
  const templates = useMemo(
    () => getTemplatesForGrid(grid).filter((t) => t.category !== 'placeholder'),
    [grid],
  );

  const [draft, setDraft] = useState<DraftState>(() => ({
    templateId: templates[0]?.id ?? '',
    durationS: Math.max(1, Math.round(defaultDurationMs / 1000)),
    transition: (defaultTransition ?? 'cut') as Transition,
  }));

  // Reset draft cuando se abre el modal.
  useEffect(() => {
    if (open) {
      setDraft({
        templateId: templates[0]?.id ?? '',
        durationS: Math.max(1, Math.round(defaultDurationMs / 1000)),
        transition: (defaultTransition ?? 'cut') as Transition,
      });
    }
  }, [open, defaultTransition, defaultDurationMs, templates]);

  // Cerrar con Esc.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleConfirm() {
    const tpl = templates.find((t) => t.id === draft.templateId);
    if (!tpl) return;
    const slots: VideoWallSlotConfig[] = tpl.slots.map((s) => ({
      slotKey: s.key,
      module: defaultModuleFor(s.acceptedModules[0] ?? 'video-image'),
    }));
    const id = `slide-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    onConfirm({
      id,
      templateId: tpl.id,
      slots,
      durationMs: Math.max(1000, Math.round(draft.durationS * 1000)),
      schedule: { kind: 'always', hideOutsideSchedule: true },
      transition: draft.transition,
    });
    onClose();
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add slide"
        className="w-[520px] max-w-[92vw] rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <header className="mb-4">
          <h3 className="font-display text-[16px] font-semibold text-zinc-900 dark:text-white">
            Add slide
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Pick a template for grid <code className="font-mono">{grid}</code>, then fine-tune
            duration and transition. Slot data can be edited after creation.
          </p>
        </header>

        {/* Template grid */}
        <div className="mb-4 flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Template
          </span>
          {templates.length === 0 ? (
            <p className="rounded-md border border-dashed border-zinc-300 px-3 py-4 text-center text-[12px] italic text-zinc-400 dark:border-zinc-800">
              No templates registered for grid <code className="font-mono">{grid}</code>.
            </p>
          ) : (
            <div className="grid max-h-[260px] grid-cols-2 gap-1.5 overflow-auto pr-1">
              {templates.map((t) => {
                const isActive = draft.templateId === t.id;
                const kinds = Array.from(new Set(t.slots.flatMap((s) => s.acceptedModules)));
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, templateId: t.id }))}
                    className={
                      isActive
                        ? 'flex flex-col items-start gap-1 rounded-md border-2 border-sky-500 bg-sky-50 px-3 py-2 text-left transition dark:border-sky-400 dark:bg-sky-500/10'
                        : 'flex flex-col items-start gap-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-left transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                    }
                  >
                    <span
                      className={
                        isActive
                          ? 'text-[12px] font-semibold text-sky-900 dark:text-sky-100'
                          : 'text-[12px] font-semibold text-zinc-900 dark:text-white'
                      }
                    >
                      {t.label}
                    </span>
                    <span className="text-[10.5px] text-zinc-500">
                      {t.slots.length} slot{t.slots.length === 1 ? '' : 's'} · {kinds.join(' / ')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Duration + transition */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-[12px] text-zinc-500">
            Duration (seconds)
            <input
              type="number"
              min="1"
              max="600"
              step="0.5"
              value={draft.durationS}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (Number.isNaN(v)) return;
                setDraft((d) => ({ ...d, durationS: Math.min(Math.max(v, 1), 600) }));
              }}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-zinc-500">
            Transition
            <select
              value={draft.transition}
              onChange={(e) =>
                setDraft((d) => ({ ...d, transition: e.target.value as Transition }))
              }
              className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <option value="cut">cut</option>
              <option value="fade">fade</option>
              <option value="slide-left">slide-left</option>
              <option value="slide-up">slide-up</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!draft.templateId}
            className="rounded-md bg-zinc-900 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add slide
          </button>
        </div>
      </div>
    </div>
  );
}
