'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaScavengerHuntConfig, ScavengerTask } from '@/lib/config';

import { PwaBottomNav } from '../bottom-nav';
import { S } from '../mobile-layer';
import { PwaSubHeader } from '../pwa-sub-header';

import { HuntConfetti } from './hunt-confetti';
import { HuntSocialLinks } from './hunt-social-links';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface TaskCompletedProps {
  huntSlug: string;
  huntName: string;
  task: ScavengerTask;
  config: PwaScavengerHuntConfig;
  variant: 'photo' | 'checkin' | 'question';
  /** Nombre del cliente activo (config.client.nombre) para interpolar `{client_name}`. */
  clientName: string;
}

/**
 * Pantalla de éxito al completar una task. Fullbleed con imagen + overlay +
 * check + mensaje + social links + REMAINING TASKS / DONE. Textos white-label:
 * soportan `{client_name}`.
 */
export function TaskCompleted({
  huntSlug,
  huntName,
  task,
  config,
  variant,
  clientName,
}: TaskCompletedProps) {
  const router = useRouter();
  const bgSrc = resolveAssetUrl(task.image);
  const fill = (s: string) => s.replaceAll('{client_name}', clientName);
  const title = fill(
    variant === 'question' ? config.completed.correctTitle : config.completed.title,
  );

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Background fullbleed */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgSrc})` }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Confetti (mejora C) */}
      <HuntConfetti />

      {/* Header */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={huntName} backHref={`/pwa/scavenger-hunt/${huntSlug}`} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        {/* Check icon */}
        <div className="mb-4 flex h-[48px] w-[48px] items-center justify-center rounded-full border-2 border-white/80">
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p
          className="mb-4 whitespace-pre-line text-center text-[18px] font-bold leading-tight text-white"
          style={OPEN_SANS}
        >
          {title}
        </p>

        {/* Social links (logos oficiales, fuente única) */}
        <HuntSocialLinks socialLinks={config.socialLinks} />

        <p className="text-[11px] text-white/70" style={OPEN_SANS}>
          {fill(config.completed.hashtag)}
        </p>
      </div>

      {/* Buttons */}
      <div className="relative z-10 flex flex-col gap-2 px-6 pb-4">
        <button
          type="button"
          onClick={() => router.push(`/pwa/scavenger-hunt/${huntSlug}`)}
          className="w-full rounded-full border-2 border-white py-[10px] text-center text-[12px] font-bold uppercase tracking-wider text-white"
          style={OPEN_SANS}
        >
          {config.completed.remainingTasks}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/pwa/scavenger-hunt/${huntSlug}`)}
          className="w-full rounded-full py-[10px] text-center text-[12px] font-bold uppercase tracking-wider text-white"
          style={{ ...OPEN_SANS, backgroundColor: 'hsl(var(--brand-primary))' }}
        >
          {config.completed.done}
        </button>
      </div>

      <PwaBottomNav />
    </div>
  );
}
