'use client';

import { useRef, useState } from 'react';

import { useHuntProgress } from '@/hooks/use-hunt-progress';
import { useSafeTimeout } from '@/hooks/use-safe-timeout';
import type { ScavengerTask, PwaScavengerHuntConfig } from '@/lib/config';

import { PwaAlertModal } from '../pwa-alert-modal';

import { TaskCompleted } from './task-completed';
import { TaskDetailLayout } from './task-detail-layout';

interface TaskPhotoProps {
  huntSlug: string;
  huntName: string;
  task: ScavengerTask;
  config: PwaScavengerHuntConfig;
  totalTasks: number;
  mapboxToken?: string;
  clientName: string;
}

/**
 * Photo Task: muestra detalle del lugar + botón TAKE PHOTO que abre la
 * cámara nativa. Después de la foto muestra loading y luego completed.
 */
export function TaskPhoto({
  huntSlug,
  huntName,
  task,
  config,
  totalTasks,
  mapboxToken,
  clientName,
}: TaskPhotoProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(false);
  const { completeTask, isTaskCompleted } = useHuntProgress(huntSlug, totalTasks);
  const schedule = useSafeTimeout();

  if (isTaskCompleted(task.slug) || completed) {
    return (
      <TaskCompleted
        huntSlug={huntSlug}
        huntName={huntName}
        task={task}
        config={config}
        variant="photo"
        clientName={clientName}
      />
    );
  }

  const handleFile = () => {
    setLoading(true);
    // Simular validación (1.5s)
    schedule(() => {
      setLoading(false);
      completeTask(task.slug);
      setCompleted(true);
    }, 1500);
  };

  return (
    <>
      <TaskDetailLayout
        huntSlug={huntSlug}
        huntName={huntName}
        task={task}
        config={config}
        actionLabel={config.taskDetail.takePhoto}
        onAction={() => fileRef.current?.click()}
        mapboxToken={mapboxToken}
        loading={loading}
      />

      {/* Input cámara nativa (oculto) */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile();
        }}
      />

      {/* Error dialog (mejora D) */}
      <PwaAlertModal
        open={error}
        onClose={() => setError(false)}
        title={config.errors?.title ?? 'Whoops!'}
        body={config.errors?.photoFailed ?? 'Something went wrong, please try again.'}
        primaryCta={config.errors?.retry ?? 'Retry'}
        onPrimary={() => {
          setError(false);
          fileRef.current?.click();
        }}
        secondaryCta={config.errors?.cancel ?? 'Cancel'}
        onSecondary={() => setError(false)}
      />
    </>
  );
}
