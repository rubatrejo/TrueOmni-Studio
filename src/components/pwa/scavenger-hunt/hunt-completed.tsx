'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { ScavengerHunt, PwaScavengerHuntConfig } from '@/lib/config';

import { PwaBottomNav } from '../bottom-nav';
import { S } from '../mobile-layer';
import { PwaSubHeader } from '../pwa-sub-header';

import { HuntConfetti } from './hunt-confetti';
import { HuntSocialLinks } from './hunt-social-links';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface HuntCompletedProps {
  hunt: ScavengerHunt;
  config: PwaScavengerHuntConfig;
  /** Nombre del cliente activo (config.client.nombre) para interpolar `{client_name}`. */
  clientName: string;
}

/**
 * Pantalla 100% completado: fullbleed + círculo 100% + felicitación +
 * social links + DONE. Textos white-label: soportan `{client_name}`.
 */
export function HuntCompleted({ hunt, config, clientName }: HuntCompletedProps) {
  const router = useRouter();
  const bgSrc = resolveAssetUrl(hunt.image);
  const fill = (s: string) => s.replaceAll('{client_name}', clientName);

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
          {fill(config.hundredPercent.title)}
        </p>
        <p className="mb-4 text-center text-[12px] leading-relaxed text-white/80" style={OPEN_SANS}>
          {fill(config.hundredPercent.body)}
        </p>

        {/* Social links (logos oficiales, fuente única) */}
        <HuntSocialLinks socialLinks={config.socialLinks} />

        <p className="text-[11px] text-white/70" style={OPEN_SANS}>
          {fill(config.completed.hashtag)}
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

      <div className="relative z-10">
        <PwaBottomNav />
      </div>
    </div>
  );
}
