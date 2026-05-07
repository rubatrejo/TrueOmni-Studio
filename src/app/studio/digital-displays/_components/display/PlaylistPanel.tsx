'use client';

import { Plus } from 'lucide-react';

import type { SignageSlide } from '@/lib/signage/schema';

/**
 * `<PlaylistPanel>` — Read-only en DSS2.
 *
 * Lista cards compactas de slides en orden de rotación. Cada card muestra:
 *  - Index 1-based.
 *  - templateId (font-mono).
 *  - Duration en segundos.
 *  - Transition pill (default si el slide no override).
 *  - Schedule kind chip (always | hours · {start–end} | date-range).
 *
 * En DSS4 se reemplaza por drag-to-reorder + Add slide wizard.
 */
export interface PlaylistPanelProps {
  playlist: SignageSlide[];
  defaultTransition: string;
}

export function PlaylistPanel({ playlist, defaultTransition }: PlaylistPanelProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-[14px] font-semibold text-zinc-900 dark:text-white">
            Playlist
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-500">
            {playlist.length} slide{playlist.length === 1 ? '' : 's'} · drag-to-reorder
            in DSS4
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Add slide wizard comes in DSS4"
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600"
        >
          <Plus className="h-3 w-3" strokeWidth={2} />
          Add slide
        </button>
      </header>

      {playlist.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-[12px] italic text-zinc-400 dark:border-zinc-800">
          No slides configured
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {playlist.map((slide, idx) => (
            <SlideRow
              key={slide.id}
              index={idx + 1}
              slide={slide}
              defaultTransition={defaultTransition}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function SlideRow({
  index,
  slide,
  defaultTransition,
}: {
  index: number;
  slide: SignageSlide;
  defaultTransition: string;
}) {
  const transition = slide.transition ?? defaultTransition;
  const transitionIsOverride = Boolean(slide.transition);
  const scheduleLabel = describeSchedule(slide.schedule);
  return (
    <li className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-[12px] dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-zinc-100 font-mono text-[10.5px] font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {index}
        </span>
        <code className="flex-1 truncate font-mono text-[12px] text-zinc-800 dark:text-zinc-200">
          {slide.templateId}
        </code>
        <Pill>{(slide.durationMs / 1000).toFixed(0)}s</Pill>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
        <Pill
          variant={transitionIsOverride ? 'override' : 'default'}
          title={transitionIsOverride ? 'override' : 'inherits default'}
        >
          {transition}
        </Pill>
        {scheduleLabel ? <Pill variant="schedule">{scheduleLabel}</Pill> : null}
      </div>
    </li>
  );
}

function Pill({
  children,
  variant = 'default',
  title,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'override' | 'schedule';
  title?: string;
}) {
  const base = 'rounded px-1.5 py-0.5 font-mono text-[10.5px]';
  const variants = {
    default: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    override: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    schedule: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  } as const;
  return (
    <span className={`${base} ${variants[variant]}`} title={title}>
      {children}
    </span>
  );
}

function describeSchedule(schedule: SignageSlide['schedule']): string | null {
  if (schedule.kind === 'always') return null;
  if (schedule.kind === 'hours') {
    return `${schedule.startTime ?? '??'}–${schedule.endTime ?? '??'}`;
  }
  if (schedule.kind === 'date-range') {
    return `${schedule.startDate ?? '??'} → ${schedule.endDate ?? '??'}`;
  }
  return null;
}
