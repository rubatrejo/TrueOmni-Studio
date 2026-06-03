'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { ScavengerHunt, PwaScavengerHuntConfig } from '@/lib/config';

import { PwaBottomNav } from '../bottom-nav';
import { S } from '../mobile-layer';
import { PwaSubHeader } from '../pwa-sub-header';

import { HuntConfetti } from './hunt-confetti';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface HuntCompletedProps {
  hunt: ScavengerHunt;
  config: PwaScavengerHuntConfig;
}

/**
 * Pantalla 100% completado: fullbleed + círculo 100% + felicitación +
 * social links + DONE.
 */
export function HuntCompleted({ hunt, config }: HuntCompletedProps) {
  const router = useRouter();
  const bgSrc = resolveAssetUrl(hunt.image);

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Background fullbleed */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgSrc})` }}
      >
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <HuntConfetti />

      {/* Header */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={hunt.name} backHref="/pwa/scavenger-hunt" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        {/* 100% circle */}
        <div className="mb-4 flex h-[80px] w-[80px] items-center justify-center rounded-full border-[3px] border-white/60 bg-white/10">
          <span className="text-[24px] font-bold text-white" style={OPEN_SANS}>
            100%
          </span>
        </div>

        <p
          className="mb-3 text-center text-[15px] font-bold leading-snug text-white"
          style={OPEN_SANS}
        >
          {config.hundredPercent.title}
        </p>
        <p className="mb-4 text-center text-[12px] leading-relaxed text-white/80" style={OPEN_SANS}>
          {config.hundredPercent.body}
        </p>

        {/* Social links */}
        {config.socialLinks && (
          <div className="mb-2 flex items-center gap-3">
            {config.socialLinks.x && (
              <a
                href={config.socialLinks.x}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/20 text-[12px] text-white"
              >
                𝕏
              </a>
            )}
            {config.socialLinks.facebook && (
              <a
                href={config.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/20 text-[12px] text-white"
              >
                f
              </a>
            )}
            {config.socialLinks.instagram && (
              <a
                href={config.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/20 text-[12px] text-white"
              >
                📷
              </a>
            )}
            {config.socialLinks.youtube && (
              <a
                href={config.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/20 text-[12px] text-white"
              >
                ▶
              </a>
            )}
          </div>
        )}
        <p className="text-[11px] text-white/70" style={OPEN_SANS}>
          {config.completed.hashtag}
        </p>
      </div>

      {/* Done button */}
      <div className="relative z-10 px-6 pb-4">
        <button
          type="button"
          onClick={() => router.push('/pwa/scavenger-hunt')}
          className="w-full rounded-full py-[10px] text-center text-[12px] font-bold uppercase tracking-wider text-white"
          style={{ ...OPEN_SANS, backgroundColor: 'hsl(var(--brand-primary))' }}
        >
          {config.hundredPercent.done}
        </button>
      </div>

      <PwaBottomNav />
    </div>
  );
}
