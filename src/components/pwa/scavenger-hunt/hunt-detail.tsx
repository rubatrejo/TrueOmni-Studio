'use client';

import { useState } from 'react';

import { useHuntProgress } from '@/hooks/use-hunt-progress';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { ScavengerHunt, PwaScavengerHuntConfig } from '@/lib/config';

import { PwaBottomNav } from '../bottom-nav';
import { S } from '../mobile-layer';
import { PwaSubHeader } from '../pwa-sub-header';

import { HuntCompleted } from './hunt-completed';
import { HuntProgressBar } from './hunt-progress-bar';
import { HuntTaskList } from './hunt-task-list';
import { HuntTaskMap } from './hunt-task-map';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface HuntDetailProps {
  hunt: ScavengerHunt;
  config: PwaScavengerHuntConfig;
  mapboxToken: string;
}

/**
 * Detail de un hunt: barra de progreso + hero image + tabs Tasks/Map +
 * contenido. Si 100% → pantalla de celebración.
 */
export function HuntDetail({ hunt, config, mapboxToken }: HuntDetailProps) {
  const [tab, setTab] = useState<'tasks' | 'map'>('tasks');
  const { completionPercent, completedCount, isCompleted, isTaskCompleted } = useHuntProgress(
    hunt.slug,
    hunt.tasks.length,
  );

  if (isCompleted) {
    return <HuntCompleted hunt={hunt} config={config} />;
  }

  const heroSrc = resolveAssetUrl(hunt.image);

  return (
    <div className="relative flex h-full w-full flex-col bg-white">
      {/* Header */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={hunt.name} backHref="/pwa/scavenger-hunt" />
        </div>
      </div>

      {/* Progress bar */}
      <HuntProgressBar
        percent={completionPercent}
        completedCount={completedCount}
        totalTasks={hunt.tasks.length}
      />

      {/* Hero image */}
      <div
        className="relative mx-4 h-[130px] overflow-hidden rounded-[10px] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroSrc})` }}
      >
        <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span
          className="absolute bottom-10 left-3 rounded-full px-2 py-[2px] text-[9px] font-bold text-white"
          style={{ backgroundColor: 'hsl(var(--brand-primary))', ...OPEN_SANS }}
        >
          {hunt.tasks.length} TASKS
        </span>
        <span
          className="absolute bottom-3 left-3 text-[14px] font-bold text-white"
          style={OPEN_SANS}
        >
          {hunt.name}
        </span>
      </div>

      {/* Tabs */}
      <div className="mx-4 mt-2 flex overflow-hidden rounded-[6px] border border-gray-200">
        {(['tasks', 'map'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 py-[8px] text-center text-[12px] font-bold uppercase"
            style={{
              ...OPEN_SANS,
              color: tab === t ? '#fff' : 'hsl(var(--brand-primary))',
              backgroundColor: tab === t ? 'hsl(var(--brand-primary))' : 'transparent',
            }}
          >
            {t === 'tasks' ? 'Tasks' : 'Map'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {tab === 'tasks' ? (
          <div className="scrollbar-hide h-full overflow-y-auto">
            <HuntTaskList
              huntSlug={hunt.slug}
              tasks={hunt.tasks}
              isTaskCompleted={isTaskCompleted}
            />
          </div>
        ) : (
          <HuntTaskMap
            huntSlug={hunt.slug}
            tasks={hunt.tasks}
            token={mapboxToken}
            isTaskCompleted={isTaskCompleted}
          />
        )}
      </div>

      <PwaBottomNav />
    </div>
  );
}
