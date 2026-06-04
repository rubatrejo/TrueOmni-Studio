'use client';

import { useRouter } from 'next/navigation';

import type { PwaScavengerHuntConfig, ScavengerTask } from '@/lib/config';
import { distanceMi } from '@/lib/itinerary-catalog';

import { TaskTypeIcon } from './task-type-icon';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface HuntTaskListProps {
  huntSlug: string;
  tasks: ScavengerTask[];
  isTaskCompleted: (slug: string) => boolean;
  config: PwaScavengerHuntConfig;
  /** Origen del cliente para calcular la distancia real a cada tarea. */
  clientCoords: { lat: number; lng: number };
}

/**
 * Lista de REMAINING TASKS con SVG icons por tipo. Tasks completadas se
 * muestran atenuadas con check. Labels y distancia salen de config (white-label).
 */
export function HuntTaskList({
  huntSlug,
  tasks,
  isTaskCompleted,
  config,
  clientCoords,
}: HuntTaskListProps) {
  const router = useRouter();
  const remaining = tasks.filter((t) => !isTaskCompleted(t.slug));
  const tl = config.taskList;

  const typeLabel = (type: ScavengerTask['type']) =>
    type === 'photo'
      ? (tl?.photoTask ?? 'Photo Task')
      : type === 'checkin'
        ? (tl?.checkinTask ?? 'Check-In Task')
        : (tl?.questionTask ?? 'Question Task');

  const distanceLabel = (t: ScavengerTask) => {
    const mi = distanceMi(clientCoords, t.coords);
    return (tl?.distanceAway ?? '{n} {unit} away')
      .replace('{n}', mi.toFixed(1))
      .replace('{unit}', tl?.unit ?? 'mi');
  };

  return (
    <div className="flex flex-col" style={OPEN_SANS}>
      <div className="px-4 pb-2 pt-3">
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: 'hsl(var(--brand-primary))' }}
        >
          {tl?.remainingTasks ?? 'Remaining Tasks'}
        </span>
      </div>
      {remaining.map((t) => (
        <button
          key={t.slug}
          type="button"
          onClick={() => router.push(`/pwa/scavenger-hunt/${huntSlug}/${t.slug}`)}
          className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-left"
        >
          <TaskTypeIcon type={t.type} size={38} />
          <div className="flex-1">
            <p className="text-[14px] font-bold text-gray-800">{typeLabel(t.type)}</p>
            <p className="text-[11px] text-gray-400">{distanceLabel(t)}</p>
          </div>
          <svg width={8} height={14} viewBox="0 0 8 14" fill="none" className="text-gray-300">
            <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
        </button>
      ))}
      {remaining.length === 0 && (
        <p className="px-4 py-6 text-center text-[13px] text-gray-400">
          {tl?.allCompleted ?? 'All tasks completed!'}
        </p>
      )}
    </div>
  );
}
