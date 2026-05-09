'use client';

import { useEffect, useRef, useState } from 'react';

import type { SignageSlideSchedule } from '@/lib/signage/schema';

/**
 * `<SchedulePopover>` — Popover compacto edit schedule (DSS4).
 *
 * Soporta `always` y `hours` (con startTime + endTime). DSS4 NO incluye
 * `date-range` ni `daysOfWeek` granular — esos llegan en DSS4.5 si surge
 * necesidad.
 */
export interface SchedulePopoverProps {
  schedule: SignageSlideSchedule;
  onApply: (schedule: SignageSlideSchedule) => void;
  onClose: () => void;
  anchorRect: DOMRect | null;
}

export function SchedulePopover({ schedule, onApply, onClose, anchorRect }: SchedulePopoverProps) {
  const [kind, setKind] = useState<'always' | 'hours'>(
    schedule.kind === 'hours' ? 'hours' : 'always',
  );
  const [startTime, setStartTime] = useState(
    (schedule.kind === 'hours' && schedule.startTime) || '09:00',
  );
  const [endTime, setEndTime] = useState(
    (schedule.kind === 'hours' && schedule.endTime) || '18:00',
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  function handleApply() {
    if (kind === 'always') {
      onApply({ kind: 'always', hideOutsideSchedule: true });
    } else {
      onApply({
        kind: 'hours',
        startTime,
        endTime,
        hideOutsideSchedule: true,
      });
    }
    onClose();
  }

  const style = anchorRect
    ? {
        position: 'fixed' as const,
        top: anchorRect.bottom + 6,
        left: Math.max(8, Math.min(anchorRect.left, window.innerWidth - 320)),
      }
    : { position: 'fixed' as const, top: 100, left: 100 };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Edit schedule"
      style={style}
      className="z-50 w-[300px] rounded-xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="mb-3">
        <h4 className="font-display text-[13.5px] font-semibold text-zinc-900 dark:text-white">
          Schedule
        </h4>
        <p className="mt-0.5 text-[11.5px] text-zinc-500">When this slide is visible</p>
      </header>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setKind('always')}
          className={
            kind === 'always'
              ? 'flex-1 rounded-md bg-zinc-900 px-3 py-1.5 text-[11.5px] font-medium text-white dark:bg-white dark:text-zinc-900'
              : 'flex-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-zinc-600 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
          }
        >
          Always
        </button>
        <button
          type="button"
          onClick={() => setKind('hours')}
          className={
            kind === 'hours'
              ? 'flex-1 rounded-md bg-zinc-900 px-3 py-1.5 text-[11.5px] font-medium text-white dark:bg-white dark:text-zinc-900'
              : 'flex-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-zinc-600 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
          }
        >
          Hours
        </button>
      </div>

      {kind === 'hours' ? (
        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
            Start
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[11.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
            End
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[11.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            />
          </label>
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
