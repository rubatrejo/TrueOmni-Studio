'use client';

import type { ScavengerTask, PwaScavengerHuntConfig } from '@/lib/config';

import { usePwaSection } from '../pwa-bridge-context';

import { TaskCheckin } from './task-checkin';
import { TaskPhoto } from './task-photo';
import { TaskQuestion } from './task-question';

/**
 * Wrapper live del detalle de una tarea. Re-deriva el `hunt` y la `task` desde
 * el override del slice `features.pwa.scavengerHunt` por sus slugs, así una
 * edición de los textos de la tarea en el Studio se refleja en el preview. Cae
 * a la `task`/`config` del server fuera del Studio. El tipo de tarea es estable
 * (no editable), así que elige el componente como hace la page del server.
 */
export function TaskLive({
  huntSlug,
  taskSlug,
  huntName,
  task,
  config,
  totalTasks,
  mapboxToken,
  clientName,
}: {
  huntSlug: string;
  taskSlug: string;
  huntName: string;
  task: ScavengerTask;
  config: PwaScavengerHuntConfig;
  totalTasks: number;
  mapboxToken: string;
  clientName: string;
}) {
  const sh = usePwaSection('scavengerHunt', config) ?? config;
  const liveHunt = sh.hunts.find((h) => h.slug === huntSlug);
  const liveTask = liveHunt?.tasks.find((t) => t.slug === taskSlug) ?? task;

  const props = {
    huntSlug,
    huntName: liveHunt?.name ?? huntName,
    task: liveTask,
    config: sh,
    totalTasks: liveHunt?.tasks.length ?? totalTasks,
    mapboxToken,
    clientName,
  };

  if (liveTask.type === 'photo') return <TaskPhoto {...props} />;
  if (liveTask.type === 'checkin') return <TaskCheckin {...props} />;
  return <TaskQuestion {...props} />;
}
