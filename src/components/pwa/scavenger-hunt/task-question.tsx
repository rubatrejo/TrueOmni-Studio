'use client';

import { useState } from 'react';

import { useHuntProgress } from '@/hooks/use-hunt-progress';
import type { ScavengerTask, PwaScavengerHuntConfig } from '@/lib/config';

import { PwaBottomNav } from '../bottom-nav';
import { S } from '../mobile-layer';
import { PwaAlertModal } from '../pwa-alert-modal';
import { PwaSubHeader } from '../pwa-sub-header';

import { TaskCompleted } from './task-completed';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface TaskQuestionProps {
  huntSlug: string;
  huntName: string;
  task: ScavengerTask;
  config: PwaScavengerHuntConfig;
  totalTasks: number;
}

/**
 * Question/Trivia Task: icono ? + pregunta + 4 opciones radio + CANCEL/CONTINUE.
 * Respuesta incorrecta → PwaAlertModal. Correcta → completed.
 */
export function TaskQuestion({ huntSlug, huntName, task, config, totalTasks }: TaskQuestionProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [wrongOpen, setWrongOpen] = useState(false);
  const { completeTask, isTaskCompleted } = useHuntProgress(huntSlug, totalTasks);

  if (isTaskCompleted(task.slug) || completed) {
    return (
      <TaskCompleted
        huntSlug={huntSlug}
        huntName={huntName}
        task={task}
        config={config}
        variant="question"
      />
    );
  }

  const handleContinue = () => {
    if (selected === null) return;
    if (selected === task.correctIndex) {
      completeTask(task.slug);
      setCompleted(true);
    } else {
      setWrongOpen(true);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-white">
      {/* Header */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title="Question Task" backHref={`/pwa/scavenger-hunt/${huntSlug}`} />
        </div>
      </div>

      <div className="scrollbar-hide flex-1 overflow-y-auto">
        {/* Icon + instruction */}
        <div className="flex flex-col items-center px-6 pb-4 pt-6">
          <div
            className="mb-3 flex h-[48px] w-[48px] items-center justify-center rounded-full text-[24px]"
            style={{ backgroundColor: '#c4a335' }}
          >
            <span className="font-bold text-white">?</span>
          </div>
          <p className="text-center text-[15px] font-bold text-gray-800" style={OPEN_SANS}>
            Answer this question correctly and complete this task
          </p>
        </div>

        {/* Question banner */}
        <div
          className="mx-4 mb-4 rounded-[10px] px-5 py-4"
          style={{ backgroundColor: 'hsl(var(--brand-primary) / 0.08)' }}
        >
          <p
            className="text-center text-[14px] font-semibold leading-snug"
            style={{ ...OPEN_SANS, color: 'hsl(var(--brand-primary))' }}
          >
            {task.question}
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-0 px-4">
          {task.options?.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className="flex items-center gap-3 border-b border-gray-100 py-[14px] text-left"
            >
              <div
                className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: selected === i ? 'hsl(var(--brand-primary))' : '#ccc',
                  backgroundColor: selected === i ? 'hsl(var(--brand-primary))' : 'transparent',
                }}
              >
                {selected === i && <div className="h-[8px] w-[8px] rounded-full bg-white" />}
              </div>
              <span className="text-[13px] text-gray-700" style={OPEN_SANS}>
                {opt}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex shrink-0 flex-col gap-2 px-4 pb-4 pt-2">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="w-full rounded-full border-2 py-[10px] text-center text-[12px] font-bold uppercase tracking-wider"
          style={{
            ...OPEN_SANS,
            borderColor: 'hsl(var(--brand-primary))',
            color: 'hsl(var(--brand-primary))',
          }}
        >
          {config.taskDetail.cancel}
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={selected === null}
          className="w-full rounded-full py-[10px] text-center text-[12px] font-bold uppercase tracking-wider text-white disabled:opacity-40"
          style={{ ...OPEN_SANS, backgroundColor: '#c4a335' }}
        >
          {config.taskDetail.continue}
        </button>
      </div>

      <PwaBottomNav />

      {/* Wrong answer dialog (mejora D) */}
      <PwaAlertModal
        open={wrongOpen}
        onClose={() => setWrongOpen(false)}
        title="Whoops!"
        body="Wrong answer, please try again"
        primaryCta="Retry"
        onPrimary={() => {
          setWrongOpen(false);
          setSelected(null);
        }}
        secondaryCta="Cancel"
        onSecondary={() => setWrongOpen(false)}
      />
    </div>
  );
}
