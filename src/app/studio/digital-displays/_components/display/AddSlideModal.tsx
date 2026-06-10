'use client';

import { useEffect, useRef, useState } from 'react';

import { useEscapeClose, useFocusTrap } from '@/app/studio/_lib/use-modal-a11y';
import type { SignageSlide } from '@/lib/signage/schema';

const TEMPLATE_OPTIONS: readonly { id: string; label: string }[] = [
  { id: '01-full-events', label: '01 · Full Events' },
  { id: '02-full-ad', label: '02 · Full Ad' },
  { id: '03-full-video-image', label: '03 · Full Video / Image' },
  { id: '04-video-events-ad', label: '04 · Video + Events + Ad' },
  { id: '05-video-2ads', label: '05 · Video + 2 Ads' },
  { id: '06-video-news-ad', label: '06 · Video + News + Ad' },
  { id: '07-video-social-ad', label: '07 · Video + Social + Ad' },
  { id: '08-video-social', label: '08 · Video + Social' },
] as const;

/**
 * `<AddSlideModal>` — Modal simple para añadir un slide al playlist (DSS4).
 *
 * 1 paso: selecciona templateId, duration en s, transition. Schedule default
 * `always`. Slots `[]` (DSS5 cablea module editors para configurarlos).
 *
 * Wizard 3 pasos elaborado se pospone a DSS4.5 si el patrón actual es
 * insuficiente. Por ahora la simplicidad gana.
 */
export interface AddSlideModalProps {
  open: boolean;
  defaultTransition: SignageSlide['transition'];
  onClose: () => void;
  onConfirm: (slide: SignageSlide) => void;
}

interface DraftState {
  templateId: string;
  durationS: number;
  transition: 'cut' | 'fade' | 'slide-left' | 'slide-up';
}

export function AddSlideModal({ open, defaultTransition, onClose, onConfirm }: AddSlideModalProps) {
  const [draft, setDraft] = useState<DraftState>({
    templateId: '01-full-events',
    durationS: 7,
    transition: (defaultTransition ?? 'cut') as DraftState['transition'],
  });

  // Reset draft cuando se abre.
  useEffect(() => {
    if (open) {
      setDraft({
        templateId: '01-full-events',
        durationS: 7,
        transition: (defaultTransition ?? 'cut') as DraftState['transition'],
      });
    }
  }, [open, defaultTransition]);

  // F-QA-4: Escape para cerrar + focus-trap (reemplaza el listener manual).
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useEscapeClose(open, onClose);
  useFocusTrap(open, dialogRef);

  if (!open) return null;

  function handleConfirm() {
    const id = `slide-${Date.now().toString(36)}`;
    onConfirm({
      id,
      templateId: draft.templateId,
      slots: [],
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Add slide"
        className="w-[420px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <header className="mb-4">
          <h3 className="font-display text-[16px] font-semibold text-zinc-900 dark:text-white">
            Add slide
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500">
            Select a template and basic settings. Module slots are configured after creation in
            DSS5.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[12px] text-zinc-500">
            Template
            <select
              value={draft.templateId}
              onChange={(e) => setDraft({ ...draft, templateId: e.target.value })}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

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
                setDraft({ ...draft, durationS: Math.min(Math.max(v, 1), 600) });
              }}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            />
          </label>

          <label className="flex flex-col gap-1 text-[12px] text-zinc-500">
            Transition
            <select
              value={draft.transition}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  transition: e.target.value as DraftState['transition'],
                })
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

        <div className="mt-5 flex justify-end gap-2">
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
            className="rounded-md bg-zinc-900 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add slide
          </button>
        </div>
      </div>
    </div>
  );
}
