'use client';

import { useEffect } from 'react';

import { useHuntProgress } from '@/hooks/use-hunt-progress';
import type { PwaScavengerHuntConfig } from '@/lib/config';

import { PwaBottomNav } from '../bottom-nav';
import { S } from '../mobile-layer';
import { PwaSubHeader } from '../pwa-sub-header';

import { HuntCard } from './hunt-card';
import { HuntWelcomeSheet } from './hunt-welcome-sheet';

/** Wrapper para leer progreso de un hunt individual. */
function HuntCardWithProgress({
  slug,
  name,
  image,
  tasks,
  tasksLabel,
  completedBanner,
}: {
  slug: string;
  name: string;
  image: string;
  tasks: { slug: string }[];
  tasksLabel: string;
  completedBanner: string;
}) {
  const { completionPercent, completedCount } = useHuntProgress(slug, tasks.length);
  return (
    <HuntCard
      slug={slug}
      name={name}
      image={image}
      completionPercent={completionPercent}
      completedCount={completedCount}
      totalTasks={tasks.length}
      tasksLabel={tasksLabel}
      completedBanner={completedBanner}
    />
  );
}

interface HuntDashboardProps {
  config: PwaScavengerHuntConfig;
}

export function HuntDashboard({ config }: HuntDashboardProps) {
  // Pre-seed one hunt as completed for demo
  useEffect(() => {
    const key = 'pwa-hunt-progress-friendship-park-city';
    if (typeof window !== 'undefined' && !localStorage.getItem(key)) {
      const fp = config.hunts.find((h) => h.slug === 'friendship-park-city');
      if (fp) {
        const progress: Record<string, { status: string; completedAt: string }> = {};
        fp.tasks.forEach((t) => {
          progress[t.slug] = { status: 'completed', completedAt: new Date().toISOString() };
        });
        localStorage.setItem(key, JSON.stringify(progress));
        window.dispatchEvent(new Event('hunt-progress'));
      }
    }
  }, [config.hunts]);

  return (
    <div className="relative flex h-full w-full flex-col bg-white">
      {/* Header */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={config.title} backHref="/pwa/dashboard" />
        </div>
      </div>

      {/* Grid de hunts */}
      <div className="scrollbar-hide flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 px-3 pb-5 pt-3">
          {config.hunts.map((h) => (
            <HuntCardWithProgress
              key={h.slug}
              slug={h.slug}
              name={h.name}
              image={h.image}
              tasks={h.tasks}
              tasksLabel={config.dashboard.tasksLabel}
              completedBanner={config.dashboard.completedBanner}
            />
          ))}
        </div>
      </div>

      {/* Welcome sheet */}
      <HuntWelcomeSheet
        title={config.welcome.title}
        description={config.welcome.description}
        taskTypes={config.welcome.taskTypes}
        button={config.welcome.button}
      />

      <PwaBottomNav />
    </div>
  );
}
