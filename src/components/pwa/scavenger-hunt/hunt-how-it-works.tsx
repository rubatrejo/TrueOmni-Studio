'use client';

import type { PwaScavengerHuntConfig } from '@/lib/config';

import { PwaBottomNav } from '../bottom-nav';
import { S } from '../mobile-layer';
import { PwaSubHeader } from '../pwa-sub-header';

import { TaskTypeIcon } from './task-type-icon';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface HuntHowItWorksProps {
  config: PwaScavengerHuntConfig;
}

export function HuntHowItWorks({ config }: HuntHowItWorksProps) {
  const hiw = config.howItWorks;

  return (
    <div className="relative flex h-full w-full flex-col bg-white">
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={hiw.title} backHref="/pwa/scavenger-hunt" />
        </div>
      </div>

      <div className="scrollbar-hide flex-1 overflow-y-auto px-5 pb-6 pt-4" style={OPEN_SANS}>
        <p className="mb-6 text-[13px] leading-relaxed text-gray-600">{hiw.description}</p>

        <h3 className="mb-4 text-[14px] font-bold uppercase tracking-wider text-gray-800">
          Types of Tasks
        </h3>

        {hiw.taskTypes.map((t) => (
          <div
            key={t.icon}
            className="mb-4 flex items-start gap-3 border-b border-gray-100 pb-4 last:border-b-0"
          >
            <TaskTypeIcon type={t.icon} size={40} />
            <div>
              <p className="text-[13px] font-bold text-gray-800">{t.title}</p>
              <p className="text-[12px] text-gray-500">{t.description}</p>
            </div>
          </div>
        ))}
      </div>

      <PwaBottomNav />
    </div>
  );
}
