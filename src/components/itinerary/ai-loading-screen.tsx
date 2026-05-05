'use client';

import Image from 'next/image';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { resolveItineraryAsset } from '@/lib/itinerary-asset';

export interface AiLoadingScreenProps {
  title: string;
  body: string;
  backgroundImage: string;
}

/**
 * Pantalla de loading del AI Trip Builder. Background fullscreen con
 * gradient azul oscuro encima para legibilidad. Spinner circular azul + copy
 * centrado. Mientras `generateItinerary` resuelve.
 */
export function AiLoadingScreen({ title, body, backgroundImage }: AiLoadingScreenProps) {
  const bgSrc = resolveItineraryAsset(backgroundImage);
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center text-white"
      role="status"
      aria-live="polite"
    >
      {bgSrc ? (
        <Image src={bgSrc} alt="" fill sizes="1080px" className="object-cover" unoptimized priority />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(13,29,49,0.6) 0%, rgba(13,29,49,0.55) 100%)',
        }}
      />
      <div className="absolute" style={{ left: 65, top: 44, zIndex: 6 }}>
        <TrueOmniLogo className="h-[70px] w-auto text-white" />
      </div>
      <div className="relative z-10 flex flex-col items-center px-14 text-center">
        <h2 className="text-[78px] font-bold leading-tight tracking-tight drop-shadow-md">
          {title}
        </h2>
        <div className="my-14 h-[140px] w-[140px]">
          <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="92 327"
              transform="rotate(-90 60 60)"
            >
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0 60 60"
                to="360 60 60"
                dur="1.1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>
        <p
          className="max-w-[860px] text-[34px] font-medium leading-relaxed opacity-95"
          style={{ whiteSpace: 'pre-line' }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}
