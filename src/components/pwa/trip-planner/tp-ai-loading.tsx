'use client';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { ItineraryAiConfig, PwaTripPlannerModuleConfig } from '@/lib/config';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/** Loading fullbleed mientras se "genera" el itinerario. */
export function TpAiLoading({
  ai,
  tp,
  textos,
  path,
}: {
  ai: ItineraryAiConfig;
  tp: PwaTripPlannerModuleConfig;
  textos: Record<string, string>;
  path: 'ai' | 'top';
}) {
  const title =
    path === 'ai' ? tp.ai.itineraryTitle : (textos.itinerary_top_title ?? 'Top Suggestions');
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${resolveAssetUrl(ai.loading_image)}")` }}
      >
        <div className="absolute inset-0 bg-black/55" />
      </div>
      <div
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-8"
        style={OPEN_SANS}
      >
        <p className="mb-6 text-[20px] font-bold text-white">{title}</p>
        <div
          className="mb-6 h-[54px] w-[54px] animate-spin rounded-full border-[4px] border-white/30"
          style={{ borderTopColor: '#fff' }}
        />
        <p className="whitespace-pre-line text-center text-[13px] leading-relaxed text-white/90">
          {textos.itinerary_ai_loading_body ??
            "We're building your perfect itinerary!\nThis might take a few seconds…"}
        </p>
      </div>
    </div>
  );
}
