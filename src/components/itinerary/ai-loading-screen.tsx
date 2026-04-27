'use client';

import Image from 'next/image';

import { resolveItineraryAsset } from '@/lib/itinerary-asset';

export interface AiLoadingScreenProps {
  title: string;
  body: string;
  backgroundImage: string;
  /** Logo opcional del header. */
  logoSrc?: string;
}

/**
 * Pantalla de loading del AI Itinerary Builder. Background fullscreen con
 * gradient azul oscuro encima para legibilidad. Spinner circular azul + copy
 * centrado. Mientras `generateItinerary` resuelve.
 */
export function AiLoadingScreen({ title, body, backgroundImage, logoSrc }: AiLoadingScreenProps) {
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
      <div
        className="absolute"
        style={{ left: 0, top: 0, width: 1080, height: 230 }}
      >
        <div className="absolute" style={{ left: 65, top: 44 }}>
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt="logo"
              width={200}
              height={70}
              className="h-[70px] w-auto"
              unoptimized
            />
          ) : null}
        </div>
      </div>
      <div className="relative z-10 flex flex-col items-center px-12 text-center">
        <h2 className="text-[40px] font-semibold tracking-tight drop-shadow-md">{title}</h2>
        <div className="my-10 h-[80px] w-[80px]">
          <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="60 213"
              transform="rotate(-90 40 40)"
            >
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0 40 40"
                to="360 40 40"
                dur="1.1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>
        <p className="max-w-[600px] text-[19px] leading-relaxed opacity-95">{body}</p>
      </div>
    </div>
  );
}
