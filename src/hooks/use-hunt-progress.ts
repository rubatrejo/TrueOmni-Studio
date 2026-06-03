'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

interface TaskProgress {
  status: 'completed' | 'pending';
  completedAt?: string;
}

type HuntProgress = Record<string, TaskProgress>;

function getKey(huntSlug: string) {
  return `pwa-hunt-progress-${huntSlug}`;
}

function read(huntSlug: string): HuntProgress {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(getKey(huntSlug));
    return raw ? (JSON.parse(raw) as HuntProgress) : {};
  } catch {
    return {};
  }
}

function write(huntSlug: string, progress: HuntProgress) {
  localStorage.setItem(getKey(huntSlug), JSON.stringify(progress));
  window.dispatchEvent(new Event('hunt-progress'));
}

/** Subscribe/getSnapshot para useSyncExternalStore. */
function subscribe(cb: () => void) {
  window.addEventListener('storage', cb);
  window.addEventListener('hunt-progress', cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener('hunt-progress', cb);
  };
}

/**
 * Hook para el progreso de un Scavenger Hunt. Persiste en localStorage.
 * Reactivo: se re-renderiza al completar una task.
 */
export function useHuntProgress(huntSlug: string, totalTasks: number) {
  const progress = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(read(huntSlug)),
    () => '{}',
  );

  const parsed: HuntProgress = useMemo(() => JSON.parse(progress), [progress]);

  const completeTask = useCallback(
    (taskSlug: string) => {
      const current = read(huntSlug);
      current[taskSlug] = { status: 'completed', completedAt: new Date().toISOString() };
      write(huntSlug, current);
    },
    [huntSlug],
  );

  const completedCount = Object.values(parsed).filter((t) => t.status === 'completed').length;
  const completionPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const isCompleted = completedCount >= totalTasks && totalTasks > 0;
  const isTaskCompleted = (taskSlug: string) => parsed[taskSlug]?.status === 'completed';

  return {
    progress: parsed,
    completeTask,
    completedCount,
    totalTasks,
    completionPercent,
    isCompleted,
    isTaskCompleted,
  };
}
